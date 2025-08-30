defmodule StreampaiWeb.UsersLive do
  @moduledoc """
  LiveView for managing users and impersonation.

  This module provides functionality for admin users to:
  - View all users in the system
  - Impersonate other users (admin only)
  - Stop impersonation and return to original user
  """
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout
  alias StreampaiWeb.Presence
  alias Streampai.Accounts.UserPolicy

  def mount(_params, _session, socket) do
    if connected?(socket) do
      topic = "users_presence"
      Phoenix.PubSub.subscribe(Streampai.PubSub, topic)
    end

    {:ok,
     socket
     |> assign(
       users: [],
       can_impersonate: UserPolicy.can_impersonate?(socket.assigns.current_user),
       online_users: %{}
     )
     |> load_users()
     |> load_presence(), layout: false}
  end

  defp load_users(socket) do
    actor = socket.assigns[:impersonator] || socket.assigns.current_user

    case Streampai.Accounts.User
         |> Ash.Query.for_read(:read, %{}, actor: actor)
         |> Ash.read() do
      {:ok, users} ->
        IO.puts("users: " <> inspect(users))
        assign(socket, :users, users)

      {:error, error} ->
        IO.puts("Failed to load users" <> inspect(error))

        socket
        |> assign(:users, [])
        |> put_flash(:error, "Failed to load users")
    end
  end

  defp load_presence(socket) do
    topic = "users_presence"

    online_users =
      Presence.list(topic)
      |> Enum.into(%{}, fn {user_id, %{metas: [meta | _]}} ->
        {user_id, meta}
      end)

    assign(socket, :online_users, online_users)
  end

  def handle_info(%{event: "presence_diff", topic: "users_presence"}, socket) do
    {:noreply, load_presence(socket)}
  end

  defp user_role(user) do
    UserPolicy.user_role(user)
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="users" page_title="User Management">
      <div class="max-w-6xl mx-auto space-y-6">
        <%= if assigns[:impersonator] do %>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <svg
                  class="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span class="text-yellow-800 font-medium">
                  You are impersonating {@current_user.email} as {@impersonator.email}
                </span>
              </div>
              <a
                href="/impersonation/stop"
                class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Stop Impersonating
              </a>
            </div>
          </div>
        <% end %>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">All Users</h3>
            <p class="text-sm text-gray-500 mt-1">
              Manage user accounts and impersonation
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <%= if @can_impersonate do %>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  <% end %>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <%= for user <- @users do %>
                  <tr class={"#{if @current_user.id == user.id, do: "bg-purple-50", else: "hover:bg-gray-50"}"}>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span class="text-white font-medium text-sm">
                            {String.first(user.email) |> String.upcase()}
                          </span>
                        </div>
                        <div class="ml-3">
                          <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-900">
                              User {String.slice(user.id, 0..7)}
                            </span>
                            <%= if @current_user.id == user.id do %>
                              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Current User
                              </span>
                            <% end %>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium #{if user_role(user) == :admin, do: "bg-red-100 text-red-800", else: "bg-gray-100 text-gray-800"}"}>
                        {user_role(user) |> Atom.to_string() |> String.capitalize()}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium #{case Map.get(user, :tier) do
                        :pro -> "bg-purple-100 text-purple-800"
                        :free -> "bg-gray-100 text-gray-800"
                        _ -> "bg-gray-100 text-gray-800"
                      end}"}>
                        {case Map.get(user, :tier) do
                          :pro -> "Pro"
                          :free -> "Free"
                          _ -> "Free"
                        end}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <%= if Map.has_key?(@online_users, user.id) do %>
                        <div class="flex items-center">
                          <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span class="text-sm font-medium text-green-700">Online</span>
                        </div>
                      <% else %>
                        <div class="flex items-center">
                          <div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <span class="text-sm text-gray-500">Offline</span>
                        </div>
                      <% end %>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <%= if user.confirmed_at do %>
                        {Calendar.strftime(user.confirmed_at, "%B %d, %Y")}
                      <% else %>
                        N/A
                      <% end %>
                    </td>
                    <%= if @can_impersonate do %>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <%= if @current_user.id != user.id do %>
                          <a
                            href={"/impersonation/start/#{user.id}"}
                            class="text-purple-600 hover:text-purple-900 hover:underline"
                          >
                            Impersonate
                          </a>
                        <% else %>
                          <span class="text-gray-400">Self</span>
                        <% end %>
                      </td>
                    <% end %>
                  </tr>
                <% end %>
              </tbody>
            </table>

            <%= if Enum.empty?(@users) do %>
              <div class="text-center py-8">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0A9 9 0 1110.5 3.5a9 9 0 018.999 8.499z"
                  />
                </svg>
                <p class="mt-4 text-sm text-gray-500">No users found</p>
              </div>
            <% end %>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
