defmodule StreampaiWeb.DashboardStreamHistoryDetailLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Fake.Livestream

  def mount_page(socket, %{"stream_id" => stream_id}, _session) do
    # In a real app, you'd fetch from database
    # For now, regenerate data with the same stream_id for consistency
    stream = generate_stream_data(stream_id)
    events = generate_stream_events(stream_id, stream.started_at, stream.ended_at)
    chat_messages = generate_stream_chat(stream_id, stream.started_at, stream.ended_at)
    insights = generate_stream_insights(stream, events, chat_messages)

    socket =
      socket
      |> assign(:stream, stream)
      |> assign(:events, events)
      |> assign(:chat_messages, chat_messages)
      |> assign(:insights, insights)
      |> assign(:current_timeline_position, 0)
      |> assign(:page_title, "Stream Details")

    {:ok, socket, layout: false}
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

  defp generate_stream_data(stream_id) do
    # Create consistent data for the same stream_id
    :rand.seed(:exrop, {String.to_integer(String.slice(stream_id, 0, 8), 16), 0, 0})

    now = DateTime.utc_now()
    days_ago = :rand.uniform(7) + 1
    started_at = DateTime.add(now, -days_ago * 24 * 60 * 60, :second)

    duration_hours = :rand.uniform(6) + 1
    duration_seconds = duration_hours * 3600 + :rand.uniform(3600)
    ended_at = DateTime.add(started_at, duration_seconds, :second)

    metrics = Livestream.generate_viewer_metrics(started_at, ended_at)

    %{
      id: stream_id,
      title:
        Enum.random([
          "Epic Gaming Marathon",
          "Community Game Night",
          "Speedrun Attempts",
          "Just Chatting Session",
          "New Game First Time"
        ]),
      started_at: started_at,
      ended_at: ended_at,
      duration_seconds: duration_seconds,
      max_viewers: metrics.max_viewers,
      avg_viewers: metrics.avg_viewers,
      platform: Enum.random([:twitch, :youtube, :facebook, :kick]),
      viewer_data: metrics.viewer_data,
      thumbnail_url: "https://picsum.photos/1280/720?random=#{String.slice(stream_id, 0, 4)}"
    }
  end

  defp generate_stream_events(stream_id, started_at, ended_at) do
    :rand.seed(:exrop, {String.to_integer(String.slice(stream_id, 0, 8), 16), 1, 0})

    duration_minutes = ended_at |> DateTime.diff(started_at, :second) |> div(60)
    # One event every ~10 minutes
    event_count = max(5, div(duration_minutes, 10))

    1..event_count
    |> Enum.map(fn i ->
      minutes_offset = round(i / event_count * duration_minutes)
      timestamp = DateTime.add(started_at, minutes_offset * 60, :second)

      event_type = Enum.random([:donation, :follow, :subscription, :raid])

      base_event = %{
        id: Ecto.UUID.generate(),
        timestamp: timestamp,
        timeline_position: round(minutes_offset / duration_minutes * 100),
        type: event_type
      }

      case event_type do
        :donation ->
          Map.merge(base_event, %{
            username: Enum.random(["generous_viewer", "awesome_fan", "supporter123", "stream_lover"]),
            amount: Enum.random([5.0, 10.0, 25.0, 50.0, 100.0]),
            message: Enum.random(["Great stream!", "Keep it up!", "Love your content!", "Amazing work!"])
          })

        :follow ->
          Map.put(
            base_event,
            :username,
            Enum.random(["new_follower", "first_time_here", "loving_it", "found_you"])
          )

        :subscription ->
          Map.merge(base_event, %{
            username: Enum.random(["loyal_fan", "subscriber_1", "community_member", "been_watching"]),
            tier: Enum.random(["1", "2", "3"]),
            months: Enum.random([1, 3, 6, 12])
          })

        :raid ->
          Map.merge(base_event, %{
            from_streamer: Enum.random(["friend_streamer", "collab_partner", "community_friend"]),
            viewer_count: Enum.random([10, 25, 50, 100])
          })
      end
    end)
    |> Enum.sort_by(& &1.timestamp, DateTime)
  end

  defp generate_stream_chat(stream_id, started_at, ended_at) do
    :rand.seed(:exrop, {String.to_integer(String.slice(stream_id, 0, 8), 16), 2, 0})

    duration_minutes = ended_at |> DateTime.diff(started_at, :second) |> div(60)
    # ~2 messages per minute
    message_count = duration_minutes * 2

    1..message_count
    |> Enum.map(fn i ->
      minutes_offset = i / message_count * duration_minutes
      timestamp = DateTime.add(started_at, round(minutes_offset * 60), :second)

      %{
        id: "chat_#{i}",
        username:
          Enum.random([
            "viewer123",
            "chat_user",
            "stream_fan",
            "regular_viewer",
            "newcomer",
            "loyal_fan"
          ]),
        message:
          Enum.random([
            "Hello everyone!",
            "Great stream!",
            "Love this game!",
            "First time here!",
            "You're doing great!",
            "This is awesome!",
            "Keep it up!",
            "Amazing gameplay!",
            "Been watching for hours",
            "Love the community here",
            "Great vibes"
          ]),
        timestamp: timestamp,
        timeline_position: round(minutes_offset / duration_minutes * 100),
        platform: :twitch,
        is_moderator: :rand.uniform(20) == 1,
        is_subscriber: :rand.uniform(5) == 1
      }
    end)
    |> Enum.sort_by(& &1.timestamp, DateTime)
  end

  defp generate_stream_insights(stream, events, chat_messages) do
    # messages per minute
    chat_density = length(chat_messages) / (stream.duration_seconds / 60)

    peak_viewer_data = Enum.max_by(stream.viewer_data, & &1.viewers)
    peak_viewer_time = peak_viewer_data.timestamp

    # Calculate timeline position for peak moment
    peak_timeline_position =
      DateTime.diff(peak_viewer_time, stream.started_at, :second) / stream.duration_seconds * 100

    most_active_period = find_most_active_chat_period(chat_messages, stream.duration_seconds)

    %{
      peak_moment: %{
        time: peak_viewer_time,
        timeline_position: round(peak_timeline_position),
        viewers: stream.max_viewers,
        description: "Highest viewer count reached"
      },
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

  defp find_most_active_chat_period(chat_messages, duration_seconds) do
    # Find 10-minute window with most messages
    # 10 minutes in seconds
    window_size = 10 * 60

    if length(chat_messages) > 0 do
      first_message_time = hd(chat_messages).timestamp

      0..(duration_seconds - window_size)//60
      |> Enum.map(fn offset ->
        window_start = DateTime.add(first_message_time, offset, :second)
        window_end = DateTime.add(window_start, window_size, :second)

        messages_in_window =
          Enum.count(chat_messages, fn msg ->
            DateTime.compare(msg.timestamp, window_start) != :lt and
              DateTime.compare(msg.timestamp, window_end) != :gt
          end)

        %{
          start_time: window_start,
          message_count: messages_in_window,
          timeline_position: round(offset / duration_seconds * 100),
          description: "Most active chat period"
        }
      end)
      |> Enum.max_by(& &1.message_count, fn ->
        %{start_time: nil, message_count: 0, timeline_position: 0}
      end)
    else
      %{start_time: nil, message_count: 0, timeline_position: 0}
    end
  end

  defp calculate_engagement_score(stream, events, chat_messages) do
    base_score = stream.avg_viewers * 10
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
    seconds_elapsed = round(position / 100 * stream.duration_seconds)
    hours = div(seconds_elapsed, 3600)
    minutes = div(rem(seconds_elapsed, 3600), 60)
    seconds = rem(seconds_elapsed, 60)

    if_result =
      if hours > 0 do
        :io_lib.format("~2..0B:~2..0B:~2..0B", [hours, minutes, seconds])
      else
        :io_lib.format("~2..0B:~2..0B", [minutes, seconds])
      end

    to_string(if_result)
  end

  defp format_duration(seconds) do
    hours = div(seconds, 3600)
    minutes = div(rem(seconds, 3600), 60)

    cond do
      hours > 0 -> "#{hours}h #{minutes}m"
      minutes > 0 -> "#{minutes}m"
      true -> "< 1m"
    end
  end

  defp format_relative_time(datetime) do
    now = DateTime.utc_now()
    diff_seconds = DateTime.diff(now, datetime)

    cond do
      diff_seconds < 60 -> "#{diff_seconds}s ago"
      diff_seconds < 3600 -> "#{div(diff_seconds, 60)}m ago"
      diff_seconds < 86_400 -> "#{div(diff_seconds, 3600)}h ago"
      true -> "#{div(diff_seconds, 86_400)}d ago"
    end
  end

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
              <div class="flex items-center space-x-4 text-sm text-gray-600">
                <span class={"inline-flex items-center px-2 py-1 rounded text-xs font-medium #{platform_badge_color(@stream.platform)}"}>
                  {platform_name(@stream.platform)}
                </span>
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
              <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                <svg class="w-full h-full" viewBox="0 0 400 200">
                  <!-- Chart background -->
                  <rect width="400" height="200" fill="#f9fafb" />
                  
    <!-- Grid lines -->
                  <%= for i <- 0..4 do %>
                    <line
                      x1="50"
                      y1={40 + i * 30}
                      x2="370"
                      y2={40 + i * 30}
                      stroke="#e5e7eb"
                      stroke-width="1"
                    />
                  <% end %>
                  <%= for i <- 0..6 do %>
                    <line
                      x1={50 + i * 53}
                      y1="40"
                      x2={50 + i * 53}
                      y2="160"
                      stroke="#e5e7eb"
                      stroke-width="1"
                    />
                  <% end %>
                  
    <!-- Viewer count line -->
                  <polyline
                    points={
                      @stream.viewer_data
                      |> Enum.with_index()
                      |> Enum.map(fn {point, index} ->
                        x = 50 + index / (length(@stream.viewer_data) - 1) * 320
                        y = 160 - point.viewers / @stream.max_viewers * 120
                        "#{x},#{y}"
                      end)
                      |> Enum.join(" ")
                    }
                    fill="none"
                    stroke="#8b5cf6"
                    stroke-width="2"
                  />
                  
    <!-- Y-axis labels -->
                  <%= for i <- 0..4 do %>
                    <text x="45" y={45 + i * 30} text-anchor="end" font-size="12" fill="#6b7280">
                      {@stream.max_viewers - round(@stream.max_viewers * i / 4)}
                    </text>
                  <% end %>
                  
    <!-- X-axis labels -->
                  <%= for i <- 0..6 do %>
                    <text x={50 + i * 53} y="175" text-anchor="middle" font-size="12" fill="#6b7280">
                      {format_timeline_time(@stream, round(i * 100 / 6))}
                    </text>
                  <% end %>
                </svg>
              </div>
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

  defp event_color(:donation), do: "#10b981"
  defp event_color(:follow), do: "#3b82f6"
  defp event_color(:subscription), do: "#8b5cf6"
  defp event_color(:raid), do: "#f59e0b"
  defp event_color(_), do: "#6b7280"
end
