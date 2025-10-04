defmodule StreampaiWeb.DashboardAnalyticsLive do
  @moduledoc """
  Analytics LiveView displaying streaming metrics and performance data.
  """
  use StreampaiWeb.BaseLive

  import StreampaiWeb.AnalyticsComponents

  alias Streampai.Stream.Livestream
  alias StreampaiWeb.CoreComponents, as: Core
  alias StreampaiWeb.Utils.FakeAnalytics
  alias StreampaiWeb.Utils.FormatHelpers

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

    socket
    |> assign(:overall_stats, FakeAnalytics.generate_overall_stats(timeframe))
    |> assign(:stream_list, stream_list)
    |> assign(:viewer_data, FakeAnalytics.generate_time_series_data(:viewers, days))
    |> assign(:income_data, FakeAnalytics.generate_time_series_data(:income, days))
    |> assign(:follower_data, FakeAnalytics.generate_time_series_data(:followers, days))
    |> assign(:engagement_data, FakeAnalytics.generate_time_series_data(:engagement, days))
    |> assign(:platform_breakdown, FakeAnalytics.generate_platform_breakdown())
    |> assign(:top_content, FakeAnalytics.generate_top_content())
    |> assign(:demographics, FakeAnalytics.generate_demographics())
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

  defp format_duration_hours(seconds) when is_integer(seconds) do
    hours = div(seconds, 3600)
    minutes = div(rem(seconds, 3600), 60)

    cond do
      hours > 0 and minutes > 0 -> "#{hours}h #{minutes}m"
      hours > 0 -> "#{hours}h"
      minutes > 0 -> "#{minutes}m"
      true -> "0m"
    end
  end

  defp format_duration_hours(nil), do: "0m"

  defp days_for_timeframe(:day), do: 1
  defp days_for_timeframe(:week), do: 7
  defp days_for_timeframe(:month), do: 30
  defp days_for_timeframe(:year), do: 365
  defp days_for_timeframe(_), do: 7

  defp format_number(number), do: FormatHelpers.format_number(number)

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
              Track your streaming performance and audience engagement
            </p>
          </div>

          <div class="flex gap-2">
            <select
              phx-change="change_timeframe"
              name="timeframe"
              class="rounded-md border-gray-300 text-sm"
            >
              <option value="day" selected={@selected_timeframe == :day}>Last 24 Hours</option>
              <option value="week" selected={@selected_timeframe == :week}>Last 7 Days</option>
              <option value="month" selected={@selected_timeframe == :month}>Last 30 Days</option>
              <option value="year" selected={@selected_timeframe == :year}>Last Year</option>
            </select>
          </div>
        </div>

        <%= if @view_mode == :overview do %>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <.stat_card
              title="Total Viewers"
              value={@overall_stats.total_viewers}
              change={12.5}
              change_type={:positive}
              icon="hero-users"
            />
            <.stat_card
              title="Total Income"
              value={@overall_stats.total_income}
              format={:currency}
              change={-5.2}
              change_type={:negative}
              icon="hero-currency-dollar"
            />
            <.stat_card
              title="Avg Watch Time"
              value={@overall_stats.average_watch_time}
              format={:duration}
              change={8.3}
              change_type={:positive}
              icon="hero-clock"
            />
            <.stat_card
              title="Engagement Rate"
              value={@overall_stats.engagement_rate}
              format={:percentage}
              change={2.1}
              change_type={:positive}
              icon="hero-chat-bubble-left-right"
              tooltip="Engagement rate measures how actively your audience interacts with your content through likes, comments, shares, and chat messages relative to your total viewer count."
            />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <.line_chart title="Viewer Trends" data={@viewer_data} />
            <.line_chart title="Income Trends" data={@income_data} />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <.bar_chart
              title="Platform Distribution"
              data={
                Enum.map(@platform_breakdown, fn p ->
                  %{label: p.platform, value: p.viewers}
                end)
              }
            />
            <.bar_chart
              title="Top Content"
              data={
                Enum.map(Enum.take(@top_content, 5), fn c ->
                  %{label: c.game, value: c.average_viewers}
                end)
              }
            />
            <.pie_chart
              title="Income Sources"
              data={[
                %{label: "Donations", value: @overall_stats.donations},
                %{label: "Subscriptions", value: @overall_stats.subscriptions},
                %{label: "Bits", value: @overall_stats.bits},
                %{label: "Ads", value: @overall_stats.ads_revenue}
              ]}
            />
          </div>

          <.stream_table streams={Enum.take(@stream_list, 5)} />

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Audience Demographics
              </h3>
              <div class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-2">
                    Age Distribution
                  </h4>
                  <div class="space-y-2">
                    <%= for age_group <- @demographics.age_groups do %>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">
                          {age_group.range}
                        </span>
                        <div class="flex items-center gap-2">
                          <.progress_bar
                            value={age_group.percentage}
                            max_value={100.0}
                            width_class="w-32"
                            size={:medium}
                          />
                          <span class="text-sm font-medium text-gray-900 w-10 text-right">
                            {age_group.percentage}%
                          </span>
                        </div>
                      </div>
                    <% end %>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-2">
                    Top Countries
                  </h4>
                  <div class="space-y-2">
                    <%= for country <- Enum.take(@demographics.top_countries, 5) do %>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">
                          {country.country}
                        </span>
                        <span class="text-sm font-medium text-gray-900">
                          {format_number(country.viewers)} viewers
                        </span>
                      </div>
                    <% end %>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Performance Insights
              </h3>
              <div class="space-y-3">
                <div class="p-3 bg-green-50 rounded-lg">
                  <div class="flex items-start">
                    <Core.icon name="hero-arrow-trending-up" class="w-5 h-5 text-green-600 mt-0.5" />
                    <div class="ml-3">
                      <p class="text-sm font-medium text-green-800">
                        Strong viewer retention
                      </p>
                      <p class="text-xs text-green-600 mt-1">
                        Your average watch time increased by 15% this period
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-3 bg-blue-50 rounded-lg">
                  <div class="flex items-start">
                    <Core.icon name="hero-users" class="w-5 h-5 text-blue-600 mt-0.5" />
                    <div class="ml-3">
                      <p class="text-sm font-medium text-blue-800">
                        Growing audience
                      </p>
                      <p class="text-xs text-blue-600 mt-1">
                        {@overall_stats.new_followers} new followers gained
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-3 bg-yellow-50 rounded-lg">
                  <div class="flex items-start">
                    <Core.icon name="hero-clock" class="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div class="ml-3">
                      <p class="text-sm font-medium text-yellow-800">
                        Peak streaming time
                      </p>
                      <p class="text-xs text-yellow-600 mt-1">
                        Best engagement between 7 PM - 11 PM
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-3 bg-purple-50 rounded-lg">
                  <div class="flex items-start">
                    <Core.icon
                      name="hero-chat-bubble-bottom-center-text"
                      class="w-5 h-5 text-purple-600 mt-0.5"
                    />
                    <div class="ml-3">
                      <p class="text-sm font-medium text-purple-800">
                        High chat activity
                      </p>
                      <p class="text-xs text-purple-600 mt-1">
                        {format_number(@overall_stats.chat_messages)} chat messages received
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
