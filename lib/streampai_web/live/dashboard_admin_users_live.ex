defmodule StreampaiWeb.DashboardAdminUsersLive do
  @moduledoc """
  LiveView for managing users and impersonation.

  This module provides functionality for admin users to:
  - View all users in the system
  - Impersonate other users (admin only)
  - Stop impersonation and return to original user
  """
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.DashboardLayout
  import StreampaiWeb.LiveHelpers

  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserPolicy
  alias StreampaiWeb.Presence

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
       online_users: %{},
       page_title: "User Management",
       page: 1,
       page_size: 20,
       total_count: 0
     )
     |> load_users()
     |> load_presence(), layout: false}
  end

  defp load_users(socket) do
    actor = socket.assigns[:impersonator] || socket.assigns.current_user
    page = socket.assigns[:page] || 1
    page_size = socket.assigns[:page_size] || 20

    # Get total count for pagination
    total_count_result =
      User
      |> Ash.Query.for_read(:read, %{}, actor: actor)
      |> Ash.count()

    case {total_count_result,
          User
          |> Ash.Query.for_read(:list_paginated, %{page: page, page_size: page_size}, actor: actor)
          |> Ash.read()} do
      {{:ok, total_count}, {:ok, users}} ->
        socket
        |> assign(:users, users)
        |> assign(:total_count, total_count)

      {{:error, error}, _} ->
        socket
        |> assign(:users, [])
        |> assign(:total_count, 0)
        |> handle_error(error, "Failed to load users")

      {_, {:error, error}} ->
        socket
        |> assign(:users, [])
        |> assign(:total_count, 0)
        |> handle_error(error, "Failed to load users")
    end
  end

  defp load_presence(socket) do
    topic = "users_presence"

    online_users =
      topic
      |> Presence.list()
      |> Map.new(fn {user_id, %{metas: [meta | _]}} ->
        {user_id, meta}
      end)

    assign(socket, :online_users, online_users)
  end

  defp tier_badge_class(:pro), do: "bg-purple-100 text-purple-800"
  defp tier_badge_class(_), do: "bg-gray-100 text-gray-800"

  defp tier_display_name(:pro), do: "Pro"
  defp tier_display_name(_), do: "Free"

  def handle_event("next_page", _params, socket) do
    current_page = socket.assigns.page
    page_size = socket.assigns.page_size
    total_count = socket.assigns.total_count
    max_page = div(total_count - 1, page_size) + 1

    if current_page < max_page do
      socket =
        socket
        |> assign(:page, current_page + 1)
        |> load_users()

      {:noreply, socket}
    else
      {:noreply, socket}
    end
  end

  def handle_event("prev_page", _params, socket) do
    current_page = socket.assigns.page

    if current_page > 1 do
      socket =
        socket
        |> assign(:page, current_page - 1)
        |> load_users()

      {:noreply, socket}
    else
      {:noreply, socket}
    end
  end

  def handle_info(%{event: "presence_diff", topic: "users_presence"}, socket) do
    {:noreply, load_presence(socket)}
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
                        <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                          <%= if user.avatar do %>
                            <img
                              class="w-10 h-10 rounded-full"
                              src={user.avatar}
                              alt={user.name || user.email}
                            />
                          <% else %>
                            <span class="text-white font-medium text-sm">
                              {String.first(user.email) |> String.upcase()}
                            </span>
                          <% end %>
                        </div>
                        <div class="ml-3">
                          <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-900">
                              {user.name}
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ">
                      {user.email}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium #{if user.role == :admin, do: "bg-red-100 text-red-800", else: "bg-gray-100 text-gray-800"}"}>
                        {user.role |> Atom.to_string() |> String.capitalize()}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium #{tier_badge_class(Map.get(user, :tier))}"}>
                        {tier_display_name(Map.get(user, :tier))}
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
          
    <!-- Pagination Controls -->
          <%= if @total_count > @page_size do %>
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {(@page - 1) * @page_size + 1} to {min(@page * @page_size, @total_count)} of {@total_count} users
              </div>
              <div class="flex space-x-2">
                <%= if @page > 1 do %>
                  <button
                    phx-click="prev_page"
                    class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Previous
                  </button>
                <% end %>
                <%= if @page * @page_size < @total_count do %>
                  <button
                    phx-click="next_page"
                    class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Next
                  </button>
                <% end %>
              </div>
            </div>
          <% end %>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
