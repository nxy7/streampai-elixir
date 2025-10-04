defmodule StreampaiWeb.DashboardChatHistoryLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Stream.ChatMessage

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    filters = %{platform: "all", date_range: "7days", search: ""}
    chat_messages = load_chat_messages(user_id, filters)

    socket =
      socket
      |> assign(:chat_messages, chat_messages)
      |> assign(:page_title, "Chat History")
      |> assign(:filters, filters)

    {:ok, socket, layout: false}
  end

  def handle_event("update_filter", %{"filter" => filter_params}, socket) do
    filters = %{
      platform: Map.get(filter_params, "platform", "all"),
      date_range: Map.get(filter_params, "date_range", "7days"),
      search: Map.get(filter_params, "search", "")
    }

    user_id = socket.assigns.current_user.id
    chat_messages = load_chat_messages(user_id, filters)

    socket =
      socket
      |> assign(:filters, filters)
      |> assign(:chat_messages, chat_messages)

    {:noreply, socket}
  end

  defp load_chat_messages(user_id, filters) do
    platform =
      case filters.platform do
        "all" -> nil
        platform_string -> String.to_existing_atom(platform_string)
      end

    date_range =
      case filters.date_range do
        "all" -> nil
        range -> range
      end

    user_id
    |> ChatMessage.get_for_user!(20, platform, date_range, authorize?: false)
    |> apply_search_filter(filters.search)
    |> Enum.map(&format_message/1)
  end

  defp apply_search_filter(messages, search) when search in ["", nil], do: messages

  defp apply_search_filter(messages, search_term) do
    search_lower = String.downcase(search_term)

    Enum.filter(messages, fn message ->
      String.contains?(String.downcase(message.message), search_lower) ||
        String.contains?(String.downcase(message.sender_username), search_lower)
    end)
  end

  defp format_message(chat_message) do
    %{
      id: chat_message.id,
      username: chat_message.sender_username,
      message: chat_message.message,
      platform: chat_message.platform,
      viewer_id: chat_message.viewer_id,
      inserted_at: chat_message.inserted_at,
      is_moderator: chat_message.sender_is_moderator
    }
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
                          {message.username}
                        </.link>
                      <% else %>
                        <span class="text-sm font-medium text-gray-900">
                          {message.username}
                        </span>
                      <% end %>
                      <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(message.platform)}"}>
                        {platform_name(message.platform)}
                      </span>
                      <%= if message.is_moderator do %>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Moderator
                        </span>
                      <% end %>
                      <span class="text-xs text-gray-500">
                        {format_datetime(message.inserted_at)}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600">{message.message}</p>
                  </div>
                </div>
              </div>
            <% end %>
          </div>
          
    <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">1</span>
                to <span class="font-medium">{length(@chat_messages)}</span>
                of <span class="font-medium">{length(@chat_messages)}</span>
                messages
              </p>
              <div class="flex items-center space-x-2">
                <button class="bg-gray-100 text-gray-400 px-3 py-2 rounded-lg text-sm cursor-not-allowed">
                  Previous
                </button>
                <button class="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
