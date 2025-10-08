defmodule StreampaiWeb.DashboardModerateLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  alias Streampai.Accounts.UserRole
  alias StreampaiWeb.Presence

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id

    # Load is_moderator calculation for current user
    current_user =
      case Ash.load(socket.assigns.current_user, :is_moderator, authorize?: false) do
        {:ok, user} -> user
        _ -> socket.assigns.current_user
      end

    # Get list of users this user moderates for
    moderated_users = load_moderated_users(user_id)

    # Subscribe to presence updates
    if Phoenix.LiveView.connected?(socket) do
      Phoenix.PubSub.subscribe(Streampai.PubSub, "users_presence")
    end

    socket =
      socket
      |> assign(:current_user, current_user)
      |> assign(:page_title, "Moderate")
      |> assign(:moderated_users, moderated_users)

    {:ok, socket, layout: false}
  end

  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff"}, socket) do
    # Reload moderated users with updated presence
    moderated_users = load_moderated_users(socket.assigns.current_user.id)
    {:noreply, assign(socket, :moderated_users, moderated_users)}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  defp load_moderated_users(user_id) do
    case UserRole.get_user_roles_for_user(%{user_id: user_id}, authorize?: false) do
      {:ok, roles} ->
        Enum.map(roles, fn role ->
          online? = user_online?(role.granter.id)
          streaming? = user_streaming?(role.granter.id)

          %{
            id: role.granter.id,
            name: role.granter.name || role.granter.email,
            email: role.granter.email,
            avatar: role.granter.display_avatar,
            online: online?,
            streaming: streaming?,
            role_type: role.role_type
          }
        end)

      _ ->
        []
    end
  end

  defp user_online?(user_id) do
    topic = "users_presence"
    presences = Presence.list(topic)
    Map.has_key?(presences, user_id)
  end

  defp user_streaming?(user_id) do
    # Check if user has an active stream
    require Ash.Query

    case Streampai.Stream.Livestream
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [_stream]} -> true
      _ -> false
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="moderate" page_title="Moderate">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Users You Moderate</h2>
          <p class="mt-1 text-sm text-gray-600">
            Manage streams for users who have granted you moderator permissions
          </p>
        </div>

        <%= if Enum.empty?(@moderated_users) do %>
          <div class="bg-white rounded-lg shadow p-8 text-center">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">No users to moderate</h3>
            <p class="mt-2 text-sm text-gray-500">
              You haven't been granted moderator permissions for any users yet.
            </p>
          </div>
        <% else %>
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Stream
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <%= for user <- @moderated_users do %>
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <%= if user.avatar do %>
                            <img class="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                          <% else %>
                            <div class="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                              {String.first(user.name || user.email) |> String.upcase()}
                            </div>
                          <% end %>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">{user.name}</div>
                          <div class="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <%= if user.online do %>
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Online
                        </span>
                      <% else %>
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Offline
                        </span>
                      <% end %>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <%= if user.streaming do %>
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <span class="flex items-center">
                            <span class="h-2 w-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                            Live
                          </span>
                        </span>
                      <% else %>
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Offline
                        </span>
                      <% end %>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-500 capitalize">
                        {to_string(user.role_type)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <.link
                        navigate={"/dashboard/moderate/#{user.id}"}
                        class="text-purple-600 hover:text-purple-900"
                      >
                        Manage Stream
                      </.link>
                    </td>
                  </tr>
                <% end %>
              </tbody>
            </table>
          </div>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
