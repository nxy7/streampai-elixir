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

  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserPolicy
  alias Streampai.Accounts.UserPremiumGrant
  alias StreampaiWeb.Presence

  require Logger

  def mount(_params, _session, socket) do
    if connected?(socket) do
      topic = "users_presence"
      Phoenix.PubSub.subscribe(Streampai.PubSub, topic)
    end

    {users, page_info} = load_users_paginated(socket, nil)

    {:ok,
     socket
     |> assign(
       users: users,
       can_impersonate: UserPolicy.can_impersonate?(socket.assigns.current_user),
       online_users: %{},
       page_title: "User Management",
       after_cursor: page_info.after_cursor,
       has_more: page_info.more?,
       loading_more: false,
       show_grant_modal: false,
       selected_user: nil,
       grant_duration: "30",
       grant_reason: ""
     )
     |> load_presence(), layout: false}
  end

  defp load_users_paginated(socket, after_cursor) do
    actor = socket.assigns[:impersonator] || socket.assigns.current_user
    page_opts = if after_cursor, do: [after: after_cursor], else: []

    case User
         |> Ash.Query.for_read(:list_all, %{}, actor: actor)
         |> Ash.Query.page(page_opts)
         |> Ash.read() do
      {:ok, page} ->
        has_more = page.more? && length(page.results) > 0

        after_cursor =
          if has_more && length(page.results) > 0 do
            page.results |> List.last() |> Map.get(:__metadata__) |> Map.get(:keyset)
          end

        page_info = %{
          after_cursor: after_cursor,
          more?: has_more
        }

        {page.results, page_info}

      {:error, _error} ->
        {[], %{after_cursor: nil, more?: false}}
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

  def handle_event("load_more", _params, socket) do
    {new_users, page_info} = load_users_paginated(socket, socket.assigns.after_cursor)

    socket =
      socket
      |> assign(:users, socket.assigns.users ++ new_users)
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)
      |> assign(:loading_more, false)

    {:noreply, socket}
  end

  def handle_event("open_grant_modal", %{"user-id" => user_id}, socket) do
    selected_user = Enum.find(socket.assigns.users, &(&1.id == user_id))

    {:noreply,
     socket
     |> assign(:show_grant_modal, true)
     |> assign(:selected_user, selected_user)
     |> assign(:grant_duration, "30")
     |> assign(:grant_reason, "")}
  end

  def handle_event("close_grant_modal", _params, socket) do
    {:noreply,
     socket
     |> assign(:show_grant_modal, false)
     |> assign(:selected_user, nil)}
  end

  def handle_event("update_grant_duration", %{"duration" => duration}, socket) do
    {:noreply, assign(socket, :grant_duration, duration)}
  end

  def handle_event("update_grant_reason", params, socket) do
    # Handle both change and keyup events
    reason = params["value"] || get_in(params, ["reason"]) || ""

    Logger.debug("Received grant reason params: #{inspect(params)}, extracted reason: #{inspect(reason)}")

    {:noreply, assign(socket, :grant_reason, reason)}
  end

  def handle_event("grant_pro", _params, socket) do
    selected_user = socket.assigns.selected_user
    admin_user = socket.assigns[:impersonator] || socket.assigns.current_user
    duration_days = String.to_integer(socket.assigns.grant_duration)
    reason = socket.assigns.grant_reason

    if String.trim(reason) == "" do
      socket = put_flash(socket, :error, "Please provide a reason for granting PRO access")

      {:noreply, socket}
    else
      case UserPremiumGrant.create_grant(
             selected_user.id,
             admin_user.id,
             DateTime.add(DateTime.utc_now(), duration_days, :day),
             DateTime.utc_now(),
             reason
           ) do
        {:ok, _grant} ->
          Logger.info("PRO access granted to #{selected_user.email} for #{duration_days} days by #{admin_user.email}")

          # Reload users to reflect tier change
          {users, page_info} = load_users_paginated(socket, nil)

          socket =
            socket
            |> assign(:users, users)
            |> assign(:after_cursor, page_info.after_cursor)
            |> assign(:has_more, page_info.more?)
            |> assign(:show_grant_modal, false)
            |> assign(:selected_user, nil)
            |> put_flash(
              :info,
              "PRO access granted to #{selected_user.email} for #{duration_days} days"
            )

          {:noreply, socket}

        {:error, reason} ->
          Logger.error("Failed to grant PRO access: #{inspect(reason)}")

          socket = put_flash(socket, :error, "Failed to grant PRO access. Please try again.")

          {:noreply, socket}
      end
    end
  end

  def handle_event("revoke_pro", %{"user-id" => user_id}, socket) do
    require Ash.Query

    admin_user = socket.assigns[:impersonator] || socket.assigns.current_user
    user = Enum.find(socket.assigns.users, &(&1.id == user_id))

    # Find active grants for this user
    case UserPremiumGrant
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(revoked_at))
         |> Ash.read() do
      {:ok, grants} ->
        # Revoke all active grants
        results =
          Enum.map(grants, fn grant ->
            Ash.update(grant, %{revoked_at: DateTime.utc_now()}, action: :revoke)
          end)

        if Enum.all?(results, &match?({:ok, _}, &1)) do
          Logger.info("PRO access revoked for #{user.email} by #{admin_user.email}")

          # Reload users to reflect tier change
          {users, page_info} = load_users_paginated(socket, nil)

          socket =
            socket
            |> assign(:users, users)
            |> assign(:after_cursor, page_info.after_cursor)
            |> assign(:has_more, page_info.more?)
            |> put_flash(:info, "PRO access revoked for #{user.email}")

          {:noreply, socket}
        else
          socket = put_flash(socket, :error, "Failed to revoke PRO access")
          {:noreply, socket}
        end

      {:error, _reason} ->
        socket = put_flash(socket, :error, "Failed to find active grants")
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
                          <%= if user.display_avatar do %>
                            <img
                              class="w-10 h-10 rounded-full"
                              src={user.display_avatar}
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
                        <div class="flex items-center space-x-3">
                          <%= if @current_user.id != user.id do %>
                            <a
                              href={"/impersonation/start/#{user.id}"}
                              class="text-purple-600 hover:text-purple-900 hover:underline"
                            >
                              Impersonate
                            </a>
                          <% end %>
                          <%= if Map.get(user, :tier) == :pro do %>
                            <button
                              phx-click="revoke_pro"
                              phx-value-user-id={user.id}
                              class="text-red-600 hover:text-red-900 hover:underline"
                              data-confirm="Are you sure you want to revoke PRO access for this user?"
                            >
                              Revoke PRO
                            </button>
                          <% else %>
                            <button
                              phx-click="open_grant_modal"
                              phx-value-user-id={user.id}
                              class="text-green-600 hover:text-green-900 hover:underline"
                            >
                              Grant PRO
                            </button>
                          <% end %>
                        </div>
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

          <%= if @has_more do %>
            <div class="px-6 py-4 border-t border-gray-200 text-center">
              <button
                phx-click="load_more"
                disabled={@loading_more}
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                id="load-more-users"
                phx-hook="InfiniteScroll"
              >
                <%= if @loading_more do %>
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    >
                    </circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    >
                    </path>
                  </svg>
                  Loading...
                <% else %>
                  Load More Users
                <% end %>
              </button>
            </div>
          <% else %>
            <%= if length(@users) > 0 do %>
              <div class="px-6 py-4 border-t border-gray-200 text-center">
                <p class="text-sm text-gray-500">
                  <.icon name="hero-check-circle" class="inline-block w-4 h-4 mr-1" />
                  You've reached the end of the list
                </p>
              </div>
            <% end %>
          <% end %>
        </div>

        <%!-- Grant PRO Modal --%>
        <%= if @show_grant_modal && @selected_user do %>
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
            phx-click="close_grant_modal"
          >
            <div
              class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              phx-click={JS.exec("phx-click", to: ".modal-content")}
            >
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">
                    Grant PRO Access
                  </h3>
                  <button
                    phx-click="close_grant_modal"
                    class="text-gray-400 hover:text-gray-500"
                  >
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="px-6 py-4 space-y-4">
                <div>
                  <p class="text-sm text-gray-700">
                    Grant PRO access to <span class="font-semibold">{@selected_user.email}</span>
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    phx-change="update_grant_duration"
                    name="duration"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  >
                    <option value="30" selected={@grant_duration == "30"}>30 days</option>
                    <option value="90" selected={@grant_duration == "90"}>90 days (3 months)</option>
                    <option value="180" selected={@grant_duration == "180"}>
                      180 days (6 months)
                    </option>
                    <option value="365" selected={@grant_duration == "365"}>365 days (1 year)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    phx-keyup="update_grant_reason"
                    phx-debounce="300"
                    name="reason"
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    placeholder="e.g., Beta tester, Partner program, Promotional access..."
                  >{@grant_reason}</textarea>
                  <p class="mt-1 text-xs text-gray-500">
                    This will be logged for auditing purposes
                  </p>
                </div>
              </div>

              <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                <button
                  phx-click="close_grant_modal"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  phx-click="grant_pro"
                  class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Grant PRO Access
                </button>
              </div>
            </div>
          </div>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
