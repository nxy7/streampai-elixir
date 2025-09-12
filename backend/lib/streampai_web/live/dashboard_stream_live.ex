defmodule StreampaiWeb.DashboardStreamLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.LiveHelpers

  alias Streampai.Dashboard
  alias Streampai.LivestreamManager.UserStreamManager

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    platform_connections = Dashboard.get_platform_connections(socket.assigns.current_user)

    # Get current stream status
    stream_status = get_stream_status(user_id)

    # Subscribe to stream status updates
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

  def handle_event("start_streaming", _params, socket) do
    user_id = socket.assigns.current_user.id

    if socket.assigns.stream_status.manager_available do
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
          socket =
            socket
            |> assign(:loading, false)
            |> put_flash(:error, "Failed to start stream: #{inspect(error)}")

          {:noreply, socket}
      end
    else
      socket =
        put_flash(
          socket,
          :error,
          "Streaming services not yet available. Please wait a moment and try again."
        )

      {:noreply, socket}
    end
  end

  def handle_event("stop_streaming", _params, socket) do
    user_id = socket.assigns.current_user.id

    if socket.assigns.stream_status.manager_available do
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
          socket =
            socket
            |> assign(:loading, false)
            |> put_flash(:error, "Failed to stop stream: #{inspect(error)}")

          {:noreply, socket}
      end
    else
      socket = put_flash(socket, :error, "Streaming services not available.")
      {:noreply, socket}
    end
  end

  def handle_event("toggle_stream_key_visibility", _params, socket) do
    {:noreply, assign(socket, :show_stream_key, !socket.assigns.show_stream_key)}
  end

  def handle_event("disconnect_platform", %{"platform" => platform_str, "value" => _}, socket) do
    handle_platform_disconnect(socket, platform_str)
  end

  # Handle PubSub updates for stream status changes
  def handle_info({:stream_status_changed, _event}, socket) do
    # Refresh stream status on any PubSub events
    user_id = socket.assigns.current_user.id
    stream_status = get_stream_status(user_id)

    socket = assign(socket, :stream_status, stream_status)

    {:noreply, socket}
  end

  def handle_info({event_type, _event}, socket)
      when event_type in [:stream_auto_stopped, :input_streaming_started, :input_streaming_stopped] do
    # Refresh stream status on CloudflareManager events
    user_id = socket.assigns.current_user.id
    stream_status = get_stream_status(user_id)

    socket = assign(socket, :stream_status, stream_status)

    {:noreply, socket}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  defp get_stream_status(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}) do
      [{_pid, _}] ->
        # CloudflareManager is running, get actual status
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
        # CloudflareManager not yet started (user not detected via presence)
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
        <!-- Stream Status Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Live Status -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Live Status</dt>
                  <dd class="text-lg font-medium text-gray-900">
                    <%= case @stream_status.status do %>
                      <% :streaming -> %>
                        <span class="text-green-600">🔴 LIVE</span>
                      <% :ready -> %>
                        <span class="text-yellow-600">⚡ Ready</span>
                      <% :inactive -> %>
                        <span class="text-gray-600">⏸️ Offline</span>
                      <% _ -> %>
                        <span class="text-gray-600">⏸️ Offline</span>
                    <% end %>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
    <!-- Active Platforms -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    class="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Platforms</dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {@current_user.connected_platforms} / {if @current_user.tier == :free do
                      1
                    else
                      99
                    end}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
    <!-- Total Viewers -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    class="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Viewers</dt>
                  <dd class="text-lg font-medium text-gray-900">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
    <!-- Stream Controls -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Stream Controls</h3>
          </div>
          <div class="p-6">
            <%= if @stream_status.manager_available do %>
              <div class="flex flex-col space-y-4">
                <!-- Input Status -->
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <div class={[
                      "w-3 h-3 rounded-full",
                      if(@stream_status.input_streaming_status == :live,
                        do: "bg-green-500",
                        else: "bg-gray-300"
                      )
                    ]}>
                    </div>
                    <span class="text-sm font-medium text-gray-700">
                      Input Stream: {if @stream_status.input_streaming_status == :live,
                        do: "LIVE",
                        else: "Offline"}
                    </span>
                  </div>
                </div>
                
    <!-- GO LIVE Button -->
                <div class="flex items-center justify-center mb-4">
                  <%= if @stream_status.status == :streaming do %>
                    <button
                      phx-click="stop_streaming"
                      disabled={@loading}
                      class="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-lg shadow-lg transition-colors duration-200"
                    >
                      {if @loading, do: "Stopping...", else: "🔴 STOP STREAM"}
                    </button>
                  <% else %>
                    <button
                      phx-click="start_streaming"
                      disabled={@loading || !@stream_status.can_start_streaming}
                      class={[
                        "px-8 py-4 font-semibold rounded-lg text-lg shadow-lg transition-colors duration-200",
                        if(@stream_status.can_start_streaming && !@loading,
                          do: "bg-green-600 hover:bg-green-700 text-white",
                          else: "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )
                      ]}
                    >
                      <%= cond do %>
                        <% @loading -> %>
                          "Starting..."
                        <% @stream_status.input_streaming_status != :live -> %>
                          ⚡ Waiting for Input...
                        <% !@stream_status.can_start_streaming -> %>
                          🚫 Configure Platforms
                        <% true -> %>
                          🚀 GO LIVE
                      <% end %>
                    </button>
                  <% end %>
                </div>

                <%= if @stream_status.rtmp_url && @stream_status.stream_key do %>
                  <!-- RTMP Connection Details -->
                  <div class="mb-4">
                    <!-- RTMP URL Field -->
                    <div class="mb-3 relative">
                      <label class="block text-xs font-medium text-gray-500 mb-1">RTMP URL</label>
                      <div
                        class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono cursor-pointer hover:bg-gray-100 select-none transition-colors"
                        data-copy-value={@stream_status.rtmp_url}
                        onclick="
                        navigator.clipboard.writeText(this.getAttribute('data-copy-value')); 
                        this.classList.add('bg-green-100'); 
                        this.classList.add('border-green-300'); 
                        const popup = this.nextElementSibling; 
                        popup.classList.remove('opacity-0'); 
                        popup.classList.add('opacity-100'); 
                        setTimeout(() => { 
                          this.classList.remove('bg-green-100'); 
                          this.classList.remove('border-green-300'); 
                          popup.classList.remove('opacity-100'); 
                          popup.classList.add('opacity-0'); 
                        }, 1500);
                      "
                        title="Click to copy"
                      >
                        {@stream_status.rtmp_url}
                      </div>
                      <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-300 pointer-events-none z-10">
                        RTMP URL copied!
                      </div>
                    </div>
                    
    <!-- Stream Key Field -->
                    <div class="mb-4 relative">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Stream Key</label>
                      <div class="relative">
                        <div
                          class="px-3 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono cursor-pointer hover:bg-gray-100 select-none transition-colors"
                          onclick={"
                          navigator.clipboard.writeText('#{@stream_status.stream_key}'); 
                          this.classList.add('bg-green-100'); 
                          this.classList.add('border-green-300'); 
                          const popup = this.parentElement.nextElementSibling; 
                          popup.classList.remove('opacity-0'); 
                          popup.classList.add('opacity-100'); 
                          setTimeout(() => { 
                            this.classList.remove('bg-green-100'); 
                            this.classList.remove('border-green-300'); 
                            popup.classList.remove('opacity-100'); 
                            popup.classList.add('opacity-0'); 
                          }, 1500);
                        "}
                          title="Click to copy"
                        >
                          {if @show_stream_key,
                            do: @stream_status.stream_key,
                            else: String.duplicate("•", String.length(@stream_status.stream_key))}
                        </div>
                        <button
                          type="button"
                          phx-click="toggle_stream_key_visibility"
                          class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                          title={if @show_stream_key, do: "Hide stream key", else: "Show stream key"}
                        >
                          <%= if @show_stream_key do %>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          <% else %>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          <% end %>
                        </button>
                      </div>
                      <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-300 pointer-events-none z-10">
                        Stream key copied!
                      </div>
                    </div>
                  </div>
                <% end %>
                
    <!-- Status Messages -->
                <%= if @stream_status.input_streaming_status != :live do %>
                  <div class="text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    📺 Start streaming to your RTMP URL in OBS to enable the GO LIVE button
                  </div>
                <% end %>
              </div>
            <% else %>
              <!-- Streaming Services Not Available -->
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    class="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Streaming Services Starting Up</h3>
                <p class="text-sm text-gray-600 mb-4">
                  We're initializing your streaming infrastructure. This usually takes a few moments.
                </p>
                <div class="flex items-center justify-center space-x-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span class="text-sm text-blue-600">Setting up CloudflareManager...</span>
                </div>
                <p class="text-xs text-gray-500 mt-4">
                  ℹ️ Streaming services start automatically when you're detected as online
                </p>
              </div>
            <% end %>
          </div>
        </div>
        
    <!-- Platform Connections -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Platform Connections</h3>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              <%= for connection <- @platform_connections do %>
                <.platform_connection
                  name={connection.name}
                  platform={connection.platform}
                  connected={connection.connected}
                  connect_url={connection.connect_url}
                  color={connection.color}
                  current_user={@current_user}
                  account_data={connection.account_data}
                  show_disconnect={true}
                />
              <% end %>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
