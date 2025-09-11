defmodule StreampaiWeb.Components.DashboardLayout do
  @moduledoc false
  use StreampaiWeb, :html

  alias Streampai.Accounts.UserPolicy

  def dashboard_layout(assigns) do
    # Accept all assigns and only set defaults for what we need
    assigns =
      assigns
      |> assign_new(:action_button_class, fn -> "" end)
      |> assign_new(:show_action_button, fn -> false end)
      |> assign_new(:action_button_text, fn -> "Action" end)
      |> assign_new(:impersonator, fn -> nil end)

    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body class="h-full bg-gray-50">
        <div class="flex h-screen" id="dashboard-layout" phx-hook="DashboardSidebar">
          <!-- Mobile sidebar backdrop -->
          <div
            id="mobile-sidebar-backdrop"
            class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden opacity-0 hidden transition-opacity duration-300"
          >
          </div>
          
    <!-- Sidebar -->
          <div class="sidebar fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-gray-900 text-white w-64 flex flex-col -translate-x-full md:translate-x-0 overflow-y-auto">
            <!-- Sidebar Header -->
            <div class="flex items-center justify-center p-4 border-b border-gray-700 relative">
              <.link
                navigate="/"
                class="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div class="flex items-center space-x-2 mb-4 md:mb-0">
                  <img src="/images/logo-white.png" alt="Streampai Logo" class="w-8 h-8" />
                  <span class="text-xl font-bold text-white streampai-text">Streampai</span>
                </div>
              </.link>
              <button
                id="sidebar-toggle"
                class="hidden md:block absolute right-2 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    class="collapse-icon"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                  <path
                    class="expand-icon hidden"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            
    <!-- Main Navigation (flex-1 to take up remaining space) -->
            <nav class="flex-1 mt-6">
              <!-- Primary Section -->
              <div class="px-4 mb-8">
                <h3 class="sidebar-text text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Overview
                </h3>
                <div class="space-y-2">
                  <!-- Dashboard -->
                  <.link
                    navigate="/dashboard"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "dashboard", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Dashboard"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Dashboard</span>
                  </.link>
                  
    <!-- Analytics -->
                  <.link
                    navigate="/dashboard/analytics"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "analytics", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Analytics"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Analytics</span>
                  </.link>
                </div>
              </div>
              
    <!-- Streaming Section -->
              <div class="px-4 mb-8">
                <h3 class="sidebar-text text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Streaming
                </h3>
                <div class="space-y-2">
                  <!-- Stream -->
                  <.link
                    navigate="/dashboard/stream"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "stream", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Stream"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 10l4.553-2.276A1 1 0 0021 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Stream</span>
                  </.link>
                  
    <!-- Chat History -->
                  <.link
                    navigate="/dashboard/chat-history"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "chat-history", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Chat History"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Chat History</span>
                  </.link>
                  
    <!-- Patreons -->
                  <.link
                    navigate="/dashboard/patreons"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "patreons", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Patreons"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Patreons</span>
                  </.link>
                  
    <!-- Viewers -->
                  <.link
                    navigate="/dashboard/viewers"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "viewers", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Viewers"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Viewers</span>
                  </.link>
                  
    <!-- Stream History -->
                  <.link
                    navigate="/dashboard/stream-history"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "stream-history", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Stream History"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
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
                    <span class="sidebar-text ml-3">Stream History</span>
                  </.link>
                  
    <!-- Widgets -->
                  <.link
                    navigate="/dashboard/widgets"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "widgets", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Widgets"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Widgets</span>
                  </.link>
                </div>
              </div>
              
    <!-- Admin Section -->
              <%= if @current_user && UserPolicy.admin?(@current_user) do %>
                <div class="px-4 mb-8">
                  <h3 class="sidebar-text text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Admin
                  </h3>
                  <div class="space-y-2">
                    <!-- User Management -->
                    <.link
                      navigate="/dashboard/admin/users"
                      class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "users", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                      title="Users"
                    >
                      <svg
                        class="sidebar-icon w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0A9 9 0 1110.5 3.5a9 9 0 018.999 8.499z"
                        />
                      </svg>
                      <span class="sidebar-text ml-3">Users</span>
                    </.link>
                  </div>
                </div>
              <% end %>
              
    <!-- Settings Section -->
              <div class="px-4">
                <h3 class="sidebar-text text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Account
                </h3>
                <div class="space-y-2">
                  <!-- Settings -->
                  <.link
                    navigate="/dashboard/settings"
                    class={"nav-item flex items-center p-3 rounded-lg transition-colors #{if @current_page == "settings", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}
                    title="Settings"
                  >
                    <svg
                      class="sidebar-icon w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span class="sidebar-text ml-3">Settings</span>
                  </.link>
                </div>
              </div>
            </nav>
            
    <!-- Bottom Logout Section -->
            <div class="p-4 border-t border-gray-700">
              <a
                href="/auth/sign-out"
                method="delete"
                class="nav-item flex items-center p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors w-full"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span class="sidebar-text ml-3">Sign Out</span>
              </a>
            </div>
          </div>
          
    <!-- Main Content -->
          <div id="main-content" class="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
            <!-- Top Bar -->
            <header class="bg-white shadow-sm border-b border-gray-200">
              <div class="flex items-center justify-between px-6 py-4">
                <div class="flex items-center space-x-4">
                  <button
                    id="mobile-sidebar-toggle"
                    class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  <h1 class="text-2xl font-semibold text-gray-900">{@page_title}</h1>
                </div>

                <div class="flex items-center space-x-4">
                  <%= if assigns[:show_action_button] do %>
                    <button class={"bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 #{@action_button_class || ""}"}>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>{@action_button_text}</span>
                    </button>
                  <% end %>
                  <div class="flex items-center space-x-3">
                    <.link
                      navigate="/dashboard/settings"
                      class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center overflow-hidden hover:bg-purple-600 transition-colors cursor-pointer"
                      title="Go to Settings"
                    >
                      <%= if @current_user && @current_user.avatar do %>
                        <img
                          src={@current_user.avatar}
                          alt="User Avatar"
                          class="w-full h-full object-cover"
                        />
                      <% else %>
                        <span class="text-white font-medium text-sm">
                          <%= if @current_user && @current_user.email do %>
                            {String.first(@current_user.email) |> String.upcase()}
                          <% else %>
                            U
                          <% end %>
                        </span>
                      <% end %>
                    </.link>
                    <div class="hidden md:block">
                      <p class="text-sm font-medium text-gray-900">
                        {if @current_user && @current_user.email,
                          do: @current_user.email,
                          else: "Unknown User"}
                      </p>
                      <p class="text-xs text-gray-500">
                        {case @current_user && Map.get(@current_user, :tier) do
                          :pro -> "Pro Plan"
                          :free -> "Free Plan"
                          _ -> "Free Plan"
                        end}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            
    <!-- Main Content Area -->
            <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
              {render_slot(@inner_block)}
            </main>
          </div>
        </div>
        
    <!-- Floating Impersonation Notification -->
        <%= if @impersonator do %>
          <div class="fixed top-4 right-4 bg-amber-100 border-l-4 border-amber-500 rounded-lg p-4 shadow-lg z-50 max-w-sm">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-amber-800">
                  Impersonation Active
                </p>
                <p class="text-xs text-amber-700 mt-1">
                  You are viewing as <strong>{@current_user.email}</strong>
                </p>
                <p class="text-xs text-amber-600 mt-1">
                  Admin: {@impersonator.email}
                </p>
                <div class="mt-2">
                  <a
                    href="/impersonation/stop"
                    class="inline-flex items-center px-3 py-1 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Exit Impersonation
                  </a>
                </div>
              </div>
            </div>
          </div>
        <% end %>
        
    <!-- Flash Messages -->
        <.flash_group flash={assigns[:flash] || %{}} />

        <style>
          /* Collapsed sidebar styles */
          .sidebar.w-20 .nav-item {
            justify-content: center;
            padding: 0.75rem;
          }

          /* Hide scrollbar while keeping scroll functionality */
          .sidebar {
            -ms-overflow-style: none;  /* Internet Explorer 10+ */
            scrollbar-width: none;  /* Firefox */
          }
          .sidebar::-webkit-scrollbar {
            display: none;  /* Safari and Chrome */
          }
        </style>
      </body>
    </html>
    """
  end
end
