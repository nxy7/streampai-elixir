defmodule StreampaiWeb.DashboardStreamHistoryLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Stream.Livestream
  alias StreampaiWeb.Utils.DateTimeUtils

  require Ash.Query

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id
    filters = %{platform: "all", date_range: "30days", sort: "recent"}
    stream_list = user_id |> load_streams() |> apply_filters(filters)
    stats = calculate_stats(stream_list, filters)

    socket =
      socket
      |> assign(:stream_list, stream_list)
      |> assign(:stats, stats)
      |> assign(:page_title, "Stream History")
      |> assign(:filters, filters)

    {:ok, socket, layout: false}
  end

  def handle_event("update_filter", %{"filter" => filter_params}, socket) do
    user_id = socket.assigns.current_user.id

    filters = %{
      platform: Map.get(filter_params, "platform", "all"),
      date_range: Map.get(filter_params, "date_range", "30days"),
      sort: Map.get(filter_params, "sort", "recent")
    }

    stream_list = user_id |> load_streams() |> apply_filters(filters)
    stats = calculate_stats(stream_list, filters)

    socket =
      socket
      |> assign(:filters, filters)
      |> assign(:stream_list, stream_list)
      |> assign(:stats, stats)

    {:noreply, socket}
  end

  defp load_streams(user_id) do
    Livestream
    |> Ash.Query.for_read(:get_completed_by_user, %{user_id: user_id})
    |> Ash.Query.load([
      :average_viewers,
      :peak_viewers,
      :messages_amount,
      :duration_seconds,
      :platforms,
      :thumbnail_url,
      thumbnail_file: [:url]
    ])
    |> Ash.read!(authorize?: false)
    |> Enum.map(&enrich_stream_data/1)
  end

  defp enrich_stream_data(livestream) do
    %{
      id: livestream.id,
      title: livestream.title,
      thumbnail_url: livestream.thumbnail_url || "/images/placeholder-thumbnail.jpg",
      started_at: livestream.started_at,
      ended_at: livestream.ended_at,
      duration_seconds: livestream.duration_seconds || 0,
      platforms: livestream.platforms || [],
      max_viewers: livestream.peak_viewers || 0,
      avg_viewers: livestream.average_viewers || 0,
      total_chat_messages: livestream.messages_amount || 0
    }
  end

  defp calculate_stats(streams, filters) do
    total_seconds =
      streams
      |> Enum.map(& &1.duration_seconds)
      |> Enum.sum()

    total_hours = div(total_seconds, 3600)
    total_minutes = div(rem(total_seconds, 3600), 60)
    total_time_formatted = "#{total_hours}h #{total_minutes}m"

    avg_viewers =
      case streams do
        [] ->
          0

        _ ->
          total_avg = Enum.sum(Enum.map(streams, & &1.avg_viewers))
          round(total_avg / length(streams))
      end

    date_range_label =
      case filters.date_range do
        "7days" -> "7 days"
        "30days" -> "30 days"
        "all" -> "all time"
        _ -> "30 days"
      end

    %{
      total_streams: length(streams),
      total_time: total_time_formatted,
      avg_viewers: avg_viewers,
      date_range_label: date_range_label
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
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Streams</h3>
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
                  <option value="all" selected={@filters.date_range == "all"}>All time</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          </form>
        </div>
        
    <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <div class="text-2xl font-bold text-gray-900">{@stats.total_streams}</div>
                <p class="text-sm text-gray-500">Streams ({@stats.date_range_label})</p>
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
                <div class="text-2xl font-bold text-gray-900">{@stats.total_time}</div>
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
                <div class="text-2xl font-bold text-gray-900">{@stats.avg_viewers}</div>
                <p class="text-sm text-gray-500">Avg Viewers</p>
              </div>
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
                      class="w-32 aspect-video object-cover rounded-lg"
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
