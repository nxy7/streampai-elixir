defmodule StreampaiWeb.LiveHelpers do
  @moduledoc """
  Common helpers and patterns for LiveView modules.

  This module provides consistent patterns for:
  - Error handling
  - Flash message management
  - Socket state management
  - Common LiveView operations
  """

  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamEvent
  alias StreampaiWeb.Utils.FormatHelpers

  require Logger

  @max_chat_messages 50
  @max_stream_events 20

  @doc """
  Handles errors consistently across LiveViews with user-friendly messages.

  ## Examples

      {:error, :not_found} -> handle_error(socket, :not_found, "Resource not found")
      {:error, changeset} -> handle_error(socket, changeset)
  """
  def handle_error(socket, error_type, custom_message \\ nil)

  def handle_error(socket, :not_found, custom_message) do
    message = custom_message || "The requested resource was not found."
    put_flash(socket, :error, message)
  end

  def handle_error(socket, :unauthorized, custom_message) do
    message = custom_message || "You don't have permission to perform this action."
    put_flash(socket, :error, message)
  end

  def handle_error(socket, :timeout, custom_message) do
    message = custom_message || "The request timed out. Please try again."
    put_flash(socket, :error, message)
  end

  def handle_error(socket, %Ecto.Changeset{} = changeset, custom_message) do
    message = custom_message || format_changeset_errors(changeset)
    put_flash(socket, :error, message)
  end

  def handle_error(socket, error, custom_message) when is_binary(error) do
    message = custom_message || error
    put_flash(socket, :error, message)
  end

  def handle_error(socket, _error, custom_message) do
    message = custom_message || "Something went wrong. Please try again."
    put_flash(socket, :error, message)
  end

  @doc """
  Shows a success message with consistent styling.
  """
  def show_success(socket, message) do
    put_flash(socket, :info, message)
  end

  @doc """
  Shows a warning message with consistent styling.
  """
  def show_warning(socket, message) do
    put_flash(socket, :warning, message)
  end

  @doc """
  Safely loads data with error handling.

  ## Examples

      safe_load(socket, fn -> Dashboard.get_dashboard_data(user) end, :dashboard_data)
  """
  def safe_load(socket, load_fn, assign_key, error_message \\ nil) do
    case load_fn.() do
      {:ok, data} ->
        assign(socket, assign_key, data)

      {:error, reason} ->
        socket
        |> handle_error(reason, error_message)
        |> assign(assign_key, nil)

      data when not is_tuple(data) ->
        assign(socket, assign_key, data)
    end
  rescue
    exception ->
      error_msg = error_message || "Failed to load data: #{Exception.message(exception)}"

      socket
      |> handle_error(error_msg)
      |> assign(assign_key, nil)
  end

  @doc """
  Handles form submissions with consistent error handling.

  ## Examples

      handle_form_submit(socket, fn -> create_user(params) end, "User created successfully!")
  """
  def handle_form_submit(socket, submit_fn, success_message \\ "Operation completed successfully!") do
    case submit_fn.() do
      {:ok, _result} ->
        socket
        |> show_success(success_message)
        |> then(fn s -> {:noreply, s} end)

      {:error, %Ecto.Changeset{} = changeset} ->
        socket
        |> handle_error(changeset)
        |> assign(:changeset, changeset)
        |> then(fn s -> {:noreply, s} end)

      {:error, reason} ->
        socket
        |> handle_error(reason)
        |> then(fn s -> {:noreply, s} end)
    end
  rescue
    exception ->
      socket
      |> handle_error("Operation failed: #{Exception.message(exception)}")
      |> then(fn s -> {:noreply, s} end)
  end

  @doc """
  Validates required assigns are present in socket.

  ## Examples

      validate_assigns(socket, [:current_user, :dashboard_data])
  """
  def validate_assigns(socket, required_assigns) do
    missing = Enum.reject(required_assigns, &Map.has_key?(socket.assigns, &1))

    case missing do
      [] ->
        {:ok, socket}

      missing_assigns ->
        error_msg = "Missing required data: #{Enum.join(missing_assigns, ", ")}"
        {:error, handle_error(socket, error_msg)}
    end
  end

  @doc """
  Standardized mount pattern for dashboard pages.
  """
  def mount_dashboard_page(socket, load_data_fn) do
    case validate_assigns(socket, [:current_user]) do
      {:ok, socket} ->
        socket = safe_load(socket, load_data_fn, :page_data)
        {:ok, socket, layout: false}

      {:error, socket} ->
        {:ok, socket, layout: false}
    end
  end

  @doc """
  Standardized mount pattern for dashboard pages.
  """
  def reload_current_user(socket) do
    previous_current_user = socket.assigns.current_user

    assign(
      socket,
      :current_user,
      User.get_by_id!(%{id: previous_current_user.id}, actor: previous_current_user)
    )
  end

  @doc """
  Handles platform disconnection with consistent patterns.
  """
  def handle_platform_disconnect(socket, platform) do
    require Ash.Query
    require Logger

    current_user = socket.assigns.current_user
    platform_atom = if is_binary(platform), do: String.to_existing_atom(platform), else: platform

    Logger.debug("Attempting to disconnect platform: #{inspect(platform_atom)} for user: #{current_user.id}")

    # First, find the streaming account using the unique index
    user_id = current_user.id

    query =
      StreamingAccount
      |> Ash.Query.for_read(:read, %{}, actor: current_user)
      |> Ash.Query.filter(user_id: user_id, platform: platform_atom)

    case Ash.read(query, actor: current_user) do
      {:ok, [account]} ->
        Logger.debug("Found account to disconnect: #{inspect(account)}")

        # Then destroy it
        case StreamingAccount.destroy(account, actor: current_user) do
          :ok ->
            Logger.info("Successfully disconnected #{platform_atom} for user #{current_user.id}")

            # Refresh platform connections and usage data
            platform_connections = Streampai.Dashboard.get_platform_connections(current_user)
            user_data = Streampai.Dashboard.get_dashboard_data(current_user)

            {:noreply,
             socket
             |> reload_current_user()
             |> assign(:platform_connections, platform_connections)
             |> assign(:usage, user_data.usage)
             |> show_success("Successfully disconnected #{String.capitalize(to_string(platform_atom))} account")}

          {:error, reason} ->
            Logger.error("Failed to destroy account: #{inspect(reason)}")
            {:noreply, handle_error(socket, reason, "Failed to disconnect account")}
        end

      {:ok, []} ->
        Logger.warning("No account found for platform: #{inspect(platform_atom)}, user: #{current_user.id}")

        {:noreply, handle_error(socket, :not_found, "Platform account not found")}

      {:ok, accounts} ->
        Logger.warning("Multiple accounts found (#{length(accounts)}): #{inspect(accounts)}")
        {:noreply, handle_error(socket, :multiple_found, "Multiple accounts found")}

      {:error, reason} ->
        Logger.error("Failed to read accounts: #{inspect(reason)}")
        {:noreply, handle_error(socket, reason, "Failed to find account to disconnect")}
    end
  end

  @doc """
  Handles toggle form submissions (checkboxes).
  Extracts the common pattern from settings forms.
  """
  def handle_toggle_form(socket, params, field_map, update_fn) do
    updated_values =
      Map.new(field_map, fn {field, key} ->
        {key, Map.get(params, field) == "on"}
      end)

    update_fn.(socket, updated_values)
  end

  @doc """
  Common pattern for config updates with PubSub broadcasting.
  """
  def broadcast_and_save_config(user_id, config_type, config_data, topic_suffix \\ nil) do
    topic =
      if topic_suffix do
        "widget_config:#{config_type}:#{user_id}"
      else
        "widget_config:#{user_id}"
      end

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      topic,
      %{config: config_data}
    )
  end

  @doc """
  Subscribes to all stream-related PubSub channels for a given user.
  Should be called in mount/3 after Phoenix.LiveView.connected?/1 check.
  """
  def subscribe_to_stream_channels(user_id) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "cloudflare_input:#{user_id}")
    Phoenix.PubSub.subscribe(Streampai.PubSub, "stream_status:#{user_id}")
    Phoenix.PubSub.subscribe(Streampai.PubSub, "viewer_counts:#{user_id}")
    Phoenix.PubSub.subscribe(Streampai.PubSub, "chat:#{user_id}")
    Phoenix.PubSub.subscribe(Streampai.PubSub, "stream_events:#{user_id}")
    :ok
  end

  @doc """
  Gets the current active livestream ID for a user.
  Returns {:ok, livestream_id} or {:error, :not_found}
  """
  def get_current_livestream_id(user_id) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [livestream]} -> {:ok, livestream.id}
      _ -> {:error, :not_found}
    end
  end

  @doc """
  Loads recent chat messages and stream events for a livestream.
  Returns {chat_messages, stream_events} tuple.
  """
  def load_recent_activity(livestream_id) do
    require Ash.Query

    try do
      chat_messages =
        ChatMessage
        |> Ash.Query.for_read(:read)
        |> Ash.Query.filter(livestream_id == ^livestream_id)
        |> Ash.Query.sort(inserted_at: :desc)
        |> Ash.Query.limit(@max_chat_messages)
        |> Ash.read!(authorize?: false)
        |> Enum.reverse()
        |> Enum.map(&format_chat_message/1)

      stream_events =
        StreamEvent
        |> Ash.Query.for_read(:read)
        |> Ash.Query.filter(livestream_id == ^livestream_id)
        |> Ash.Query.sort(inserted_at: :desc)
        |> Ash.Query.limit(@max_stream_events)
        |> Ash.read!(authorize?: false)
        |> Enum.reverse()
        |> Enum.map(&format_stream_event/1)

      Logger.info("Loaded #{length(chat_messages)} messages and #{length(stream_events)} events")

      {chat_messages, stream_events}
    rescue
      e ->
        Logger.error("load_recent_activity: Exception: #{inspect(e)}")
        {[], []}
    end
  end

  @doc """
  Loads recent activity if stream is active, otherwise returns empty lists.
  """
  def load_recent_activity_if_streaming(user_id, %{status: :streaming}) do
    case get_current_livestream_id(user_id) do
      {:ok, livestream_id} -> load_recent_activity(livestream_id)
      _ -> {[], []}
    end
  end

  def load_recent_activity_if_streaming(_user_id, _stream_status), do: {[], []}

  # Private helpers

  defp format_changeset_errors(changeset), do: FormatHelpers.format_changeset_errors(changeset)

  defp format_chat_message(message) do
    %{
      id: message.id,
      sender_username: message.sender_username,
      message: message.message,
      platform: to_string(message.platform),
      timestamp: DateTime.to_iso8601(message.inserted_at)
    }
  end

  defp format_stream_event(event) do
    username =
      get_in(event.data, ["username"]) || get_in(event.data, ["user", "display_name"]) ||
        get_in(event.data, ["user", "email"]) || "Unknown"

    platform_name =
      get_in(event.data, ["platform"]) || (event.platform && to_string(event.platform))

    base_event = %{
      id: event.id,
      type: to_string(event.type),
      username: username,
      amount: get_in(event.data, ["amount"]),
      tier: get_in(event.data, ["tier"]),
      viewers: get_in(event.data, ["viewers"]),
      platform: platform_name,
      timestamp: DateTime.to_iso8601(event.inserted_at)
    }

    # Add metadata for stream_updated events
    if event.type == :stream_updated do
      Map.put(base_event, :metadata, %{
        title: get_in(event.data, ["title"]),
        description: get_in(event.data, ["description"]),
        thumbnail_url: get_in(event.data, ["thumbnail_url"])
      })
    else
      base_event
    end
  end
end
