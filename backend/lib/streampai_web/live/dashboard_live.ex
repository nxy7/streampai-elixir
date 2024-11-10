defmodule StreampaiWeb.DashboardLive do
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout

  def mount(_params, _session, socket) do
    {:ok, assign(socket, sidebar_expanded: true), layout: false}
  end

  def handle_event("toggle_sidebar", _params, socket) do
    {:noreply, assign(socket, sidebar_expanded: !socket.assigns.sidebar_expanded)}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout
      current_user={@current_user}
      sidebar_expanded={@sidebar_expanded}
      current_page="dashboard"
      page_title="Dashboard"
    >
        <div class="max-w-7xl mx-auto">
          <!-- Welcome Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">
                Welcome back<%= if @current_user && @current_user.email, do: ", #{String.split(@current_user.email, "@") |> hd()}", else: "" %>!
              </h2>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last login: <%= Date.utc_today() %></span>
              </div>
            </div>
            <p class="text-gray-600">
              Ready to start streaming to multiple platforms? Connect your accounts and manage your content all in one place.
            </p>
          </div>

          <!-- User Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <!-- Account Info -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Account Info</h3>
                <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="font-medium"><%= if @current_user && @current_user.email, do: @current_user.email, else: "Not available" %></p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">User ID</p>
                  <p class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    <%= if @current_user && @current_user.id, do: @current_user.id, else: "N/A" %>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Plan</p>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free (<%= Streampai.Constants.free_tier_hour_limit %> hours/month)
                  </span>
                </div>
              </div>
            </div>

            <!-- Streaming Status -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Streaming Status</h3>
                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0021 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Status</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Offline
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Connected Platforms</span>
                  <span class="text-sm font-medium">0</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Hours Used</span>
                  <span class="text-sm font-medium">0 / <%= Streampai.Constants.free_tier_hour_limit %></span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="space-y-3">
                <a href="/streaming/connect/twitch" class="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.5 0L13.5 5.5L19 7.5L13.5 9.5L11.5 15L9.5 9.5L4 7.5L9.5 5.5L11.5 0Z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-sm">Connect Twitch</p>
                      <p class="text-xs text-gray-500">Link your Twitch account</p>
                    </div>
                  </div>
                </a>

                <a href="/streaming/connect/google" class="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-sm">Connect YouTube</p>
                      <p class="text-xs text-gray-500">Link your YouTube channel</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- Debug Info (for development) -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-yellow-800 mb-2">Debug Info (Development Only)</h3>
            <pre class="text-xs text-yellow-700 overflow-x-auto"><%= inspect(@current_user, pretty: true, limit: :infinity) %></pre>
          </div>
        </div>
    </.dashboard_layout>
    """
  end
end
