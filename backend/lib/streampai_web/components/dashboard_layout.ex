defmodule StreampaiWeb.Components.DashboardLayout do
  use StreampaiWeb, :html

  def dashboard_layout(assigns) do
    assigns = 
      assigns
      |> assign_new(:action_button_class, fn -> "" end)
      |> assign_new(:show_action_button, fn -> false end)
      |> assign_new(:action_button_text, fn -> "Action" end)
    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><%= @page_title %> - Streampai</title>
        <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
        <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
        </script>
      </head>
      <body class="h-full bg-gray-50">
        <div class="flex h-screen">
          <!-- Sidebar -->
          <div class={"transition-all duration-300 ease-in-out bg-gray-900 text-white #{if @sidebar_expanded, do: "w-64", else: "w-16"}"}>
            <!-- Sidebar Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
              <div class={"flex items-center space-x-2 #{unless @sidebar_expanded, do: "hidden"}"}>
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <span class="text-xl font-bold">Streampai</span>
              </div>
              <button 
                phx-click="toggle_sidebar"
                class="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <%= if @sidebar_expanded do %>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  <% else %>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  <% end %>
                </svg>
              </button>
            </div>

            <!-- Sidebar Navigation -->
            <nav class="mt-8">
              <div class="px-4 space-y-2">
                <!-- Dashboard -->
                <a href="/dashboard" class={"flex items-center space-x-3 p-3 rounded-lg transition-colors #{if @current_page == "dashboard", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
                  </svg>
                  <span class={unless(@sidebar_expanded, do: "hidden")}>Dashboard</span>
                </a>

                <!-- Stream -->
                <a href="/dashboard/stream" class={"flex items-center space-x-3 p-3 rounded-lg transition-colors #{if @current_page == "stream", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0021 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span class={unless(@sidebar_expanded, do: "hidden")}>Stream</span>
                </a>

                <!-- Chat History -->
                <a href="/dashboard/chat-history" class={"flex items-center space-x-3 p-3 rounded-lg transition-colors #{if @current_page == "chat-history", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span class={unless(@sidebar_expanded, do: "hidden")}>Chat History</span>
                </a>

                <!-- Widgets -->
                <a href="/dashboard/widgets" class={"flex items-center space-x-3 p-3 rounded-lg transition-colors #{if @current_page == "widgets", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  </svg>
                  <span class={unless(@sidebar_expanded, do: "hidden")}>Widgets</span>
                </a>

                <!-- Analytics -->
                <a href="/dashboard/analytics" class={"flex items-center space-x-3 p-3 rounded-lg transition-colors #{if @current_page == "analytics", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span class={unless(@sidebar_expanded, do: "hidden")}>Analytics</span>
                </a>

                <!-- Settings -->
                <a href="/dashboard/settings" class={"flex items-center space-x-3 p-3 rounded-lg transition-colors #{if @current_page == "settings", do: "bg-purple-600 text-white", else: "text-gray-300 hover:bg-gray-700 hover:text-white"}"}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class={unless(@sidebar_expanded, do: "hidden")}>Settings</span>
                </a>
              </div>
            </nav>
          </div>

          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Top Bar -->
            <header class="bg-white shadow-sm border-b border-gray-200">
              <div class="flex items-center justify-between px-6 py-4">
                <div class="flex items-center space-x-4">
                  <button 
                    phx-click="toggle_sidebar"
                    class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h1 class="text-2xl font-semibold text-gray-900"><%= @page_title %></h1>
                </div>
                
                <div class="flex items-center space-x-4">
                  <%= if assigns[:show_action_button] do %>
                    <button class={"bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 #{@action_button_class || ""}"}>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span><%= @action_button_text %></span>
                    </button>
                  <% end %>
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span class="text-white font-medium text-sm">
                        <%= if @current_user && @current_user.email do %>
                          <%= String.first(@current_user.email) |> String.upcase() %>
                        <% else %>
                          U
                        <% end %>
                      </span>
                    </div>
                    <div class="hidden md:block">
                      <p class="text-sm font-medium text-gray-900">
                        <%= if @current_user && @current_user.email, do: @current_user.email, else: "Unknown User" %>
                      </p>
                      <p class="text-xs text-gray-500">Free Plan</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <!-- Main Content Area -->
            <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
              <%= render_slot(@inner_block) %>
            </main>
          </div>
        </div>
      </body>
    </html>
    """
  end
end