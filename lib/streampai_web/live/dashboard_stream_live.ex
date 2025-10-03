defmodule StreampaiWeb.DashboardStreamLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.LiveHelpers

  alias Streampai.Dashboard
  alias Streampai.LivestreamManager.UserStreamManager

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    platform_connections = Dashboard.get_platform_connections(socket.assigns.current_user)

    stream_status = get_stream_status(user_id)

    Phoenix.PubSub.subscribe(Streampai.PubSub, "cloudflare_input:#{user_id}")
    Phoenix.PubSub.subscribe(Streampai.PubSub, "stream_status:#{user_id}")

    socket =
      socket
      |> assign(:platform_connections, platform_connections)
      |> assign(:page_title, "Stream")
      |> assign(:stream_status, stream_status)
      |> assign(:loading, false)
      |> assign(:show_stream_key, false)

    {:ok, socket, layout: false}
  end

  def handle_event("start_streaming", _params, %{assigns: %{stream_status: %{manager_available: false}}} = socket) do
    socket =
      put_flash(
        socket,
        :error,
        "Streaming services not yet available. Please wait a moment and try again."
      )

    {:noreply, socket}
  end

  def handle_event("start_streaming", _params, socket) do
    user_id = socket.assigns.current_user.id
    socket = assign(socket, :loading, true)

    try do
      UserStreamManager.start_stream(user_id)

      socket =
        socket
        |> assign(:loading, false)
        |> put_flash(:info, "Stream started successfully!")

      {:noreply, socket}
    rescue
      error ->
        require Logger

        Logger.error("Failed to start stream for user #{user_id}: #{inspect(error)}")

        socket =
          socket
          |> assign(:loading, false)
          |> handle_error(error, "Failed to start stream. Please try again later.")

        {:noreply, socket}
    end
  end

  def handle_event("stop_streaming", _params, %{assigns: %{stream_status: %{manager_available: false}}} = socket) do
    socket = handle_error(socket, :timeout, "Streaming services not available.")
    {:noreply, socket}
  end

  def handle_event("stop_streaming", _params, socket) do
    user_id = socket.assigns.current_user.id
    socket = assign(socket, :loading, true)

    try do
      UserStreamManager.stop_stream(user_id)

      socket =
        socket
        |> assign(:loading, false)
        |> put_flash(:info, "Stream stopped successfully")

      {:noreply, socket}
    rescue
      error ->
        require Logger

        Logger.error("Failed to stop stream for user #{user_id}: #{inspect(error)}")

        socket =
          socket
          |> assign(:loading, false)
          |> handle_error(error, "Failed to stop stream. Please try again later.")

        {:noreply, socket}
    end
  end

  def handle_event("toggle_stream_key_visibility", _params, socket) do
    {:noreply, assign(socket, :show_stream_key, !socket.assigns.show_stream_key)}
  end

  # Delegate other events to BaseLive
  def handle_event(event, params, socket) do
    super(event, params, socket)
  end

  def handle_info({event_type, _event}, socket)
      when event_type in [
             :stream_status_changed,
             :stream_auto_stopped,
             :input_streaming_started,
             :input_streaming_stopped
           ] do
    stream_status = get_stream_status(socket.assigns.current_user.id)
    {:noreply, assign(socket, :stream_status, stream_status)}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  defp get_stream_status(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}) do
      [{_pid, _}] ->
        try do
          cloudflare_config =
            Streampai.LivestreamManager.CloudflareManager.get_stream_config(
              {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}}
            )

          %{
            status: cloudflare_config.stream_status,
            input_streaming_status: cloudflare_config.input_streaming_status,
            can_start_streaming: cloudflare_config.can_start_streaming,
            rtmp_url: cloudflare_config.rtmp_url,
            stream_key: cloudflare_config.stream_key,
            manager_available: true
          }
        rescue
          _ ->
            get_fallback_status()
        catch
          :exit, {:noproc, _} ->
            get_fallback_status()
        end

      [] ->
        get_fallback_status()
    end
  end

  defp get_fallback_status do
    %{
      status: :inactive,
      input_streaming_status: :offline,
      can_start_streaming: false,
      rtmp_url: nil,
      stream_key: nil,
      manager_available: false
    }
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout
      {assigns}
      current_page="stream"
      page_title="Stream"
      show_action_button={true}
      action_button_text="New Stream"
    >
      <div class="max-w-7xl mx-auto">
        <.stream_status_cards stream_status={@stream_status} current_user={@current_user} />
        <.stream_controls
          stream_status={@stream_status}
          loading={@loading}
          show_stream_key={@show_stream_key}
        />
        <.platform_connections_section
          platform_connections={@platform_connections}
          current_user={@current_user}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
