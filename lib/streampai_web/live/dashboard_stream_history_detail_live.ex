defmodule StreampaiWeb.DashboardStreamHistoryDetailLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamEvent
  alias StreampaiWeb.Utils.DateTimeUtils

  require Ash.Query

  def mount_page(socket, %{"stream_id" => stream_id}, _session) do
    case load_stream_data(stream_id) do
      {:ok, stream_data} ->
        socket =
          socket
          |> assign(:stream, stream_data.stream)
          |> assign(:events, stream_data.events)
          |> assign(:chat_messages, stream_data.chat_messages)
          |> assign(:insights, stream_data.insights)
          |> assign(:platforms, stream_data.platforms)
          |> assign(:current_timeline_position, 0)
          |> assign(:page_title, "Stream Details")

        {:ok, socket, layout: false}

      {:error, :not_found} ->
        socket =
          socket
          |> put_flash(:error, "Stream not found")
          |> redirect(to: ~p"/dashboard/stream-history")

        {:ok, socket, layout: false}
    end
  end

  defp load_stream_data(stream_id) do
    livestream =
      Livestream
      |> Ash.Query.filter(id == ^stream_id)
      |> Ash.Query.load([
        :average_viewers,
        :peak_viewers,
        :messages_amount,
        :duration_seconds,
        :platforms,
        metrics: [
          :youtube_viewers,
          :twitch_viewers,
          :facebook_viewers,
          :kick_viewers,
          :created_at
        ]
      ])
      |> Ash.read_one!(authorize?: false)

    case livestream do
      nil ->
        {:error, :not_found}

      livestream ->
        events = load_stream_events(stream_id)
        chat_messages = load_chat_messages(stream_id)
        viewer_data = build_viewer_data(livestream)
        stream = build_stream_data(livestream, viewer_data)
        insights = generate_stream_insights(stream, events, chat_messages)

        {:ok,
         %{
           stream: stream,
           events: events,
           chat_messages: chat_messages,
           insights: insights,
           platforms: livestream.platforms || []
         }}
    end
  end

  defp build_viewer_data(livestream) do
    metrics = Map.get(livestream, :metrics, []) || []

    metrics
    |> Enum.map(&transform_metric(&1, livestream.started_at))
    |> Enum.sort_by(& &1.offset_seconds)
  end

  defp transform_metric(metric, started_at) do
    %{
      offset_seconds: DateTime.diff(metric.created_at, started_at),
      total_viewers: calculate_total_viewers(metric),
      youtube_viewers: metric.youtube_viewers || 0,
      twitch_viewers: metric.twitch_viewers || 0,
      facebook_viewers: metric.facebook_viewers || 0,
      kick_viewers: metric.kick_viewers || 0,
      timestamp: metric.created_at
    }
  end

  defp calculate_total_viewers(metric) do
    (metric.youtube_viewers || 0) +
      (metric.twitch_viewers || 0) +
      (metric.facebook_viewers || 0) +
      (metric.kick_viewers || 0)
  end

  defp build_stream_data(livestream, viewer_data) do
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
      viewer_data: viewer_data
    }
  end

  defp load_stream_events(livestream_id) do
    livestream_id
    |> StreamEvent.get_activity_events_for_livestream!(authorize?: false)
    |> Enum.map(&format_event/1)
  end

  defp format_event(event) do
    %{
      id: event.id,
      timestamp: event.inserted_at,
      timeline_position: 0,
      type: event.type,
      username: event.author_id,
      data: event.data
    }
  end

  defp load_chat_messages(livestream_id) do
    livestream_id
    |> ChatMessage.get_for_livestream!(authorize?: false)
    |> Enum.map(&format_chat_message/1)
  end

  defp format_chat_message(chat_message) do
    %{
      id: chat_message.id,
      username: chat_message.sender_username || chat_message.viewer_id || "Unknown",
      message: chat_message.message || "",
      timestamp: chat_message.inserted_at,
      timeline_position: 0,
      platform: chat_message.platform,
      is_moderator: chat_message.sender_is_moderator || false,
      is_subscriber: false
    }
  end

  def handle_event("seek_timeline", %{"position" => position_str}, socket) do
    position = String.to_integer(position_str)

    # Filter chat messages to show only up to this timeline position
    filtered_chat =
      filter_chat_by_timeline(socket.assigns.chat_messages, socket.assigns.stream, position)

    socket =
      socket
      |> assign(:current_timeline_position, position)
      |> assign(:filtered_chat_messages, filtered_chat)

    {:noreply, socket}
  end

  defp generate_stream_insights(stream, events, chat_messages) do
    # messages per minute
    chat_density =
      if stream.duration_seconds > 0 do
        length(chat_messages) / (stream.duration_seconds / 60)
      else
        0
      end

    most_active_period = find_most_active_chat_period(chat_messages, stream.duration_seconds)
    peak_moment = find_peak_viewer_moment(stream)

    %{
      peak_moment: peak_moment,
      most_active_chat: most_active_period,
      total_events: length(events),
      chat_activity: %{
        total_messages: length(chat_messages),
        messages_per_minute: Float.round(chat_density, 1),
        activity_level:
          case chat_density do
            x when x > 5 -> "Very High"
            x when x > 2 -> "High"
            x when x > 1 -> "Medium"
            _ -> "Low"
          end
      },
      engagement_score: calculate_engagement_score(stream, events, chat_messages)
    }
  end

  defp find_peak_viewer_moment(stream) do
    case stream.viewer_data do
      [] ->
        %{
          time: stream.started_at,
          timeline_position: 0,
          viewers: stream.max_viewers,
          description: "Viewer data not yet available"
        }

      viewer_data ->
        peak_data = Enum.max_by(viewer_data, & &1.total_viewers)

        timeline_position =
          if stream.duration_seconds > 0 do
            round(peak_data.offset_seconds / stream.duration_seconds * 100)
          else
            0
          end

        %{
          time: peak_data.timestamp,
          timeline_position: timeline_position,
          viewers: peak_data.total_viewers,
          description: "Peak viewers reached"
        }
    end
  end

  defp find_most_active_chat_period(chat_messages, duration_seconds) do
    if Enum.empty?(chat_messages) do
      empty_chat_period()
    else
      find_peak_activity_window(chat_messages, duration_seconds)
    end
  end

  defp empty_chat_period do
    %{start_time: nil, message_count: 0, timeline_position: 0}
  end

  defp find_peak_activity_window(chat_messages, duration_seconds) do
    # 10 minutes in seconds
    window_size = 10 * 60
    first_message_time = hd(chat_messages).timestamp

    0..(duration_seconds - window_size)//60
    |> Enum.map(
      &calculate_window_activity(
        &1,
        first_message_time,
        window_size,
        chat_messages,
        duration_seconds
      )
    )
    |> Enum.max_by(& &1.message_count, fn -> empty_chat_period() end)
  end

  defp calculate_window_activity(offset, first_message_time, window_size, chat_messages, duration_seconds) do
    window_start = DateTime.add(first_message_time, offset, :second)
    window_end = DateTime.add(window_start, window_size, :second)

    messages_in_window = count_messages_in_window(chat_messages, window_start, window_end)

    %{
      start_time: window_start,
      message_count: messages_in_window,
      timeline_position: round(offset / duration_seconds * 100),
      description: "Most active chat period"
    }
  end

  defp count_messages_in_window(messages, window_start, window_end) do
    Enum.count(messages, fn msg ->
      DateTime.compare(msg.timestamp, window_start) != :lt and
        DateTime.compare(msg.timestamp, window_end) != :gt
    end)
  end

  defp calculate_engagement_score(stream, events, chat_messages) do
    base_score =
      case stream.avg_viewers do
        avg when is_number(avg) -> avg * 10
        _ -> 0
      end

    event_bonus = length(events) * 50
    chat_bonus = length(chat_messages) * 2

    total = base_score + event_bonus + chat_bonus
    min(100, round(total / 100))
  end

  defp filter_chat_by_timeline(chat_messages, stream, timeline_position) do
    # Convert timeline position (0-100) to actual timestamp
    progress = timeline_position / 100

    target_time =
      DateTime.add(stream.started_at, round(stream.duration_seconds * progress), :second)

    chat_messages
    |> Enum.filter(fn msg ->
      DateTime.compare(msg.timestamp, target_time) != :gt
    end)
    # Show last 50 messages up to this point
    |> Enum.take(-50)
  end

  defp format_timeline_time(stream, position) do
    DateTimeUtils.format_timeline_position(stream, position)
  end

  defp format_duration(seconds), do: DateTimeUtils.format_duration(seconds)

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="stream-history" page_title="Stream Details">
      <div class="max-w-7xl mx-auto">
        <!-- Stream Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-start space-x-4">
            <img
              src={@stream.thumbnail_url}
              alt="Stream thumbnail"
              class="w-32 h-18 object-cover rounded-lg"
            />
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">{@stream.title}</h1>
              <div class="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
                <%= for platform <- @platforms do %>
                  <span class={"inline-flex items-center px-2 py-1 rounded text-xs font-medium #{platform_badge_color(platform)}"}>
                    {platform_name(platform)}
                  </span>
                <% end %>
                <span>{Calendar.strftime(@stream.started_at, "%B %d, %Y at %I:%M %p")}</span>
                <span>Duration: {format_duration(@stream.duration_seconds)}</span>
                <span>Peak: {@stream.max_viewers} viewers</span>
              </div>
            </div>
            <.link
              navigate={~p"/dashboard/stream-history"}
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to History
            </.link>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Viewer Chart -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Viewer Count Over Time</h3>
              <%= if Enum.empty?(@stream.viewer_data) do %>
                <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                  <div class="text-center text-gray-400">
                    <svg
                      class="mx-auto h-16 w-16 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      >
                      </path>
                    </svg>
                    <p class="text-lg font-medium">Viewer Data Not Yet Available</p>
                    <p class="text-sm">Viewer tracking will be available soon</p>
                  </div>
                </div>
              <% else %>
                <div class="h-64 relative">
                  <svg class="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                    <!-- Grid lines -->
                    <g class="grid-lines" stroke="#e5e7eb" stroke-width="1">
                      <%= for i <- 0..4 do %>
                        <line x1="40" y1={50 * i} x2="800" y2={50 * i} />
                      <% end %>
                    </g>
                    <!-- Data line -->
                    <polyline
                      fill="none"
                      stroke="#8b5cf6"
                      stroke-width="2"
                      points={
                        viewer_chart_points(
                          @stream.viewer_data,
                          @stream.duration_seconds,
                          @stream.max_viewers
                        )
                      }
                    />
                    <!-- Y-axis labels -->
                    <g class="y-axis-labels" font-size="12" fill="#6b7280">
                      <%= for i <- 0..4 do %>
                        <text x="5" y={250 - 50 * i} text-anchor="start">
                          {round(@stream.max_viewers * i / 4)}
                        </text>
                      <% end %>
                    </g>
                  </svg>
                  <!-- X-axis time labels -->
                  <div class="flex justify-between text-xs text-gray-500 mt-2 px-10">
                    <span>0:00</span>
                    <span>{format_duration(div(@stream.duration_seconds, 2))}</span>
                    <span>{format_duration(@stream.duration_seconds)}</span>
                  </div>
                </div>
              <% end %>
            </div>
            
    <!-- Stream Playback Placeholder -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Stream Playback</h3>
              <div class="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div class="text-center text-gray-400">
                  <svg
                    class="mx-auto h-16 w-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M6 6v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2z"
                    >
                    </path>
                  </svg>
                  <p class="text-lg font-medium">Stream Playback</p>
                  <p class="text-sm">Video playback will be available here</p>
                </div>
              </div>
            </div>
            
    <!-- Timeline with Events -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Stream Timeline</h3>
              <div class="relative">
                <!-- Timeline bar -->
                <div class="h-3 bg-gray-200 rounded-full relative mb-6">
                  <div
                    class="absolute h-full bg-purple-600 rounded-full"
                    style={"width: #{@current_timeline_position}%"}
                  >
                  </div>
                  
    <!-- Event markers -->
                  <%= for event <- @events do %>
                    <div
                      class="absolute w-3 h-3 -mt-0 rounded-full cursor-pointer transform hover:scale-125 transition-transform"
                      style={"left: #{event.timeline_position}%; background-color: #{event_color(event.type)}"}
                      title={"#{event.type} at #{format_timeline_time(@stream, event.timeline_position)}"}
                      phx-click="seek_timeline"
                      phx-value-position={event.timeline_position}
                    >
                    </div>
                  <% end %>
                </div>
                
    <!-- Timeline controls -->
                <div class="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={@current_timeline_position}
                    class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    phx-change="seek_timeline"
                    name="position"
                  />
                  <span class="text-sm font-medium text-gray-600 min-w-[60px]">
                    {format_timeline_time(@stream, @current_timeline_position)}
                  </span>
                </div>
                
    <!-- Event legend -->
                <div class="flex items-center space-x-4 mt-4 text-xs">
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    Donations
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    Follows
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
                    Subscriptions
                  </div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                    Raids
                  </div>
                </div>
              </div>
            </div>
          </div>
          
    <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Stream Insights -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Stream Insights</h3>

              <div class="space-y-4">
                <div class="bg-purple-50 rounded-lg p-4">
                  <h4 class="font-medium text-purple-900 mb-2">Peak Moment</h4>
                  <p class="text-sm text-purple-700">
                    {@insights.peak_moment.description} at
                    <button
                      type="button"
                      phx-click="seek_timeline"
                      phx-value-position={@insights.peak_moment.timeline_position}
                      class="font-medium text-purple-800 hover:text-purple-900 underline"
                    >
                      {format_timeline_time(@stream, @insights.peak_moment.timeline_position)}
                    </button>
                  </p>
                  <p class="text-xs text-purple-600 mt-1">
                    {@insights.peak_moment.viewers} concurrent viewers
                  </p>
                </div>

                <div class="bg-blue-50 rounded-lg p-4">
                  <h4 class="font-medium text-blue-900 mb-2">Chat Activity</h4>
                  <p class="text-sm text-blue-700">
                    {@insights.chat_activity.activity_level} activity level
                  </p>
                  <p class="text-xs text-blue-600 mt-1">
                    {@insights.chat_activity.messages_per_minute} messages/min average
                  </p>
                  <%= if @insights.most_active_chat.message_count > 0 do %>
                    <p class="text-xs text-blue-600 mt-2">
                      Most active period at
                      <button
                        type="button"
                        phx-click="seek_timeline"
                        phx-value-position={@insights.most_active_chat.timeline_position}
                        class="font-medium text-blue-800 hover:text-blue-900 underline"
                      >
                        {format_timeline_time(@stream, @insights.most_active_chat.timeline_position)}
                      </button>
                    </p>
                  <% end %>
                </div>

                <div class="bg-green-50 rounded-lg p-4">
                  <h4 class="font-medium text-green-900 mb-2">Engagement Score</h4>
                  <div class="flex items-center">
                    <div class="flex-1 bg-green-200 rounded-full h-2">
                      <div
                        class="bg-green-600 h-2 rounded-full"
                        style={"width: #{@insights.engagement_score}%"}
                      >
                      </div>
                    </div>
                    <span class="ml-2 text-sm font-medium text-green-900">
                      {@insights.engagement_score}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
    <!-- Stream Chat -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Chat Replay</h3>
                <p class="text-xs text-gray-500 mt-1">
                  Showing messages up to {format_timeline_time(@stream, @current_timeline_position)}
                </p>
              </div>

              <div class="h-96 overflow-y-auto">
                <div class="divide-y divide-gray-100">
                  <%= for message <- (assigns[:filtered_chat_messages] || Enum.take(@chat_messages, 50)) do %>
                    <div class="p-3">
                      <div class="flex items-start space-x-2">
                        <div class="flex-shrink-0">
                          <div class={"w-6 h-6 rounded-full flex items-center justify-center #{if message.is_subscriber, do: "bg-purple-100", else: "bg-gray-100"}"}>
                            <span class={"text-xs font-medium #{if message.is_subscriber, do: "text-purple-600", else: "text-gray-600"}"}>
                              {String.first(message.username)}
                            </span>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center space-x-1">
                            <span class={"text-xs font-medium #{if message.is_moderator, do: "text-green-600", else: "text-gray-900"}"}>
                              {message.username}
                            </span>
                            <%= if message.is_moderator do %>
                              <span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                MOD
                              </span>
                            <% end %>
                            <%= if message.is_subscriber do %>
                              <span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                SUB
                              </span>
                            <% end %>
                          </div>
                          <p class="text-xs text-gray-600 mt-0.5">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  <% end %>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end

  defp viewer_chart_points(viewer_data, duration_seconds, max_viewers) do
    return =
      if Enum.empty?(viewer_data) or duration_seconds == 0 or max_viewers == 0 do
        ""
      else
        chart_width = 760
        chart_height = 250
        x_offset = 40

        Enum.map_join(viewer_data, " ", fn data_point ->
          x = x_offset + data_point.offset_seconds / duration_seconds * chart_width
          y = chart_height - data_point.total_viewers / max_viewers * chart_height
          "#{x},#{y}"
        end)
      end

    return
  end

  defp event_color(:donation), do: "#10b981"
  defp event_color(:follow), do: "#3b82f6"
  defp event_color(:subscription), do: "#8b5cf6"
  defp event_color(:raid), do: "#f59e0b"
  defp event_color(_), do: "#6b7280"
end
