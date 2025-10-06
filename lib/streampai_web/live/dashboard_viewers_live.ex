defmodule StreampaiWeb.DashboardViewersLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  alias Streampai.Stream.StreamViewer

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    {viewers, page_info} = load_viewers(user_id, nil)

    socket =
      socket
      |> assign(:page_title, "Viewers")
      |> assign(:viewers, viewers)
      |> assign(:search_query, "")
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)
      |> assign(:loading_more, false)

    {:ok, socket, layout: false}
  end

  def handle_event("search", %{"query" => query}, socket) do
    user_id = socket.assigns.current_user.id

    {viewers, page_info} =
      if query == "" do
        load_viewers(user_id, nil)
      else
        {search_viewers(user_id, query), %{after_cursor: nil, more?: false}}
      end

    socket =
      socket
      |> assign(:viewers, viewers)
      |> assign(:search_query, query)
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)

    {:noreply, socket}
  end

  def handle_event("load_more", _params, socket) do
    user_id = socket.assigns.current_user.id
    {new_viewers, page_info} = load_viewers(user_id, socket.assigns.after_cursor)

    socket =
      socket
      |> assign(:viewers, socket.assigns.viewers ++ new_viewers)
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)
      |> assign(:loading_more, false)

    {:noreply, socket}
  end

  defp load_viewers(user_id, after_cursor) do
    page_opts = if after_cursor, do: [after: after_cursor], else: []

    page =
      StreamViewer
      |> Ash.Query.for_read(:for_user, %{user_id: user_id})
      |> Ash.Query.page(page_opts)
      |> Ash.read!(authorize?: false)

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
  end

  defp search_viewers(user_id, query) do
    StreamViewer.by_display_name!(
      user_id: user_id,
      display_name: query,
      similarity_threshold: 0.3
    )
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="viewers" page_title="Viewers">
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Viewers</h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track all viewers across platforms
          </p>
        </div>

        <div class="flex items-center gap-4">
          <form phx-change="search" class="flex-1">
            <input
              type="text"
              name="query"
              value={@search_query}
              placeholder="Search viewers..."
              class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </form>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Viewer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Seen
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <%= for viewer <- @viewers do %>
                <tr
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  phx-click={JS.navigate("/dashboard/viewers/#{viewer.viewer_id}:#{viewer.user_id}")}
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <%= if viewer.avatar_url do %>
                          <img class="h-10 w-10 rounded-full" src={viewer.avatar_url} alt="" />
                        <% else %>
                          <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span class="text-gray-600 dark:text-gray-300 font-medium">
                              {String.first(viewer.display_name) |> String.upcase()}
                            </span>
                          </div>
                        <% end %>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {viewer.display_name}
                        </div>
                        <%= if viewer.channel_url do %>
                          <a
                            href={viewer.channel_url}
                            target="_blank"
                            class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Channel
                          </a>
                        <% end %>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex gap-2">
                      <%= if viewer.is_verified do %>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Verified
                        </span>
                      <% end %>
                      <%= if viewer.is_owner do %>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Owner
                        </span>
                      <% end %>
                      <%= if viewer.is_moderator do %>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Mod
                        </span>
                      <% end %>
                      <%= if viewer.is_patreon do %>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                          Patron
                        </span>
                      <% end %>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {Calendar.strftime(viewer.last_seen_at, "%b %d, %Y %I:%M %p")}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {viewer.notes || "-"}
                  </td>
                </tr>
              <% end %>
            </tbody>
          </table>

          <%= if Enum.empty?(@viewers) do %>
            <div class="text-center py-12">
              <p class="text-gray-500 dark:text-gray-400">
                <%= if @search_query != "" do %>
                  No viewers found matching "{@search_query}"
                <% else %>
                  No viewers yet. They'll appear here once someone chats!
                <% end %>
              </p>
            </div>
          <% end %>
        </div>

        <%= if @has_more do %>
          <div class="text-center">
            <button
              phx-click="load_more"
              disabled={@loading_more}
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              id="load-more-viewers"
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
                Load More Viewers
              <% end %>
            </button>
          </div>
        <% else %>
          <%= if length(@viewers) > 0 do %>
            <div class="text-center py-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                <.icon name="hero-check-circle" class="inline-block w-4 h-4 mr-1" />
                You've reached the end of the list
              </p>
            </div>
          <% end %>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
