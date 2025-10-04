defmodule StreampaiWeb.DashboardStreamHistoryLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamEvent
  alias StreampaiWeb.Utils.DateTimeUtils

  require Ash.Query

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    stream_list = load_streams(user_id)
    monthly_stats = calculate_monthly_stats(stream_list)

    socket =
      socket
      |> assign(:stream_list, stream_list)
      |> assign(:monthly_stats, monthly_stats)
      |> assign(:page_title, "Stream History")
      |> assign(:filters, %{platform: "all", date_range: "30days", sort: "recent"})

    {:ok, socket, layout: false}
  end

  def handle_event("update_filter", %{"filter" => filter_params}, socket) do
    user_id = socket.assigns.current_user.id
    filters = Map.merge(socket.assigns.filters, filter_params)
    stream_list = user_id |> load_streams() |> apply_filters(filters)

    socket =
      socket
      |> assign(:filters, filters)
      |> assign(:stream_list, stream_list)

    {:noreply, socket}
  end

  defp load_streams(user_id) do
    user_id
    |> Livestream.get_completed_by_user!(authorize?: false)
    |> Enum.map(&enrich_stream_data/1)
  end

  defp enrich_stream_data(livestream) do
    chat_message_count = count_chat_messages(livestream.id)
    platforms = get_stream_platforms(livestream.id)
    duration_seconds = calculate_duration(livestream.started_at, livestream.ended_at)

    %{
      id: livestream.id,
      title: livestream.title,
      thumbnail_url: livestream.thumbnail_url || "/images/placeholder-thumbnail.jpg",
      started_at: livestream.started_at,
      ended_at: livestream.ended_at,
      duration_seconds: duration_seconds,
      platforms: platforms,
      max_viewers: "-",
      avg_viewers: "-",
      total_chat_messages: chat_message_count
    }
  end

  defp count_chat_messages(livestream_id) do
    ChatMessage
    |> Ash.Query.for_read(:get_count_for_livestream, %{livestream_id: livestream_id})
    |> Ash.count!(authorize?: false)
  end

  defp get_stream_platforms(livestream_id) do
    livestream_id
    |> StreamEvent.get_platform_started_for_livestream!(authorize?: false)
    |> Enum.map(& &1.platform)
    |> Enum.uniq()
  end

  defp calculate_duration(started_at, nil), do: DateTime.diff(DateTime.utc_now(), started_at)
  defp calculate_duration(started_at, ended_at), do: DateTime.diff(ended_at, started_at)

  defp calculate_monthly_stats(streams) do
    cutoff = DateTime.add(DateTime.utc_now(), -30 * 24 * 60 * 60, :second)
    recent_streams = Enum.filter(streams, &DateTime.after?(&1.started_at, cutoff))

    total_hours =
      recent_streams
      |> Enum.map(& &1.duration_seconds)
      |> Enum.sum()
      |> div(3600)

    total_messages = Enum.sum(Enum.map(recent_streams, & &1.total_chat_messages))

    %{
      total_streams: length(recent_streams),
      total_hours: total_hours,
      avg_viewers: "-",
      total_followers: "-",
      total_chat_messages: total_messages
    }
  end

  defp apply_filters(streams, filters) do
    streams
    |> filter_by_platform(filters.platform)
    |> filter_by_date_range(filters.date_range)
    |> sort_streams(filters.sort)
  end

  defp filter_by_platform(streams, "all"), do: streams

  defp filter_by_platform(streams, platform) when is_binary(platform) do
    platform_atom = String.to_existing_atom(platform)
    Enum.filter(streams, &(platform_atom in &1.platforms))
  rescue
    ArgumentError -> streams
  end

  defp filter_by_date_range(streams, "7days") do
    cutoff = DateTime.add(DateTime.utc_now(), -7 * 24 * 60 * 60, :second)
    Enum.filter(streams, &DateTime.after?(&1.started_at, cutoff))
  end

  defp filter_by_date_range(streams, "30days") do
    cutoff = DateTime.add(DateTime.utc_now(), -30 * 24 * 60 * 60, :second)
    Enum.filter(streams, &DateTime.after?(&1.started_at, cutoff))
  end

  defp filter_by_date_range(streams, _), do: streams

  defp sort_streams(streams, "recent") do
    Enum.sort_by(streams, & &1.started_at, {:desc, DateTime})
  end

  defp sort_streams(streams, "duration") do
    Enum.sort_by(streams, & &1.duration_seconds, :desc)
  end

  defp sort_streams(streams, "viewers") do
    Enum.sort_by(streams, & &1.max_viewers, :desc)
  end

  defp sort_streams(streams, _), do: streams

  defp format_duration(seconds), do: DateTimeUtils.format_duration(seconds)

  defp format_date(datetime), do: DateTimeUtils.format_date(datetime)

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="stream-history" page_title="Stream History">
      <div class="max-w-7xl mx-auto">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    >
                    </path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-2xl font-bold text-gray-900">{@monthly_stats.total_streams}</div>
                <p class="text-sm text-gray-500">Streams (30 days)</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    >
                    </path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-2xl font-bold text-gray-900">{@monthly_stats.total_hours}h</div>
                <p class="text-sm text-gray-500">Total Stream Time</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    >
                    </path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    >
                    </path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-2xl font-bold text-gray-900">{@monthly_stats.avg_viewers}</div>
                <p class="text-sm text-gray-500">Avg Viewers</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    class="w-4 h-4 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    >
                    </path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-2xl font-bold text-gray-900">{@monthly_stats.total_followers}</div>
                <p class="text-sm text-gray-500">New Followers</p>
              </div>
            </div>
          </div>
        </div>
        
    <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Streams</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <select
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                phx-change="update_filter"
                name="filter[date_range]"
              >
                <option value="7days" selected={@filters.date_range == "7days"}>Last 7 days</option>
                <option value="30days" selected={@filters.date_range == "30days"}>
                  Last 30 days
                </option>
                <option value="all" selected={@filters.date_range == "all"}>All time</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                phx-change="update_filter"
                name="filter[sort]"
              >
                <option value="recent" selected={@filters.sort == "recent"}>Most Recent</option>
                <option value="duration" selected={@filters.sort == "duration"}>
                  Longest Duration
                </option>
                <option value="viewers" selected={@filters.sort == "viewers"}>Most Viewers</option>
              </select>
            </div>
          </div>
        </div>
        
    <!-- Stream History List -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Streams</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <%= for stream <- @stream_list do %>
              <.link
                navigate={~p"/dashboard/stream-history/#{stream.id}"}
                class="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <img
                      src={stream.thumbnail_url}
                      alt="Stream thumbnail"
                      class="w-24 h-14 object-cover rounded-lg"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="text-sm font-medium text-gray-900 truncate">
                          {stream.title}
                        </h4>
                        <div class="flex items-center space-x-2 mt-1 flex-wrap">
                          <%= for platform <- stream.platforms do %>
                            <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(platform)}"}>
                              {platform_name(platform)}
                            </span>
                          <% end %>
                          <span class="text-xs text-gray-500">
                            {format_date(stream.started_at)}
                          </span>
                          <span class="text-xs text-gray-500">
                            {format_duration(stream.duration_seconds)}
                          </span>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-medium text-gray-900">
                          {stream.max_viewers} peak viewers
                        </div>
                        <div class="text-xs text-gray-500">
                          {stream.avg_viewers} avg • {stream.total_chat_messages} messages
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <svg
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      >
                      </path>
                    </svg>
                  </div>
                </div>
              </.link>
            <% end %>
          </div>

          <%= if Enum.empty?(@stream_list) do %>
            <div class="text-center py-12">
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                >
                </path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No streams found</h3>
              <p class="mt-1 text-sm text-gray-500">
                No streams match your current filters.
              </p>
            </div>
          <% end %>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
