defmodule StreampaiWeb.DashboardStreamLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  alias Streampai.Dashboard

  def mount_page(socket, _params, _session) do
    platform_connections = Dashboard.get_platform_connections(socket.assigns.current_user)

    socket =
      socket
      |> assign(:platform_connections, platform_connections)
      |> assign(:page_title, "Stream")

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
