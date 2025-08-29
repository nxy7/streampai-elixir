defmodule StreampaiWeb.StreamLive do
  use StreampaiWeb.BaseLive
  
  alias Streampai.Dashboard

  def mount_page(socket, _params, _session) do
    platform_connections = Dashboard.get_platform_connections(socket.assigns.current_user)
    
    socket = socket
    |> assign(:platform_connections, platform_connections)
    
    {:ok, socket, layout: false}
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
                  <dd class="text-lg font-medium text-gray-900">Offline</dd>
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
                  <dd class="text-lg font-medium text-gray-900">0 / 4</dd>
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
        
    <!-- Platform Connections -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Platform Connections</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <%= for connection <- @platform_connections do %>
                <div class={"flex items-center justify-between p-4 border rounded-lg #{if connection.connected, do: "border-#{connection.color}-200 bg-#{connection.color}-50", else: "border-gray-200"}"}>
                  <div class="flex items-center space-x-3">
                    <div class={"w-10 h-10 rounded-lg flex items-center justify-center #{if connection.connected, do: "bg-#{connection.color}-500", else: "bg-gray-400"}"}>
                      <%= if connection.platform == :twitch do %>
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z" />
                        </svg>
                      <% else %>
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      <% end %>
                    </div>
                    <div>
                      <h4 class={"text-sm font-medium #{if connection.connected, do: "text-#{connection.color}-900", else: "text-gray-900"}"}>
                        <%= connection.name %>
                      </h4>
                      <p class={"text-sm #{if connection.connected, do: "text-#{connection.color}-700", else: "text-gray-500"}"}>
                        <%= if connection.connected, do: "Connected", else: "Not connected" %>
                      </p>
                    </div>
                  </div>
                  <%= if not connection.connected do %>
                    <a
                      href={connection.connect_url}
                      class="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Connect
                    </a>
                  <% else %>
                    <span class={"bg-#{connection.color}-600 text-white px-4 py-2 rounded-lg text-sm"}>
                      ✓ Connected
                    </span>
                  <% end %>
                </div>
              <% end %>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
