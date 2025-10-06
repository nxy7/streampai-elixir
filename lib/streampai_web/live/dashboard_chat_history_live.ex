defmodule StreampaiWeb.DashboardChatHistoryLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Stream.ChatMessage

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    filters = %{platform: "all", date_range: "7days", search: ""}

    {chat_messages, page_info} = load_chat_messages(user_id, filters, nil)

    socket =
      socket
      |> assign(:chat_messages, chat_messages)
      |> assign(:page_title, "Chat History")
      |> assign(:filters, filters)
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)
      |> assign(:loading_more, false)

    {:ok, socket, layout: false}
  end

  def handle_event("update_filter", %{"filter" => filter_params}, socket) do
    filters = %{
      platform: Map.get(filter_params, "platform", "all"),
      date_range: Map.get(filter_params, "date_range", "7days"),
      search: Map.get(filter_params, "search", "")
    }

    user_id = socket.assigns.current_user.id
    {chat_messages, page_info} = load_chat_messages(user_id, filters, nil)

    socket =
      socket
      |> assign(:filters, filters)
      |> assign(:chat_messages, chat_messages)
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)

    {:noreply, socket}
  end

  def handle_event("load_more", _params, socket) do
    user_id = socket.assigns.current_user.id

    {new_messages, page_info} =
      load_chat_messages(user_id, socket.assigns.filters, socket.assigns.after_cursor)

    socket =
      socket
      |> assign(:chat_messages, socket.assigns.chat_messages ++ new_messages)
      |> assign(:after_cursor, page_info.after_cursor)
      |> assign(:has_more, page_info.more?)
      |> assign(:loading_more, false)

    {:noreply, socket}
  end

  defp load_chat_messages(user_id, filters, after_cursor) do
    query_args = build_query_args(user_id, filters)
    page_opts = if after_cursor, do: [after: after_cursor], else: []

    page =
      ChatMessage
      |> Ash.Query.for_read(:get_for_user, query_args)
      |> Ash.Query.page(page_opts)
      |> Ash.read!(authorize?: false)

    {page.results, build_page_info(page)}
  end

  defp build_query_args(user_id, filters) do
    %{
      user_id: user_id,
      platform: parse_platform(filters.platform),
      date_range: parse_date_range(filters.date_range),
      search: parse_search(filters.search)
    }
  end

  defp parse_platform("all"), do: nil
  defp parse_platform(platform_string), do: String.to_existing_atom(platform_string)

  defp parse_date_range("all"), do: nil
  defp parse_date_range(range), do: range

  defp parse_search(""), do: nil
  defp parse_search(term), do: term

  defp build_page_info(page) do
    has_more = page.more? && length(page.results) > 0

    after_cursor =
      if has_more && length(page.results) > 0 do
        page.results |> List.last() |> Map.get(:__metadata__) |> Map.get(:keyset)
      end

    %{after_cursor: after_cursor, more?: has_more}
  end

  defp format_datetime(datetime) do
    now = DateTime.utc_now()
    diff_seconds = DateTime.diff(now, datetime, :second)

    cond do
      diff_seconds < 60 ->
        "just now"

      diff_seconds < 3600 ->
        minutes = div(diff_seconds, 60)
        "#{minutes}m ago"

      diff_seconds < 86_400 ->
        hours = div(diff_seconds, 3600)
        "#{hours}h ago"

      diff_seconds < 604_800 ->
        days = div(diff_seconds, 86_400)
        "#{days}d ago"

      true ->
        Calendar.strftime(datetime, "%b %d, %Y")
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="chat-history" page_title="Chat History">
      <div class="max-w-7xl mx-auto">
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Chat Messages</h3>
          <form phx-change="update_filter">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="filter[platform]"
                >
                  <option value="all" selected={@filters.platform == "all"}>All Platforms</option>
                  <option value="twitch" selected={@filters.platform == "twitch"}>Twitch</option>
                  <option value="youtube" selected={@filters.platform == "youtube"}>YouTube</option>
                  <option value="facebook" selected={@filters.platform == "facebook"}>
                    Facebook
                  </option>
                  <option value="kick" selected={@filters.platform == "kick"}>Kick</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="filter[date_range]"
                >
                  <option value="7days" selected={@filters.date_range == "7days"}>Last 7 days</option>
                  <option value="30days" selected={@filters.date_range == "30days"}>
                    Last 30 days
                  </option>
                  <option value="3months" selected={@filters.date_range == "3months"}>
                    Last 3 months
                  </option>
                  <option value="all" selected={@filters.date_range == "all"}>All time</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search messages..."
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  name="filter[search]"
                  value={@filters.search}
                  phx-debounce="300"
                />
              </div>
            </div>
          </form>
        </div>
        
    <!-- Chat Messages -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Messages</h3>
          </div>
          <%= if @chat_messages == [] do %>
            <div class="px-6 py-12 text-center">
              <.icon name="hero-chat-bubble-left-right" class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
              <p class="mt-1 text-sm text-gray-500">
                <%= if @filters.search != "" do %>
                  No messages match your search criteria. Try adjusting your filters.
                <% else %>
                  Start streaming to receive chat messages from your viewers.
                <% end %>
              </p>
              <%= if @filters.platform != "all" or @filters.date_range != "7days" or @filters.search != "" do %>
                <div class="mt-6">
                  <button
                    phx-click="update_filter"
                    phx-value-filter={
                      Jason.encode!(%{platform: "all", date_range: "7days", search: ""})
                    }
                    class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Clear Filters
                  </button>
                </div>
              <% end %>
            </div>
          <% else %>
            <div class="divide-y divide-gray-200">
              <%= for message <- @chat_messages do %>
                <div class="p-6">
                  <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                      <div class={"w-8 h-8 rounded-full flex items-center justify-center #{platform_color(message.platform)}"}>
                        <span class="text-white font-medium text-xs">
                          {platform_initial(message.platform)}
                        </span>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2 mb-1">
                        <%= if message.viewer_id do %>
                          <.link
                            navigate={~p"/dashboard/viewers/#{message.viewer_id}"}
                            class="text-sm font-medium text-gray-900 hover:text-purple-600 hover:underline transition-colors"
                          >
                            {message.sender_username}
                          </.link>
                        <% else %>
                          <span class="text-sm font-medium text-gray-900">
                            {message.sender_username}
                          </span>
                        <% end %>
                        <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(message.platform)}"}>
                          {platform_name(message.platform)}
                        </span>
                        <%= if message.sender_is_moderator do %>
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Moderator
                          </span>
                        <% end %>
                        <%= if message.livestream_id do %>
                          <.link
                            navigate={~p"/dashboard/stream-history/#{message.livestream_id}"}
                            class="text-xs text-blue-600 hover:underline"
                          >
                            {format_datetime(message.inserted_at)}
                          </.link>
                        <% else %>
                          <span class="text-xs text-gray-500">
                            {format_datetime(message.inserted_at)}
                          </span>
                        <% end %>
                      </div>
                      <p class="text-sm text-gray-600">{message.message}</p>
                    </div>
                  </div>
                </div>
              <% end %>
            </div>
            
    <!-- Load More Button / End of List -->
            <%= if @has_more do %>
              <div class="px-6 py-4 border-t border-gray-200 text-center">
                <button
                  phx-click="load_more"
                  disabled={@loading_more}
                  class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="load-more-chat"
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
                    Load More Messages
                  <% end %>
                </button>
              </div>
            <% else %>
              <%= if length(@chat_messages) > 0 do %>
                <div class="px-6 py-4 border-t border-gray-200 text-center">
                  <p class="text-sm text-gray-500">
                    <.icon name="hero-check-circle" class="inline-block w-4 h-4 mr-1" />
                    You've reached the end of the list
                  </p>
                </div>
              <% end %>
            <% end %>
          <% end %>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
