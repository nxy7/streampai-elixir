defmodule Streampai.Stream.StreamAction do
  @moduledoc """
  Ash resource for stream management actions.

  This is a stateless resource (no database storage) that provides
  authorization-aware actions for controlling live streams. It delegates
  to the LivestreamManager GenServer processes while enforcing policies.

  All actions require an actor and validate permissions before executing.
  """
  use Ash.Resource,
    domain: Streampai.Stream,
    data_layer: :embedded,
    extensions: [AshTypescript.Resource],
    authorizers: [Ash.Policy.Authorizer]

  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwner
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwnerOrModerator
  alias Streampai.Stream.StreamEvent

  require Logger

  typescript do
    type_name("StreamAction")
  end

  code_interface do
    define :start_stream
    define :stop_stream
    define :update_stream_metadata
    define :send_message
    define :ban_user
    define :unban_user
    define :timeout_user
  end

  actions do
    defaults []

    action :start_stream, :map do
      description "Start streaming on selected (or all) connected platforms"

      argument :user_id, :uuid, allow_nil?: false

      argument :title, :string do
        allow_nil? true
        constraints max_length: 200
      end

      argument :description, :string do
        allow_nil? true
        constraints max_length: 2000
      end

      argument :platforms, {:array, :atom}, allow_nil?: true
      argument :metadata, :map, default: %{}

      run fn input, _context ->
        user_id = input.arguments.user_id
        args = input.arguments

        metadata =
          args.metadata
          |> maybe_put(:title, Map.get(args, :title))
          |> maybe_put(:description, Map.get(args, :description))
          |> maybe_put(:platforms, Map.get(args, :platforms))

        case StreamManager.start_stream(user_id, metadata) do
          {:ok, livestream_id} ->
            {:ok,
             %{
               success: true,
               livestream_id: livestream_id,
               message: "Stream started successfully"
             }}

          {:error, reason} ->
            {:error, reason}
        end
      end
    end

    action :stop_stream, :map do
      description "Stop streaming on all platforms"

      argument :user_id, :uuid, allow_nil?: false

      run fn input, _context ->
        user_id = input.arguments.user_id

        case StreamManager.stop_stream(user_id) do
          :ok ->
            {:ok, %{success: true, message: "Stream stopped successfully"}}

          {:error, reason} ->
            {:error, reason}
        end
      end
    end

    action :update_stream_metadata, :map do
      description "Update stream title, description, or other metadata"

      argument :user_id, :uuid, allow_nil?: false

      argument :title, :string do
        allow_nil? true
        constraints max_length: 200
      end

      argument :description, :string do
        allow_nil? true
        constraints max_length: 2000
      end

      argument :tags, {:array, :string} do
        allow_nil? true
        constraints max_length: 20, items: [max_length: 50]
      end

      argument :thumbnail_file_id, :uuid, allow_nil?: true
      argument :platforms, {:array, :atom}, default: [:all]

      run fn input, context ->
        user_id = input.arguments.user_id
        platforms = input.arguments.platforms
        args = input.arguments
        actor = context.actor

        metadata =
          %{}
          |> maybe_put(:title, Map.get(args, :title))
          |> maybe_put(:description, Map.get(args, :description))
          |> maybe_put(:tags, Map.get(args, :tags))
          |> maybe_put(:thumbnail_file_id, Map.get(args, :thumbnail_file_id))

        if map_size(metadata) == 0 do
          {:error, "No metadata provided to update"}
        else
          handle_metadata_update(user_id, metadata, platforms, actor)
        end
      end
    end

    action :toggle_platform, :map do
      description "Enable or disable a specific platform mid-stream"

      argument :user_id, :uuid, allow_nil?: false
      argument :platform, :atom, allow_nil?: false
      argument :enabled, :boolean, allow_nil?: false

      run fn input, _context ->
        user_id = input.arguments.user_id
        platform = input.arguments.platform
        enabled = input.arguments.enabled

        case StreamManager.toggle_platform(user_id, platform, enabled) do
          :ok -> {:ok, %{platform: platform, enabled: enabled}}
          {:error, reason} -> {:error, inspect(reason)}
        end
      end
    end

    action :send_message, :map do
      description "Send a chat message to stream platforms"

      argument :user_id, :uuid, allow_nil?: false

      argument :message, :string do
        allow_nil? false
        constraints max_length: 500
      end

      argument :platforms, {:array, :atom}, default: [:all]

      run fn input, _context ->
        user_id = input.arguments.user_id
        message = input.arguments.message
        platforms = input.arguments.platforms

        if rate_limited?(:send_message, user_id, 10, 10_000) do
          {:error, "Rate limit exceeded. Please wait before sending more messages."}
        else
          user_id_string = to_string(user_id)

          # Create a StreamEvent for the sent message with pending delivery status
          sent_event_id =
            case get_livestream_from_manager(user_id_string) do
              {:ok, livestream_id} ->
                target_platforms = resolve_target_platforms(user_id_string, platforms)

                delivery_status =
                  Map.new(target_platforms, fn p -> {to_string(p), "pending"} end)

                event_attrs = %{
                  type: :chat_message,
                  data: %{
                    "type" => "chat_message",
                    "message" => message,
                    "username" => "You",
                    "is_sent_by_streamer" => true,
                    "delivery_status" => delivery_status
                  },
                  author_id: user_id_string,
                  platform: nil,
                  user_id: user_id,
                  livestream_id: livestream_id,
                  viewer_id: nil
                }

                case StreamEvent.create(event_attrs, authorize?: false) do
                  {:ok, event} -> event.id
                  _ -> nil
                end

              _ ->
                nil
            end

          case StreamManager.send_chat_message(
                 user_id_string,
                 message,
                 platforms,
                 sent_event_id
               ) do
            :ok ->
              {:ok, %{success: true, message: "Message sent successfully"}}

            {:error, reason} ->
              {:error, reason}
          end
        end
      end
    end

    action :ban_user, :map do
      description "Ban a user from the stream chat"

      argument :user_id, :uuid, allow_nil?: false
      argument :target_username, :string, allow_nil?: false
      argument :platform, :atom, allow_nil?: false
      argument :reason, :string, allow_nil?: true

      run fn _input, _context ->
        # TODO: Implement ban_user in StreamManager
        # user_id = input.arguments.user_id
        # platform = input.arguments.platform
        # username = input.arguments.target_username
        {:error, "ban_user not yet implemented"}
      end
    end

    action :unban_user, :map do
      description "Unban a user from the stream chat"

      argument :user_id, :uuid, allow_nil?: false
      argument :target_username, :string, allow_nil?: false
      argument :platform, :atom, allow_nil?: false

      run fn _input, _context ->
        # TODO: Implement unban_user in StreamManager
        {:error, "unban_user not yet implemented"}
      end
    end

    action :timeout_user, :map do
      description "Timeout a user from the stream chat for a specified duration"

      argument :user_id, :uuid, allow_nil?: false
      argument :target_username, :string, allow_nil?: false
      argument :platform, :atom, allow_nil?: false
      argument :duration_seconds, :integer, allow_nil?: false

      run fn _input, _context ->
        # TODO: Implement timeout_user in StreamManager
        {:error, "timeout_user not yet implemented"}
      end
    end
  end

  policies do
    bypass AshOban.Checks.AshObanInteraction do
      authorize_if always()
    end

    policy action(:start_stream) do
      description "Only the stream owner can start their stream"
      authorize_if IsStreamOwner
      access_type :strict
    end

    policy action(:stop_stream) do
      description "Only the stream owner can stop their stream"
      authorize_if IsStreamOwner
      access_type :strict
    end

    policy action(:toggle_platform) do
      description "Only the stream owner can toggle platforms"
      authorize_if IsStreamOwner
      access_type :strict
    end

    policy action(:update_stream_metadata) do
      description "Stream owner and moderators can update metadata"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:send_message) do
      description "Stream owner and moderators can send messages"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:ban_user) do
      description "Stream owner and moderators can ban users"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:unban_user) do
      description "Stream owner and moderators can unban users"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:timeout_user) do
      description "Stream owner and moderators can timeout users"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp handle_metadata_update(user_id, metadata, platforms, actor) do
    user_id_string = to_string(user_id)

    # Step 1: Get current livestream from StreamManager (not DB)
    livestream_id_result = get_livestream_from_manager(user_id_string)

    Logger.info(
      "Livestream ID result for user #{user_id_string}: #{inspect(livestream_id_result)}"
    )

    # Step 2: Update platform settings first
    case StreamManager.update_stream_metadata(user_id_string, metadata, platforms) do
      :ok ->
        Logger.info("Successfully updated platform metadata for user #{user_id_string}")

        # Step 3: Update CurrentStreamData so frontend sees changes via Electric
        CurrentStreamData.update_metadata(user_id_string, metadata)

        # Step 4: Persist event to database (if streaming)
        persist_metadata_event(livestream_id_result, user_id, metadata, actor)

        {:ok, %{success: true, message: "Metadata updated successfully"}}

      {:error, reason} ->
        Logger.error("Failed to update platform metadata: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp get_livestream_from_manager(user_id) do
    user_id_string = to_string(user_id)

    try do
      state = StreamManager.get_state(user_id_string)
      Logger.debug("StreamState for user #{user_id_string}: #{inspect(state)}")

      if is_nil(state.livestream_id) do
        # Only log in non-test environments to reduce test noise
        if Application.get_env(:streampai, :env) != :test do
          Logger.warning(
            "No livestream_id in state for user #{user_id_string}, state: #{inspect(state)}"
          )
        end

        {:error, :not_found}
      else
        Logger.info("Found livestream_id in state: #{state.livestream_id}")
        {:ok, state.livestream_id}
      end
    catch
      :exit, reason ->
        # Only log in non-test environments to reduce test noise
        if Application.get_env(:streampai, :env) != :test do
          Logger.warning("Exit when getting state for user #{user_id_string}: #{inspect(reason)}")
        end

        {:error, :not_found}
    end
  end

  defp persist_metadata_event({:ok, livestream_id}, user_id, metadata, actor) do
    Logger.info("Persisting stream_updated event for livestream #{livestream_id}")
    actor_username = actor.email
    actor_id = to_string(actor.id)

    # Get the current thumbnail URL to include in the event
    thumbnail_url = get_current_thumbnail_url(user_id)

    event_metadata = %{
      "username" => actor_username,
      "title" => metadata[:title],
      "description" => metadata[:description],
      "thumbnail_url" => thumbnail_url,
      "user" => %{
        "id" => actor.id,
        "email" => actor.email
      }
    }

    Logger.debug("Event metadata: #{inspect(event_metadata)}")

    case StreamEvent.create_stream_updated(
           livestream_id,
           user_id,
           actor_id,
           event_metadata,
           actor: actor
         ) do
      {:ok, event} ->
        Logger.info("Successfully persisted stream_updated event to database: #{event.id}")
        :ok

      {:error, reason} ->
        Logger.error("Failed to persist stream_updated event: #{inspect(reason)}")
        :ok
    end
  end

  defp persist_metadata_event({:error, :not_found}, user_id, _metadata, _actor) do
    # Only log in non-test environments to reduce test noise
    if Application.get_env(:streampai, :env) != :test do
      Logger.warning("No active livestream found for user #{user_id}, skipping event persistence")
    end

    :ok
  end

  defp get_current_thumbnail_url(user_id) do
    require Ash.Query

    case Streampai.Stream.Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.load([:thumbnail_url, thumbnail_file: [:url]])
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [stream]} ->
        stream.thumbnail_url

      _ ->
        nil
    end
  end

  # Simple ETS-based rate limiter.
  # Returns true if rate limited, false if allowed.
  # max_count requests allowed per window_ms milliseconds.
  defp rate_limited?(action, user_id, max_count, window_ms) do
    table = ensure_rate_limit_table()
    key = {action, user_id}
    now = System.monotonic_time(:millisecond)
    cutoff = now - window_ms

    case :ets.lookup(table, key) do
      [{^key, timestamps}] ->
        # Prune old entries on every check to prevent unbounded growth
        recent = Enum.filter(timestamps, &(&1 > cutoff))

        if length(recent) >= max_count do
          # Still store pruned list to reclaim memory
          :ets.insert(table, {key, recent})
          true
        else
          :ets.insert(table, {key, [now | recent]})
          false
        end

      [] ->
        :ets.insert(table, {key, [now]})
        false
    end
  end

  defp resolve_target_platforms(user_id, platforms) do
    case platforms do
      :all ->
        get_active_platform_names(user_id)

      [:all] ->
        get_active_platform_names(user_id)

      platforms when is_list(platforms) ->
        platforms
    end
  end

  defp get_active_platform_names(user_id) do
    registry = Streampai.LivestreamManager.RegistryHelpers.get_registry_name()

    Registry.select(registry, [
      {{{:platform_manager, user_id, :"$1"}, :_, :_}, [], [:"$1"]}
    ])
  end

  defp ensure_rate_limit_table do
    table = :stream_action_rate_limits

    case :ets.whereis(table) do
      :undefined ->
        :ets.new(table, [:set, :public, :named_table, read_concurrency: true])

      _ref ->
        table
    end
  end
end
