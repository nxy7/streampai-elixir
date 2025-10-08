defmodule StreampaiWeb.DashboardModerateStreamLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.LiveHelpers

  alias Ash.Error.Forbidden
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole
  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamAction

  require Logger

  @max_chat_messages 50
  @max_stream_events 20

  def mount_page(socket, %{"user_id" => target_user_id}, _session) do
    moderator_id = socket.assigns.current_user.id

    # Verify this user is actually a moderator for the target user
    case verify_moderator_permission(moderator_id, target_user_id) do
      {:ok, target_user} ->
        # Subscribe to stream status, chat and events for the target user
        if Phoenix.LiveView.connected?(socket) do
          subscribe_to_stream_channels(target_user_id)
        end

        stream_status = get_stream_status(target_user_id)
        stream_data = load_stream_data(target_user_id, stream_status)
        stream_metadata = load_last_stream_metadata(target_user_id)

        # Load recent chat messages and events if streaming
        {chat_messages, stream_events} =
          load_recent_activity_if_streaming(target_user_id, stream_status)

        socket =
          socket
          |> assign(:page_title, "Moderate Stream - #{target_user.name || target_user.email}")
          |> assign(:target_user, target_user)
          |> assign(:target_user_id, target_user_id)
          |> assign(:stream_status, stream_status)
          |> assign(:stream_data, stream_data)
          |> assign(:stream_metadata, stream_metadata)
          |> assign(:loading, false)
          |> assign(:show_stream_key, false)
          |> assign(:chat_messages, chat_messages)
          |> assign(:stream_events, stream_events)

        {:ok, socket, layout: false}

      {:error, :not_authorized} ->
        socket =
          socket
          |> put_flash(:error, "You don't have moderator permissions for this user")
          |> Phoenix.LiveView.redirect(to: "/dashboard/moderate")

        {:ok, socket, layout: false}
    end
  end

  def handle_event("send_message", %{"message" => message}, socket) when message != "" do
    target_user_id = socket.assigns.target_user_id

    case StreamAction.send_message(
           %{user_id: target_user_id, message: message, platforms: [:all]},
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        {:noreply, socket}

      {:error, %Forbidden{}} ->
        {:noreply, put_flash(socket, :error, "Not authorized to send messages")}

      {:error, reason} ->
        Logger.error("Failed to send chat message: #{inspect(reason)}")
        {:noreply, put_flash(socket, :error, "Failed to send message")}
    end
  end

  def handle_event("send_message", _params, socket), do: {:noreply, socket}

  def handle_event("update_metadata", %{"title" => title, "description" => description}, socket) do
    target_user_id = socket.assigns.target_user_id

    metadata = %{
      title: title,
      description: description
    }

    case StreamAction.update_stream_metadata(
           %{
             user_id: target_user_id,
             title: title,
             description: description,
             platforms: [:all]
           },
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        # Broadcast stream settings update event
        event = %{
          id: Ash.UUID.generate(),
          type: :stream_settings_updated,
          username: socket.assigns.current_user.email,
          metadata: metadata,
          timestamp: DateTime.utc_now()
        }

        Phoenix.PubSub.broadcast(
          Streampai.PubSub,
          "stream_events:#{target_user_id}",
          {:stream_settings_updated, event}
        )

        {:noreply, put_flash(socket, :info, "Stream metadata updated successfully")}

      {:error, %Forbidden{}} ->
        {:noreply, put_flash(socket, :error, "Not authorized to update stream metadata")}

      {:error, reason} ->
        Logger.error("Failed to update metadata: #{inspect(reason)}")
        {:noreply, put_flash(socket, :error, "Failed to update stream metadata")}
    end
  end

  def handle_info({:chat_message, chat_event}, socket) do
    chat_messages = socket.assigns[:chat_messages] || []

    formatted_message = %{
      id: chat_event.id,
      sender_username: chat_event.username,
      message: chat_event.message,
      platform: to_string(chat_event.platform),
      timestamp: chat_event.timestamp || DateTime.utc_now()
    }

    updated_messages = Enum.take([formatted_message | chat_messages], @max_chat_messages)

    {:noreply, assign(socket, :chat_messages, updated_messages)}
  end

  def handle_info({:stream_settings_updated, event}, socket) do
    stream_events = socket.assigns[:stream_events] || []

    formatted_event = %{
      id: event.id,
      type: "stream_settings_updated",
      username: event.username,
      metadata: event.metadata,
      timestamp: event.timestamp
    }

    updated_events = Enum.take([formatted_event | stream_events], @max_stream_events)

    # Also update the stream_metadata so moderators see the latest settings in the form
    stream_metadata =
      socket.assigns.stream_metadata
      |> Map.put(:title, event.metadata.title)
      |> Map.put(:description, event.metadata.description)

    # Update stream_data as well for the Vue component
    stream_data =
      socket.assigns.stream_data
      |> Map.put(:title, event.metadata.title)
      |> Map.put(:description, event.metadata.description)

    socket =
      socket
      |> assign(:stream_events, updated_events)
      |> assign(:stream_metadata, stream_metadata)
      |> assign(:stream_data, stream_data)

    {:noreply, socket}
  end

  def handle_info({:platform_event, event}, socket) do
    if event_should_be_displayed?(event.type) do
      stream_events = socket.assigns[:stream_events] || []

      formatted_event = %{
        id: event.id,
        type: to_string(event.type),
        username: event.username,
        amount: Map.get(event, :amount),
        tier: Map.get(event, :tier),
        viewers: Map.get(event, :viewers),
        platform: to_string(event.platform),
        timestamp: event.timestamp || DateTime.utc_now()
      }

      updated_events = Enum.take([formatted_event | stream_events], @max_stream_events)

      {:noreply, assign(socket, :stream_events, updated_events)}
    else
      {:noreply, socket}
    end
  end

  def handle_info({event_type, _event}, socket)
      when event_type in [
             :stream_status_changed,
             :stream_auto_stopped,
             :input_streaming_started,
             :input_streaming_stopped
           ] do
    target_user_id = socket.assigns.target_user_id
    stream_status = get_stream_status(target_user_id)
    stream_data = load_stream_data(target_user_id, stream_status)

    socket =
      socket
      |> assign(:stream_status, stream_status)
      |> assign(:stream_data, stream_data)

    {:noreply, socket}
  end

  def handle_info({:toggle_stream_key_visibility}, socket) do
    {:noreply, assign(socket, :show_stream_key, !socket.assigns.show_stream_key)}
  end

  def handle_info({:update_stream_metadata, %{"metadata" => metadata_params}}, socket) do
    metadata =
      socket.assigns.stream_metadata
      |> Map.put(:title, Map.get(metadata_params, "title", ""))
      |> Map.put(:description, Map.get(metadata_params, "description", ""))

    {:noreply, assign(socket, :stream_metadata, metadata)}
  end

  def handle_info({:save_settings, params}, socket) do
    target_user_id = socket.assigns.target_user_id

    metadata = %{
      title: Map.get(params, "title"),
      description: Map.get(params, "description")
    }

    case StreamAction.update_stream_metadata(
           %{
             user_id: target_user_id,
             title: metadata.title,
             description: metadata.description,
             platforms: [:all]
           },
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        # Broadcast stream settings update event
        event = %{
          id: Ash.UUID.generate(),
          type: :stream_settings_updated,
          username: socket.assigns.current_user.email,
          metadata: metadata,
          timestamp: DateTime.utc_now()
        }

        Phoenix.PubSub.broadcast(
          Streampai.PubSub,
          "stream_events:#{target_user_id}",
          {:stream_settings_updated, event}
        )

        # Update local state
        stream_metadata =
          socket.assigns.stream_metadata
          |> Map.put(:title, metadata.title)
          |> Map.put(:description, metadata.description)

        stream_data =
          socket.assigns.stream_data
          |> Map.put(:title, metadata.title)
          |> Map.put(:description, metadata.description)

        socket =
          socket
          |> assign(:stream_metadata, stream_metadata)
          |> assign(:stream_data, stream_data)
          |> put_flash(:info, "Stream settings updated successfully")

        {:noreply, socket}

      {:error, %Forbidden{}} ->
        Logger.error("Authorization failed for moderator #{socket.assigns.current_user.id}")
        socket = put_flash(socket, :error, "Not authorized to update stream settings")
        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to update stream settings: #{inspect(reason)}")
        socket = put_flash(socket, :error, "Failed to update stream settings")
        {:noreply, socket}
    end
  end

  def handle_info({:send_chat_message, message}, socket) do
    target_user_id = socket.assigns.target_user_id

    Logger.info("Sending chat message: #{message}")

    case StreamAction.send_message(
           %{user_id: target_user_id, message: message, platforms: [:all]},
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to send chat message: #{inspect(reason)}")
        {:noreply, put_flash(socket, :error, "Failed to send message")}
    end
  end

  def handle_info({:viewer_update, platform, count}, socket) do
    stream_data = socket.assigns.stream_data
    viewer_counts = Map.get(stream_data, :viewer_counts, %{})
    updated_viewer_counts = Map.put(viewer_counts, platform, count)
    total_viewers = updated_viewer_counts |> Map.values() |> Enum.sum()

    updated_stream_data =
      stream_data
      |> Map.put(:viewer_counts, updated_viewer_counts)
      |> Map.put(:total_viewers, total_viewers)

    {:noreply, assign(socket, :stream_data, updated_stream_data)}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  defp verify_moderator_permission(moderator_id, target_user_id) do
    # Check if moderator has an accepted moderator role for target user
    case UserRole.check_permission(
           %{
             user_id: moderator_id,
             granter_id: target_user_id,
             role_type: :moderator
           },
           authorize?: false
         ) do
      {:ok, [_role | _]} ->
        # Load target user
        case User.get_by_id(%{id: target_user_id}, authorize?: false) do
          {:ok, user} -> {:ok, user}
          _ -> {:error, :not_authorized}
        end

      _ ->
        {:error, :not_authorized}
    end
  end

  defp event_should_be_displayed?(:donation), do: true
  defp event_should_be_displayed?(:subscription), do: true
  defp event_should_be_displayed?(:follow), do: true
  defp event_should_be_displayed?(:raid), do: true
  defp event_should_be_displayed?(_), do: false

  defp lookup_registry(registry_key) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, registry_key) do
      [{pid, _}] -> {:ok, pid}
      [] -> {:error, :not_found}
    end
  end

  defp default_stream_data do
    %{
      started_at: DateTime.utc_now(),
      viewer_counts: %{twitch: 0, youtube: 0, facebook: 0, kick: 0},
      total_viewers: 0,
      initial_message_count: 0,
      title: "",
      description: ""
    }
  end

  defp get_stream_status(user_id) do
    case lookup_registry({:cloudflare_manager, user_id}) do
      {:ok, _pid} ->
        cloudflare_config =
          CloudflareManager.get_stream_config(
            {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}}
          )

        youtube_broadcast_id = get_youtube_broadcast_id(user_id)

        %{
          status: cloudflare_config.stream_status,
          input_streaming_status: cloudflare_config.input_streaming_status,
          can_start_streaming: cloudflare_config.can_start_streaming,
          rtmp_url: cloudflare_config.rtmp_url,
          stream_key: cloudflare_config.stream_key,
          manager_available: true,
          youtube_broadcast_id: youtube_broadcast_id
        }

      _ ->
        get_fallback_status()
    end
  rescue
    _ -> get_fallback_status()
  catch
    :exit, {:noproc, _} -> get_fallback_status()
  end

  defp get_youtube_broadcast_id(user_id) do
    with {:ok, _pid} <- lookup_registry({:platform_manager, user_id, :youtube}),
         {:ok, %{broadcast_id: broadcast_id}} when not is_nil(broadcast_id) <-
           Streampai.LivestreamManager.Platforms.YouTubeManager.get_status(user_id) do
      broadcast_id
    else
      _ -> nil
    end
  rescue
    _ -> nil
  catch
    :exit, {:noproc, _} -> nil
  end

  defp get_fallback_status do
    %{
      status: :inactive,
      input_streaming_status: :offline,
      can_start_streaming: false,
      rtmp_url: nil,
      stream_key: nil,
      manager_available: false,
      youtube_broadcast_id: nil
    }
  end

  defp update_livestream_metadata(user_id, metadata) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [livestream]} ->
        {:ok, user} = Ash.get(User, user_id, authorize?: false)

        Livestream.update(
          livestream,
          %{
            title: metadata.title,
            description: metadata.description
          },
          actor: user
        )

      _ ->
        {:error, :no_active_stream}
    end
  end

  defp load_stream_data(user_id, %{status: :streaming}) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.load(:messages_amount)
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [stream]} ->
        default_stream_data()
        |> Map.put(:started_at, stream.started_at || DateTime.utc_now())
        |> Map.put(:initial_message_count, stream.messages_amount || 0)
        |> Map.put(:title, stream.title || "")
        |> Map.put(:description, stream.description || "")

      _ ->
        default_stream_data()
    end
  end

  defp load_stream_data(_user_id, _stream_status) do
    default_stream_data()
  end

  defp load_last_stream_metadata(user_id) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id)
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [stream]} ->
        %{
          title: stream.title || "",
          description: stream.description || "",
          thumbnail_url: nil
        }

      _ ->
        %{title: "", description: "", thumbnail_url: nil}
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="moderate" page_title={@page_title}>
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Back Button -->
        <div>
          <.link
            navigate="/dashboard/moderate"
            class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Moderated Users
          </.link>
        </div>
        <!-- Moderator Notice -->
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                You are moderating <strong>{@target_user.name || @target_user.email}</strong>'s stream.
                <%= if @stream_status.status == :streaming do %>
                  You can send messages and update stream metadata.
                <% else %>
                  The stream is not currently active.
                <% end %>
              </p>
            </div>
          </div>
        </div>
        <!-- Show stream controls only when streaming -->
        <%= if @stream_status.status == :streaming do %>
          <.live_component
            module={StreampaiWeb.Components.StreamControlsLive}
            id="stream-controls"
            stream_status={@stream_status}
            loading={@loading}
            show_stream_key={false}
            stream_metadata={@stream_metadata}
            stream_data={@stream_data}
            current_user={@current_user}
            chat_messages={@chat_messages}
            stream_events={@stream_events}
            hide_stop_button={true}
            moderator_mode={true}
          />
        <% else %>
          <!-- Waiting for stream state -->
          <div class="bg-white shadow-sm rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Stream Controls</h3>
            </div>
            <div class="p-6">
              <div class="text-center py-12">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900">Waiting for Stream</h3>
                <p class="mt-2 text-sm text-gray-500">
                  <strong>{@target_user.name || @target_user.email}</strong>
                  is not currently streaming.
                </p>
                <p class="mt-1 text-sm text-gray-500">
                  Stream controls will appear automatically when they go live.
                </p>
              </div>
            </div>
          </div>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
