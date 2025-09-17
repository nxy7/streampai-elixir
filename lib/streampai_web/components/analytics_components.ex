defmodule StreampaiWeb.AnalyticsComponents do
  @moduledoc false
  use Phoenix.Component

  import StreampaiWeb.CoreComponents, except: [icon: 1]

  alias StreampaiWeb.CoreComponents, as: Core

  attr :title, :string, required: true
  attr :value, :any, required: true
  attr :change, :float, default: nil
  attr :change_type, :atom, default: :neutral
  attr :icon, :string, default: nil
  attr :format, :atom, default: :number

  def stat_card(assigns) do
    ~H"""
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {@title}
          </p>
          <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {format_value(@value, @format)}
          </p>
          <%= if @change do %>
            <div class="mt-2 flex items-center text-sm">
              <span class={[
                "font-medium",
                @change_type == :positive && "text-green-600",
                @change_type == :negative && "text-red-600",
                @change_type == :neutral && "text-gray-500"
              ]}>
                <%= if @change > 0 do %>
                  <Core.icon name="hero-arrow-up-mini" class="w-4 h-4 inline" />
                <% else %>
                  <Core.icon name="hero-arrow-down-mini" class="w-4 h-4 inline" />
                <% end %>
                {abs(@change)}%
              </span>
              <span class="ml-2 text-gray-500">from last period</span>
            </div>
          <% end %>
        </div>
        <%= if @icon do %>
          <div class="ml-4">
            <Core.icon name={@icon} class="w-8 h-8 text-gray-400" />
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  attr :data, :list, required: true
  attr :title, :string, required: true
  attr :height, :string, default: "h-64"

  def line_chart(assigns) do
    ~H"""
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {@title}
      </h3>
      <div class={[@height, "relative"]}>
        <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:rgb(99, 102, 241);stop-opacity:0" />
            </linearGradient>
          </defs>

          <% max_value = @data |> Enum.map(& &1.value) |> Enum.max(fn -> 100 end) %>
          <% points =
            @data
            |> Enum.with_index()
            |> Enum.map(fn {item, i} ->
              x = i / (length(@data) - 1) * 800
              y = 300 - item.value / max_value * 280
              "#{x},#{y}"
            end)
            |> Enum.join(" ") %>

          <polyline
            fill="url(#gradient)"
            stroke="none"
            points={"0,300 #{points} 800,300"}
          />

          <polyline
            fill="none"
            stroke="rgb(99, 102, 241)"
            stroke-width="2"
            points={points}
          />

          <%= for {{item, i}, x} <- Enum.with_index(@data) |> Enum.map(fn {item, i} ->
            {item, i, (i / (length(@data) - 1)) * 800}
          end) do %>
            <% y = 300 - item.value / max_value * 280 %>
            <circle cx={x} cy={y} r="4" fill="rgb(99, 102, 241)" />
          <% end %>
        </svg>

        <div class="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          <%= for i <- [0, div(length(@data) - 1, 4), div(length(@data) - 1, 2), div(3 * (length(@data) - 1), 4), length(@data) - 1] do %>
            <span>{format_chart_date(Enum.at(@data, i).time)}</span>
          <% end %>
        </div>
      </div>
    </div>
    """
  end

  attr :data, :list, required: true
  attr :title, :string, required: true

  def bar_chart(assigns) do
    ~H"""
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {@title}
      </h3>
      <div class="space-y-3">
        <% max_value = @data |> Enum.map(& &1.value) |> Enum.max(fn -> 100 end) %>
        <%= for item <- @data do %>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {format_value(item.value, item[:format] || :number)}
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={"width: #{item.value / max_value * 100}%"}
              />
            </div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  attr :data, :list, required: true
  attr :title, :string, required: true

  def pie_chart(assigns) do
    ~H"""
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {@title}
      </h3>
      <div class="relative h-64">
        <svg class="w-full h-full" viewBox="0 0 200 200">
          <% total = @data |> Enum.map(& &1.value) |> Enum.sum() %>
          <% colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"] %>
          <% {_, segments} =
            @data
            |> Enum.with_index()
            |> Enum.reduce({0, []}, fn {item, i}, {start_angle, acc} ->
              percentage = item.value / total
              end_angle = start_angle + percentage * 360
              color = Enum.at(colors, rem(i, length(colors)))

              segment = %{
                item: item,
                start_angle: start_angle,
                end_angle: end_angle,
                color: color,
                percentage: percentage * 100
              }

              {end_angle, acc ++ [segment]}
            end) %>

          <%= for segment <- segments do %>
            <% large_arc = if segment.end_angle - segment.start_angle > 180, do: 1, else: 0 %>
            <% start_x = 100 + 80 * :math.cos(segment.start_angle * :math.pi() / 180) %>
            <% start_y = 100 + 80 * :math.sin(segment.start_angle * :math.pi() / 180) %>
            <% end_x = 100 + 80 * :math.cos(segment.end_angle * :math.pi() / 180) %>
            <% end_y = 100 + 80 * :math.sin(segment.end_angle * :math.pi() / 180) %>

            <path
              d={"M 100 100 L #{start_x} #{start_y} A 80 80 0 #{large_arc} 1 #{end_x} #{end_y} Z"}
              fill={segment.color}
              stroke="white"
              stroke-width="2"
            />
          <% end %>
        </svg>

        <div class="mt-4 space-y-2">
          <%= for {segment, i} <- Enum.with_index(segments) do %>
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center">
                <span class="w-3 h-3 rounded-full mr-2" style={"background-color: #{segment.color}"} />
                <span class="text-gray-600 dark:text-gray-400">{segment.item.label}</span>
              </div>
              <span class="font-medium text-gray-900 dark:text-white">
                {Float.round(segment.percentage, 1)}%
              </span>
            </div>
          <% end %>
        </div>
      </div>
    </div>
    """
  end

  attr :streams, :list, required: true

  def stream_table(assigns) do
    ~H"""
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Recent Streams</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stream
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Platform
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Peak Viewers
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Income
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Engagement
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <%= for stream <- @streams do %>
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {stream.title}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {Calendar.strftime(stream.start_time, "%b %d, %Y at %I:%M %p")}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={[
                    "px-2 py-1 text-xs rounded-full",
                    stream.platform == "Twitch" && "bg-purple-100 text-purple-800",
                    stream.platform == "YouTube" && "bg-red-100 text-red-800",
                    stream.platform == "Facebook" && "bg-blue-100 text-blue-800",
                    stream.platform == "Kick" && "bg-green-100 text-green-800"
                  ]}>
                    {stream.platform}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {stream.duration}h
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {format_number(stream.viewers.peak)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  ${Float.round(stream.income.total, 2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm">
                    <span class={[
                      "font-medium",
                      stream.engagement.engagement_rate > 3.0 && "text-green-600",
                      stream.engagement.engagement_rate <= 3.0 &&
                        stream.engagement.engagement_rate > 2.0 && "text-yellow-600",
                      stream.engagement.engagement_rate <= 2.0 && "text-red-600"
                    ]}>
                      {Float.round(stream.engagement.engagement_rate, 1)}%
                    </span>
                  </div>
                </td>
              </tr>
            <% end %>
          </tbody>
        </table>
      </div>
    </div>
    """
  end

  defp format_value(value, format) do
    case format do
      :currency ->
        "$#{format_number(Float.round(value, 2))}"

      :percentage ->
        "#{Float.round(value, 1)}%"

      :duration ->
        "#{value} min"

      _ ->
        if is_float(value) do
          format_number(Float.round(value, 0))
        else
          format_number(value)
        end
    end
  end

  defp format_number(number) when is_integer(number) do
    number
    |> Integer.to_string()
    |> String.graphemes()
    |> Enum.reverse()
    |> Enum.chunk_every(3)
    |> Enum.join(",")
    |> String.reverse()
  end

  defp format_number(number) when is_float(number) do
    format_number(round(number))
  end

  defp format_number(number), do: to_string(number)

  defp format_chart_date(datetime) do
    Calendar.strftime(datetime, "%b %d")
  end
end
