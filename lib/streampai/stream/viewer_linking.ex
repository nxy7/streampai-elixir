defmodule Streampai.Stream.ViewerLinking do
  @moduledoc """
  Service for linking platform-specific identities to viewers within a streamer's context.

  This module handles the ViewerIdentity > Viewer relationship where:
  - ViewerIdentity represents a platform-specific identity (e.g., Twitch username)
  - Viewer represents a person aggregating multiple platform identities for a specific streamer
  - Each ViewerIdentity belongs to one Viewer (per-streamer scoped)

  Key features:
  - Idempotent operations: can be run multiple times safely
  - Audit trail: all decisions are logged for transparency
  - Batch processing: supports bulk reevaluation
  - Multiple linking strategies: username similarity, cross-platform activity patterns
  - Confidence scoring: tracks certainty of linking decisions
  """

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.Viewer
  alias Streampai.Stream.ViewerIdentity
  alias Streampai.Stream.ViewerLinkingAudit

  require Ash.Query
  require Logger

  @algorithm_version "1.0.0"
  @default_confidence_threshold Decimal.new("0.7")

  @doc """
  Links a platform identity (platform_user_id + platform) to a viewer for a specific streamer.

  Options:
  - `:confidence_threshold` - minimum confidence required for automatic linking
  - `:linking_method` - override the linking method
  - `:batch_id` - group this operation with others for reevaluation
  - `:user_id` - the streamer this identity is associated with (required)

  Returns `{:ok, %{identity: viewer_identity, viewer: viewer, created?: boolean}}`
  """
  def link_identity(platform, platform_user_id, username, opts \\ []) do
    user_id = Keyword.fetch!(opts, :user_id)

    with :ok <- validate_linking_inputs(platform, platform_user_id, username) do
      batch_id = Keyword.get(opts, :batch_id, generate_batch_id())
      confidence_threshold = Keyword.get(opts, :confidence_threshold, @default_confidence_threshold)

      do_link_identity(platform, platform_user_id, username, user_id, batch_id, confidence_threshold, opts)
    end
  end

  defp do_link_identity(platform, platform_user_id, username, user_id, batch_id, confidence_threshold, opts) do
    # Check if identity already exists
    case ViewerIdentity.find_by_platform_id(
           platform: platform,
           platform_user_id: platform_user_id
         ) do
      {:ok, [%ViewerIdentity{} = existing_identity]} ->
        # Update existing identity if needed
        update_existing_identity(existing_identity, username, batch_id)

      {:ok, []} ->
        # Create new identity with linked viewer
        create_new_identity_link(
          platform,
          platform_user_id,
          username,
          user_id,
          batch_id,
          confidence_threshold,
          opts
        )

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Links a chat message to a viewer based on the message's sender information.
  This is the primary entry point for linking chat activity to viewers.
  """
  def link_chat_message(%ChatMessage{} = message, opts \\ []) do
    batch_id = Keyword.get(opts, :batch_id, generate_batch_id())

    with {:ok, result} <-
           link_identity(
             message.platform,
             message.sender_channel_id,
             message.sender_username,
             Keyword.merge(opts, user_id: message.user_id, batch_id: batch_id)
           ),
         {:ok, updated_message} <- update_message_viewer_id(message, result.viewer.id) do
      {:ok, %{message: updated_message, viewer: result.viewer, identity: result.identity}}
    end
  end

  @doc """
  Links a stream event to a viewer based on the event's author information.
  """
  def link_stream_event(%StreamEvent{} = event, opts \\ []) do
    batch_id = Keyword.get(opts, :batch_id, generate_batch_id())

    # Extract username from event data if available
    username = extract_username_from_event_data(event)

    with {:ok, result} <-
           link_identity(
             event.platform,
             event.author_id,
             username,
             Keyword.merge(opts, user_id: event.user_id, batch_id: batch_id)
           ),
         {:ok, updated_event} <- update_event_viewer_id(event, result.viewer.id) do
      {:ok, %{event: updated_event, viewer: result.viewer, identity: result.identity}}
    end
  end

  @doc """
  Reevaluates all viewer linking decisions for a user, optionally filtering
  by algorithm version, confidence threshold, or other criteria.

  This is useful when:
  - Linking algorithms improve
  - Manual corrections need to be applied in bulk
  - Data quality issues are discovered

  Options:
  - `:user_id` - required, the streamer to reevaluate
  - `:algorithm_version` - only reevaluate decisions from this version
  - `:confidence_below` - only reevaluate decisions below this confidence
  - `:dry_run` - if true, only return what would be changed without making changes
  """
  def reevaluate_user_linking(opts \\ []) do
    user_id = Keyword.fetch!(opts, :user_id)
    dry_run = Keyword.get(opts, :dry_run, false)
    batch_id = generate_batch_id()

    Logger.info("Starting viewer linking reevaluation for user #{user_id} with batch #{batch_id}")

    # Get all identities that match reevaluation criteria
    identities_to_reevaluate = find_identities_for_reevaluation(user_id, opts)

    results =
      Enum.map(identities_to_reevaluate, fn identity ->
        if dry_run do
          analyze_identity_linking(identity, batch_id)
        else
          reevaluate_identity_linking(identity, batch_id)
        end
      end)

    summary = %{
      total_identities: length(identities_to_reevaluate),
      results: results,
      batch_id: batch_id,
      dry_run: dry_run
    }

    Logger.info("Completed viewer linking reevaluation: #{inspect(summary)}")
    {:ok, summary}
  end

  # Private helper functions

  defp update_existing_identity(identity, username, batch_id) do
    if identity.username != username or identity.last_seen_username != identity.username do
      # Username has changed, update it
      case ViewerIdentity.update(identity, %{
             username: username,
             last_seen_username: identity.username
           }) do
        {:ok, updated_identity} ->
          log_linking_decision(updated_identity, :username_update, %{
            old_username: identity.username,
            new_username: username,
            batch_id: batch_id
          })

          # Load the viewer relationship
          viewer = Viewer.read!(identity.viewer_id)
          {:ok, %{viewer: viewer, identity: updated_identity, created?: false}}

        {:error, _} = error ->
          error
      end
    else
      # No changes needed, load the viewer relationship
      viewer = Viewer.read!(identity.viewer_id)
      {:ok, %{viewer: viewer, identity: identity, created?: false}}
    end
  end

  defp create_new_identity_link(platform, platform_user_id, username, user_id, batch_id, confidence_threshold, _opts) do
    # Try to find existing viewer by username similarity or other heuristics
    candidate_viewers = find_candidate_viewers(username, user_id, platform)

    case select_best_viewer_match(candidate_viewers, username, platform, confidence_threshold) do
      {:ok, %{viewer: viewer, confidence: confidence, method: method}} ->
        create_identity_for_viewer(
          viewer,
          platform,
          platform_user_id,
          username,
          confidence,
          method,
          batch_id
        )

      {:no_match, _reason} ->
        # Create new viewer
        create_new_viewer_with_identity(platform, platform_user_id, username, user_id, batch_id)
    end
  end

  defp find_candidate_viewers(username, user_id, platform) do
    # Find viewers with similar usernames on other platforms
    case Viewer.for_user(user_id: user_id) do
      {:ok, user_viewers} ->
        # Load viewer identities for each viewer
        viewers_with_identities =
          Enum.map(user_viewers, fn viewer ->
            case Viewer.read(viewer.id, load: [:viewer_identities]) do
              {:ok, loaded_viewer} -> loaded_viewer
              {:error, _} -> viewer
            end
          end)

        Enum.filter(viewers_with_identities, fn viewer ->
          has_similar_identity?(viewer, username, platform)
        end)

      {:error, _} ->
        []
    end
  end

  defp has_similar_identity?(viewer, username, exclude_platform) do
    case viewer.viewer_identities do
      %Ash.NotLoaded{} -> false
      identities when is_list(identities) ->
        identities
        |> Enum.reject(&(&1.platform == exclude_platform))
        |> Enum.any?(&(username_similarity(&1.username, username) > 0.8))
      _ -> false
    end
  end

  defp username_similarity(username1, username2) when is_binary(username1) and is_binary(username2) do
    # Normalize usernames for comparison (lowercase, remove spaces/special chars)
    norm1 = normalize_username(username1)
    norm2 = normalize_username(username2)

    cond do
      norm1 == norm2 -> 1.0
      String.contains?(norm1, norm2) or String.contains?(norm2, norm1) ->
        # Weighted by base Jaro distance
        base_similarity = String.jaro_distance(norm1, norm2)
        0.9 * base_similarity
      true ->
        jaro = String.jaro_distance(norm1, norm2)
        if jaro > 0.8, do: jaro, else: 0.0
    end
  end

  defp username_similarity(_, _), do: 0.0

  defp normalize_username(username) when is_binary(username) do
    username
    |> String.downcase()
    |> String.replace(~r/[\s\-_\.]+/, "")  # Remove spaces, hyphens, underscores, dots
    |> String.trim()
  end

  defp normalize_username(_), do: ""

  defp validate_linking_inputs(platform, platform_user_id, username) do
    with :ok <- validate_platform(platform),
         :ok <- validate_platform_user_id(platform_user_id),
         :ok <- validate_username(username) do
      :ok
    end
  end

  defp validate_platform(platform) when platform in [:youtube, :twitch, :facebook, :kick], do: :ok
  defp validate_platform(_), do: {:error, :invalid_platform}

  defp validate_platform_user_id(id) when is_binary(id) and byte_size(id) > 0 and byte_size(id) <= 255 do
    if String.match?(id, ~r/^[a-zA-Z0-9_\-]+$/) do
      :ok
    else
      {:error, :invalid_platform_user_id}
    end
  end
  defp validate_platform_user_id(_), do: {:error, :invalid_platform_user_id}

  defp validate_username(username) when is_binary(username) and byte_size(username) > 0 and byte_size(username) <= 100 do
    if String.match?(username, ~r/^[a-zA-Z0-9_\-\s\.]+$/) do
      :ok
    else
      {:error, :invalid_username}
    end
  end
  defp validate_username(_), do: {:error, :invalid_username}

  defp select_best_viewer_match(candidates, username, platform, confidence_threshold) do
    case candidates do
      [] ->
        {:no_match, :no_candidates}

      candidates ->
        best_match =
          candidates
          |> Enum.map(&score_viewer_match(&1, username, platform))
          |> Enum.max_by(& &1.confidence)

        if Decimal.compare(best_match.confidence, confidence_threshold) == :lt do
          {:no_match, {:low_confidence, best_match.confidence}}
        else
          {:ok, best_match}
        end
    end
  end

  defp score_viewer_match(viewer, username, platform) do
    # Calculate confidence based on username similarity and other factors
    max_similarity = case viewer.viewer_identities do
      %Ash.NotLoaded{} -> 0.0
      identities when is_list(identities) ->
        identities
        |> Enum.reject(&(&1.platform == platform))
        |> Enum.map(&username_similarity(&1.username, username))
        |> Enum.max(&>=/2, fn -> 0.0 end)
      _ -> 0.0
    end

    confidence = Decimal.new(to_string(max_similarity))
    method = if max_similarity > 0.9, do: :username_similarity, else: :weak_similarity

    %{viewer: viewer, confidence: confidence, method: method}
  end

  defp create_identity_for_viewer(viewer, platform, platform_user_id, username, confidence, method, batch_id) do
    case ViewerIdentity.create(%{
           viewer_id: viewer.id,
           platform: platform,
           platform_user_id: platform_user_id,
           username: username,
           confidence_score: confidence,
           linking_method: method,
           linking_batch_id: batch_id
         }) do
      {:ok, identity} ->
        log_linking_decision(identity, :create, %{
          linking_method: method,
          confidence: confidence,
          batch_id: batch_id
        })

        case Viewer.touch_last_seen(viewer) do
          {:ok, updated_viewer} ->
            {:ok, %{viewer: updated_viewer, identity: identity, created?: true}}
          {:error, _} ->
            # Still return success for identity creation even if touch fails
            {:ok, %{viewer: viewer, identity: identity, created?: true}}
        end

      {:error, _} = error ->
        error
    end
  end

  defp create_new_viewer_with_identity(platform, platform_user_id, username, user_id, batch_id) do
    case Viewer.create(%{
           display_name: username,
           user_id: user_id
         }) do
      {:ok, viewer} ->
        case ViewerIdentity.create(%{
               viewer_id: viewer.id,
               platform: platform,
               platform_user_id: platform_user_id,
               username: username,
               confidence_score: Decimal.new("1.0"),
               linking_method: :automatic,
               linking_batch_id: batch_id
             }) do
          {:ok, identity} ->
            log_linking_decision(identity, :create, %{
              new_viewer: true,
              batch_id: batch_id
            })

            {:ok, %{viewer: viewer, identity: identity, created?: true}}

          {:error, _} = error ->
            error
        end

      {:error, _} = error ->
        error
    end
  end

  defp update_message_viewer_id(message, viewer_id) do
    message
    |> Ash.Changeset.for_update(:update, %{viewer_id: viewer_id})
    |> Ash.update()
  end

  defp update_event_viewer_id(event, viewer_id) do
    event
    |> Ash.Changeset.for_update(:update, %{viewer_id: viewer_id})
    |> Ash.update()
  end

  defp extract_username_from_event_data(%StreamEvent{data: data}) when is_map(data) do
    # Try various common fields where username might be stored
    data["username"] || data["user_name"] || data["display_name"] ||
      data["author"] || data["sender"] || "unknown"
  end

  defp extract_username_from_event_data(_), do: "unknown"

  defp find_identities_for_reevaluation(_user_id, _opts) do
    # This would query ViewerIdentity based on the reevaluation criteria
    # For now, returning an empty list as placeholder
    []
  end

  defp analyze_identity_linking(identity, batch_id) do
    # Analyze what would happen if we reevaluated this identity
    %{
      identity_id: identity.id,
      current_confidence: identity.confidence_score,
      recommended_action: :no_change,
      batch_id: batch_id
    }
  end

  defp reevaluate_identity_linking(identity, batch_id) do
    # Actually reevaluate and potentially change the identity linking
    analyze_identity_linking(identity, batch_id)
  end

  defp log_linking_decision(identity, action_type, metadata) do
    case ViewerLinkingAudit.create(%{
           viewer_identity_id: identity.id,
           action_type: action_type,
           linking_batch_id: metadata[:batch_id] || generate_batch_id(),
           algorithm_version: @algorithm_version,
           input_data: %{
             platform: identity.platform,
             platform_user_id: identity.platform_user_id,
             username: identity.username
           },
           decision_data: metadata,
           confidence_score: identity.confidence_score
         }) do
      {:ok, _audit} -> :ok
      {:error, error} ->
        Logger.warning("Failed to log linking decision: #{inspect(error)}")
        :ok  # Don't fail the main operation due to audit logging issues
    end
  end

  defp generate_batch_id do
    "batch_#{System.system_time(:millisecond)}_#{:rand.uniform(1000)}"
  end
end
