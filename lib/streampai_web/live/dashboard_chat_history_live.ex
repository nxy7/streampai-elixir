defmodule StreampaiWeb.DashboardChatHistoryLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Fake.Chat

  def mount_page(socket, _params, _session) do
    chat_messages = get_cached_chat_messages()

    socket =
      socket
      |> assign(:chat_messages, chat_messages)
      |> assign(:page_title, "Chat History")
      |> assign(:filters, %{platform: "all", date_range: "7days", message_type: "all", search: ""})

    {:ok, socket, layout: false}
  end

  def handle_event("update_filter", %{"filter" => filter_params}, socket) do
    filters = Map.merge(socket.assigns.filters, filter_params)
    chat_messages = apply_filters(get_cached_chat_messages(), filters)

    socket =
      socket
      |> assign(:filters, filters)
      |> assign(:chat_messages, chat_messages)

    {:noreply, socket}
  end

  defp get_cached_chat_messages do
    case :ets.lookup(:chat_cache, :messages) do
      [{:messages, messages, timestamp}] ->
        if DateTime.diff(DateTime.utc_now(), timestamp, :second) < 300 do
          Enum.take(messages, 20)
        else
          regenerate_and_cache_messages()
        end

      [] ->
        regenerate_and_cache_messages()
    end
  rescue
    ArgumentError ->
      :ets.new(:chat_cache, [:set, :public, :named_table])
      regenerate_and_cache_messages()
  end

  defp regenerate_and_cache_messages do
    messages = Chat.generate_chat_history_messages(50)
    :ets.insert(:chat_cache, {:messages, messages, DateTime.utc_now()})
    Enum.take(messages, 20)
  end

  defp apply_filters(messages, filters) do
    messages
    |> filter_by_platform(filters.platform)
    |> filter_by_search(filters.search)
    |> Enum.take(20)
  end

  defp filter_by_platform(messages, "all"), do: messages

  defp filter_by_platform(messages, platform) when is_binary(platform) do
    platform_atom = String.to_existing_atom(platform)
    Enum.filter(messages, &(&1.platform == platform_atom))
  rescue
    ArgumentError -> messages
  end

  defp filter_by_search(messages, ""), do: messages
  defp filter_by_search(messages, nil), do: messages

  defp filter_by_search(messages, search_term) when is_binary(search_term) do
    search_lower = String.downcase(search_term)

    Enum.filter(messages, fn message ->
      String.contains?(String.downcase(message.message), search_lower) ||
        String.contains?(String.downcase(message.username), search_lower)
    end)
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="chat-history" page_title="Chat History">
      <div class="max-w-7xl mx-auto">
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Chat Messages</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                phx-change="update_filter"
                name="filter[platform]"
              >
                <option value="all" selected={@filters.platform == "all"}>All Platforms</option>
                <option value="twitch" selected={@filters.platform == "twitch"}>Twitch</option>
                <option value="youtube" selected={@filters.platform == "youtube"}>YouTube</option>
                <option value="facebook" selected={@filters.platform == "facebook"}>Facebook</option>
                <option value="kick" selected={@filters.platform == "kick"}>Kick</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>All time</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>All Messages</option>
                <option>Regular Chat</option>
                <option>Donations</option>
                <option>Subscriptions</option>
                <option>Follows</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search messages..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                phx-change="update_filter"
                name="filter[search]"
                value={@filters.search}
                phx-debounce="300"
              />
            </div>
          </div>
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
                      <.link
                        navigate={~p"/dashboard/viewers/#{Map.get(message, :viewer_id, "viewer_1")}"}
                        class="text-sm font-medium text-gray-900 hover:text-purple-600 hover:underline transition-colors"
                      >
                        {message.username}
                      </.link>
                      <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(message.platform)}"}>
                        {platform_name(message.platform)}
                      </span>
                      <%= if message.is_donation && message.donation_amount do %>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Donation: ${:erlang.float_to_binary(message.donation_amount, decimals: 2)}
                        </span>
                      <% end %>
                      <span class="text-xs text-gray-500">
                        {format_time_ago(message.minutes_ago)}
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
