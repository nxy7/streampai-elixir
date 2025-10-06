defmodule StreampaiWeb.DashboardAnalyticsLive do
  @moduledoc """
  Analytics LiveView displaying streaming metrics and performance data.
  """
  use StreampaiWeb.BaseLive

  import StreampaiWeb.AnalyticsComponents

  alias Streampai.Stream.Livestream
  alias Streampai.Stream.LivestreamMetric
  alias StreampaiWeb.CoreComponents, as: Core

  require Ash.Query

  @update_interval 5_000

  def mount_page(socket, _params, _session) do
    if connected?(socket) do
      :timer.send_interval(@update_interval, self(), :update_data)
    end

    socket =
      socket
      |> assign(:page_title, "Analytics")
      |> assign(:selected_timeframe, :week)
      |> assign(:selected_stream, nil)
      |> assign(:view_mode, :overview)
      |> load_analytics_data(:week)

    {:ok, socket, layout: false}
  end

  def handle_info(:update_data, socket) do
    socket = load_analytics_data(socket, socket.assigns.selected_timeframe)
    {:noreply, socket}
  end

  def handle_info(%Phoenix.Socket.Broadcast{}, socket) do
    {:noreply, socket}
  end

  def handle_event("change_timeframe", %{"timeframe" => timeframe}, socket) do
    timeframe_atom =
      case timeframe do
        "day" -> :day
        "week" -> :week
        "month" -> :month
        "year" -> :year
        _ -> :week
      end

    socket =
      socket
      |> assign(:selected_timeframe, timeframe_atom)
      |> load_analytics_data(timeframe_atom)

    {:noreply, socket}
  end

  def handle_event("select_stream", %{"stream_id" => stream_id}, socket) do
    case Enum.find(socket.assigns.stream_list, &(&1.id == stream_id)) do
      nil ->
        socket = put_flash(socket, :error, "Stream not found")
        {:noreply, socket}

      stream ->
        socket =
          socket
          |> assign(:selected_stream, stream)
          |> assign(:view_mode, :stream_detail)

        {:noreply, socket}
    end
  end

  def handle_event("back_to_overview", _, socket) do
    socket =
      socket
      |> assign(:selected_stream, nil)
      |> assign(:view_mode, :overview)

    {:noreply, socket}
  end

  defp load_analytics_data(socket, timeframe) do
    days = days_for_timeframe(timeframe)
    user_id = socket.assigns.current_user.id

    stream_list = load_recent_streams(user_id, days)
    avg_viewers = calculate_average_viewers(stream_list)

    overall_stats = %{avg_viewers: avg_viewers}

    viewer_data = load_viewer_trends(user_id, days)
    platform_breakdown = load_platform_distribution(user_id, days)

    socket
    |> assign(:overall_stats, overall_stats)
    |> assign(:stream_list, stream_list)
    |> assign(:viewer_data, viewer_data)
    |> assign(:platform_breakdown, platform_breakdown)
  end

  defp load_recent_streams(user_id, days) do
    cutoff = DateTime.add(DateTime.utc_now(), -days * 24 * 60 * 60, :second)

    Livestream
    |> Ash.Query.for_read(:get_completed_by_user, %{user_id: user_id})
    |> Ash.Query.filter(started_at >= ^cutoff)
    |> Ash.Query.load([
      :average_viewers,
      :peak_viewers,
      :messages_amount,
      :duration_seconds,
      :platforms
    ])
    |> Ash.Query.sort(started_at: :desc)
    |> Ash.Query.limit(5)
    |> Ash.read!(authorize?: false)
    |> Enum.map(&format_stream_for_analytics/1)
  end

  defp format_stream_for_analytics(livestream) do
    %{
      id: livestream.id,
      title: livestream.title,
      platform: format_platforms(livestream.platforms),
      start_time: livestream.started_at,
      duration: format_duration_hours(livestream.duration_seconds),
      game: "N/A",
      viewers: %{
        peak: livestream.peak_viewers || 0,
        average: livestream.average_viewers || 0
      },
      income: %{
        total: 0.0,
        donations: 0.0,
        subscriptions: 0.0,
        bits: 0.0
      },
      engagement: %{
        chat_messages: livestream.messages_amount || 0,
        follows: 0,
        subscribers: 0,
        engagement_rate: 0.0
      }
    }
  end

  defp format_platforms([]), do: "N/A"
  defp format_platforms([platform]), do: platform |> to_string() |> String.capitalize()

  defp format_platforms(platforms) do
    Enum.map_join(platforms, ", ", &(&1 |> to_string() |> String.capitalize()))
  end

  defp format_duration_hours(seconds) do
    StreampaiWeb.Utils.DateTimeUtils.format_duration(seconds)
  end

  defp days_for_timeframe(:day), do: 1
  defp days_for_timeframe(:week), do: 7
  defp days_for_timeframe(:month), do: 30
  defp days_for_timeframe(:year), do: 365
  defp days_for_timeframe(_), do: 7

  defp calculate_average_viewers([]), do: 0

  defp calculate_average_viewers(streams) do
    total = Enum.sum(Enum.map(streams, & &1.viewers.average))
    round(total / length(streams))
  end

  defp load_viewer_trends(user_id, days) do
    cutoff = DateTime.add(DateTime.utc_now(), -days * 24 * 60 * 60, :second)

    stream_ids =
      Livestream
      |> Ash.Query.for_read(:get_completed_by_user, %{user_id: user_id})
      |> Ash.Query.filter(started_at >= ^cutoff)
      |> Ash.read!(authorize?: false)
      |> Enum.map(& &1.id)

    case stream_ids do
      [] ->
        generate_empty_viewer_data(days)

      ids ->
        LivestreamMetric
        |> Ash.Query.for_read(:read)
        |> Ash.Query.filter(livestream_id in ^ids and created_at >= ^cutoff)
        |> Ash.Query.sort(created_at: :asc)
        |> Ash.read!(authorize?: false)
        |> group_metrics_by_hour()
        |> fill_missing_hours(cutoff, days)
    end
  end

  defp group_metrics_by_hour(metrics) do
    metrics
    |> Enum.group_by(fn metric ->
      # Truncate to hour by zeroing out minutes, seconds, and microseconds
      %{metric.created_at | minute: 0, second: 0, microsecond: {0, 0}}
    end)
    |> Enum.map(fn {hour, hour_metrics} ->
      total_viewers =
        hour_metrics
        |> Enum.map(&LivestreamMetric.total_viewers/1)
        |> Enum.sum()
        |> div(length(hour_metrics))

      %{time: hour, value: total_viewers}
    end)
    |> Enum.sort_by(& &1.time, DateTime)
  end

  defp fill_missing_hours(data_points, _start_time, days) do
    now = DateTime.utc_now()
    current_hour = %{now | minute: 0, second: 0, microsecond: {0, 0}}
    data_by_hour = Map.new(data_points, &{&1.time, &1.value})

    0..(days * 24 - 1)
    |> Enum.map(fn hours_ago ->
      hour = DateTime.add(current_hour, -hours_ago * 3600, :second)
      value = Map.get(data_by_hour, hour, 0)
      %{time: hour, value: value}
    end)
    |> Enum.reverse()
  end

  defp generate_empty_viewer_data(days) do
    now = DateTime.utc_now()
    current_hour = %{now | minute: 0, second: 0, microsecond: {0, 0}}

    0..(days * 24 - 1)
    |> Enum.map(fn hours_ago ->
      hour = DateTime.add(current_hour, -hours_ago * 3600, :second)
      %{time: hour, value: 0}
    end)
    |> Enum.reverse()
  end

  defp load_platform_distribution(user_id, days) do
    cutoff = DateTime.add(DateTime.utc_now(), -days * 24 * 60 * 60, :second)

    stream_ids =
      Livestream
      |> Ash.Query.for_read(:get_completed_by_user, %{user_id: user_id})
      |> Ash.Query.filter(started_at >= ^cutoff)
      |> Ash.read!(authorize?: false)
      |> Enum.map(& &1.id)

    case stream_ids do
      [] ->
        [
          %{label: "Twitch", value: 0, format: :percentage},
          %{label: "YouTube", value: 0, format: :percentage},
          %{label: "Facebook", value: 0, format: :percentage},
          %{label: "Kick", value: 0, format: :percentage}
        ]

      ids ->
        metrics =
          LivestreamMetric
          |> Ash.Query.for_read(:read)
          |> Ash.Query.filter(livestream_id in ^ids and created_at >= ^cutoff)
          |> Ash.read!(authorize?: false)

        twitch_total = metrics |> Enum.map(& &1.twitch_viewers) |> Enum.sum()
        youtube_total = metrics |> Enum.map(& &1.youtube_viewers) |> Enum.sum()
        facebook_total = metrics |> Enum.map(& &1.facebook_viewers) |> Enum.sum()
        kick_total = metrics |> Enum.map(& &1.kick_viewers) |> Enum.sum()

        grand_total = twitch_total + youtube_total + facebook_total + kick_total

        case grand_total do
          0 ->
            [
              %{label: "Twitch", value: 0, format: :percentage},
              %{label: "YouTube", value: 0, format: :percentage},
              %{label: "Facebook", value: 0, format: :percentage},
              %{label: "Kick", value: 0, format: :percentage}
            ]

          total ->
            Enum.sort_by(
              [
                %{label: "Twitch", value: twitch_total / total * 100, format: :percentage},
                %{label: "YouTube", value: youtube_total / total * 100, format: :percentage},
                %{label: "Facebook", value: facebook_total / total * 100, format: :percentage},
                %{label: "Kick", value: kick_total / total * 100, format: :percentage}
              ],
              & &1.value,
              :desc
            )
        end
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="analytics" page_title="Analytics">
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Stream Analytics
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Track your streaming performance and audience metrics
            </p>
          </div>

          <form phx-change="change_timeframe" class="flex gap-2">
            <select
              name="timeframe"
              class="rounded-md border-gray-300 text-sm"
            >
              <option value="day" selected={@selected_timeframe == :day}>Last 24 Hours</option>
              <option value="week" selected={@selected_timeframe == :week}>Last 7 Days</option>
              <option value="month" selected={@selected_timeframe == :month}>Last 30 Days</option>
              <option value="year" selected={@selected_timeframe == :year}>Last Year</option>
            </select>
          </form>
        </div>

        <%= if @view_mode == :overview do %>
          <div class="grid grid-cols-1 gap-6">
            <.line_chart title="Viewer Trends" data={@viewer_data} />
          </div>

          <div class="grid grid-cols-1 gap-6">
            <.bar_chart title="Platform Distribution" data={@platform_breakdown} />
          </div>

          <.stream_table streams={Enum.take(@stream_list, 5)} />
        <% else %>
          <div class="mb-4">
            <button
              phx-click="back_to_overview"
              class="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              <Core.icon name="hero-arrow-left-mini" class="w-4 h-4 mr-1" /> Back to Overview
            </button>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              {@selected_stream.title}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p class="text-sm text-gray-500">Platform</p>
                <p class="text-lg font-medium text-gray-900">
                  {@selected_stream.platform}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Duration</p>
                <p class="text-lg font-medium text-gray-900">
                  {@selected_stream.duration} hours
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Game</p>
                <p class="text-lg font-medium text-gray-900">
                  {@selected_stream.game}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <.stat_card
                title="Peak Viewers"
                value={@selected_stream.viewers.peak}
                icon="hero-users"
              />
              <.stat_card
                title="Average Viewers"
                value={@selected_stream.viewers.average}
                icon="hero-user-group"
              />
              <.stat_card
                title="Total Income"
                value={@selected_stream.income.total}
                format={:currency}
                icon="hero-currency-dollar"
              />
              <.stat_card
                title="Chat Messages"
                value={@selected_stream.engagement.chat_messages}
                icon="hero-chat-bubble-left-right"
              />
            </div>
          </div>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
