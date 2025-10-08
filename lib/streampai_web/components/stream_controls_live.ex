defmodule StreampaiWeb.Components.StreamControlsLive do
  @moduledoc """
  LiveComponent for managing stream controls with three states:
  1. Waiting for input
  2. Waiting for stream to start
  3. Streaming (uses Vue component for client-side state management)
  """
  use StreampaiWeb, :live_component

  alias StreampaiWeb.Components.DashboardComponents

  require Ash.Query

  @impl true
  def render(assigns) do
    assigns = assign_new(assigns, :hide_stop_button, fn -> false end)
    assigns = assign_new(assigns, :moderator_mode, fn -> false end)

    ~H"""
    <div class={[
      "bg-white shadow-sm rounded-lg border border-gray-200",
      @maximized && "!fixed !inset-0 !z-50 !m-0 !rounded-none overflow-y-auto"
    ]}>
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Stream Controls</h3>
        <button
          phx-click="toggle_maximize"
          phx-target={@myself}
          class="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
          title={if @maximized, do: "Minimize", else: "Maximize"}
        >
          <%= if @maximized do %>
            <.icon name="hero-x-mark" class="w-5 h-5 text-gray-600" />
          <% else %>
            <.icon name="hero-arrows-pointing-out" class="w-5 h-5 text-gray-600" />
          <% end %>
        </button>
      </div>
      <div class="p-6">
        <%= if @stream_status.manager_available do %>
          <%= if @stream_status.status == :streaming do %>
            <.vue
              v-component="StreamingControls"
              v-socket={@socket}
              streamStatus={@stream_status}
              streamData={Map.get(assigns, :stream_data, %{})}
              loading={@loading}
              chatMessages={Map.get(assigns, :chat_messages, [])}
              streamEvents={Map.get(assigns, :stream_events, [])}
              hideStopButton={@hide_stop_button}
              id="streaming-controls-vue"
              v-on:stopStreaming={JS.push("stop_streaming", target: @myself)}
              v-on:saveSettings={JS.push("save_settings", target: @myself)}
              v-on:sendChatMessage={JS.push("send_chat_message", target: @myself)}
            />
          <% else %>
            <%= if not @moderator_mode do %>
              <div class="flex flex-col space-y-4">
                <DashboardComponents.stream_input_status
                  status={@stream_status.input_streaming_status}
                  youtube_broadcast_id={Map.get(@stream_status, :youtube_broadcast_id)}
                />

                <%= if @stream_status.can_start_streaming && @stream_status.status != :streaming do %>
                  <DashboardComponents.stream_metadata_form
                    metadata={@stream_metadata}
                    socket={@socket}
                  />
                <% end %>

                <DashboardComponents.stream_action_button
                  stream_status={@stream_status}
                  loading={@loading}
                />
                <%= if @stream_status.rtmp_url && @stream_status.stream_key do %>
                  <DashboardComponents.rtmp_connection_details
                    rtmp_url={@stream_status.rtmp_url}
                    stream_key={@stream_status.stream_key}
                    show_stream_key={@show_stream_key}
                  />
                <% end %>
                <%= if @stream_status.input_streaming_status != :live do %>
                  <DashboardComponents.stream_status_message />
                <% end %>
              </div>
            <% end %>
          <% end %>
        <% else %>
          <%= if not @moderator_mode do %>
            <DashboardComponents.stream_service_unavailable />
          <% end %>
        <% end %>
      </div>
    </div>
    """
  end

  @impl true
  def mount(socket) do
    {:ok, assign(socket, maximized: false)}
  end

  @impl true
  def update(assigns, socket) do
    socket = assign(socket, assigns)
    socket = assign_new(socket, :hide_stop_button, fn -> false end)
    socket = assign_new(socket, :moderator_mode, fn -> false end)
    {:ok, socket}
  end

  @impl true
  def handle_event("toggle_maximize", _params, socket) do
    {:noreply, assign(socket, :maximized, !socket.assigns.maximized)}
  end

  @impl true
  def handle_event("toggle_stream_key_visibility", _params, socket) do
    send(self(), {:toggle_stream_key_visibility})
    {:noreply, socket}
  end

  @impl true
  def handle_event("update_stream_metadata", params, socket) do
    send(self(), {:update_stream_metadata, params})
    {:noreply, socket}
  end

  @impl true
  def handle_event("start_streaming", params, socket) do
    send(self(), {:start_streaming, params})
    {:noreply, socket}
  end

  @impl true
  def handle_event("stop_streaming", params, socket) do
    send(self(), {:stop_streaming, params})
    {:noreply, socket}
  end

  @impl true
  def handle_event("save_settings", params, socket) do
    send(self(), {:save_settings, params})
    {:noreply, socket}
  end

  @impl true
  def handle_event("send_chat_message", params, socket) do
    message = reconstruct_string_from_params(params)
    send(self(), {:send_chat_message, message})
    {:noreply, socket}
  end

  defp reconstruct_string_from_params(params) when is_map(params) do
    params
    |> Enum.map(fn {k, v} -> {String.to_integer(k), v} end)
    |> Enum.sort_by(fn {k, _v} -> k end)
    |> Enum.map_join("", fn {_k, v} -> v end)
  end
end
