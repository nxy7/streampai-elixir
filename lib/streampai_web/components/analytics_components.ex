defmodule StreampaiWeb.AnalyticsComponents do
  @moduledoc """
  Analytics visualization components for streaming metrics.

  Provides reusable chart components including line charts, bar charts,
  pie charts, stat cards, and stream tables for displaying analytics data
  in a consistent visual style.
  """
  use Phoenix.Component

  alias StreampaiWeb.CoreComponents, as: Core
  alias StreampaiWeb.Utils.FormatHelpers

  attr :title, :string, required: true
  attr :value, :any, required: true
  attr :change, :float, default: nil
  attr :change_type, :atom, default: :neutral
  attr :icon, :string, default: nil
  attr :format, :atom, default: :number
  attr :tooltip, :string, default: nil

  def stat_card(assigns) do
    ~H"""
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-600">
              {@title}
            </p>
            <%= if @tooltip do %>
              <.tooltip text={@tooltip} />
            <% end %>
          </div>
          <p class="mt-2 text-3xl font-semibold text-gray-900">
            {FormatHelpers.format_value(@value, @format)}
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
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {@title}
      </h3>
      <div class={[@height, "relative", "pl-12"]}>
        <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:rgb(99, 102, 241);stop-opacity:0" />
            </linearGradient>
          </defs>

          <% raw_max = @data |> Enum.map(& &1.value) |> Enum.max(fn -> 100 end) %>
          <% max_value = round_chart_max(raw_max) %>
          
    <!-- Horizontal grid lines -->
          <%= for i <- 0..4 do %>
            <% y = i * 60 + 10 %>
            <line
              x1="0"
              y1={y}
              x2="800"
              y2={y}
              stroke="#e5e7eb"
              stroke-width="1"
            />
          <% end %>

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
        
    <!-- Y-axis labels -->
        <div class="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500">
          <%= for i <- 4..0//-1 do %>
            <span class="text-right pr-2">{trunc(max_value * i / 4)}</span>
          <% end %>
        </div>
        
    <!-- X-axis labels -->
        <div class="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500">
          <%= for i <- [0, div(length(@data) - 1, 4), div(length(@data) - 1, 2), div(3 * (length(@data) - 1), 4), length(@data) - 1] do %>
            <span>{FormatHelpers.format_chart_date(Enum.at(@data, i).time)}</span>
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
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {@title}
      </h3>
      <div class="space-y-3">
        <% max_value = @data |> Enum.map(& &1.value) |> Enum.max(fn -> 100 end) %>
        <%= for item <- @data do %>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600">{item.label}</span>
              <span class="font-medium text-gray-900">
                {FormatHelpers.format_value(item.value, item[:format] || :number)}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <% width_pct = if max_value > 0, do: item.value / max_value * 100, else: 0 %>
              <div
                class="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={"width: #{width_pct}%"}
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
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {@title}
      </h3>
      <div class="relative">
        <div class="h-48">
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
        </div>

        <div class="mt-4 space-y-1">
          <%= for {segment, i} <- Enum.with_index(segments) do %>
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center min-w-0">
                <span
                  class="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                  style={"background-color: #{segment.color}"}
                />
                <span class="text-gray-600 truncate">{segment.item.label}</span>
              </div>
              <span class="font-medium text-gray-900 ml-2 whitespace-nowrap">
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
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <h3 class="text-lg font-medium text-gray-900">Recent Streams</h3>
      </div>
      <div class="relative rounded-b-lg">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Stream
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Platform
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Duration
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Peak Viewers
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Avg Viewers
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Income
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <%= for stream <- @streams do %>
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <.link
                      navigate={get_stream_history_url(stream)}
                      class="block"
                    >
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {stream.title}
                        </div>
                        <div class="text-xs text-gray-500">
                          {Calendar.strftime(stream.start_time, "%b %d, %Y at %I:%M %p")}
                        </div>
                      </div>
                    </.link>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <.link
                      navigate={get_stream_history_url(stream)}
                      class="block"
                    >
                      <span class={"px-2 py-1 text-xs rounded-full #{platform_badge_class(stream.platform)}"}>
                        {stream.platform}
                      </span>
                    </.link>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <.link
                      navigate={get_stream_history_url(stream)}
                      class="block"
                    >
                      {stream.duration}
                    </.link>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <.link
                      navigate={get_stream_history_url(stream)}
                      class="block"
                    >
                      {FormatHelpers.format_number(stream.viewers.peak)}
                    </.link>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <.link
                      navigate={get_stream_history_url(stream)}
                      class="block"
                    >
                      {FormatHelpers.format_number(stream.viewers.average)}
                    </.link>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <.link
                      navigate={get_stream_history_url(stream)}
                      class="block"
                    >
                      ${Float.round(stream.income.total, 2)}
                    </.link>
                  </td>
                </tr>
              <% end %>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    """
  end

  # Helper functions for platform-specific styling
  defp platform_badge_class("Twitch"), do: "bg-purple-100 text-purple-800"
  defp platform_badge_class("YouTube"), do: "bg-red-100 text-red-800"
  defp platform_badge_class("Facebook"), do: "bg-blue-100 text-blue-800"
  defp platform_badge_class("Kick"), do: "bg-green-100 text-green-800"
  defp platform_badge_class(_), do: "bg-gray-100 text-gray-800"

  # Helper function to generate stream history URL
  defp get_stream_history_url(stream) do
    "/dashboard/stream-history/#{stream.id}"
  end

  attr :text, :string, required: true
  attr :position, :string, default: "top"

  def tooltip(assigns) do
    assigns = assign(assigns, :tooltip_id, "tooltip-#{System.unique_integer([:positive])}")

    ~H"""
    <div class="relative inline-block" phx-hook="TableTooltip" id={@tooltip_id}>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-describedby={@tooltip_id <> "-content"}
      >
        <Core.icon name="hero-question-mark-circle" class="w-4 h-4" />
      </button>
      <div
        id={@tooltip_id <> "-content"}
        role="tooltip"
        class="invisible opacity-0 transition-all duration-200 pointer-events-none z-[99999]"
        style="width: max-content; max-width: 300px; position: absolute;"
      >
        <div class="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 whitespace-normal">
          <div class="absolute left-1/2 bottom-full transform -translate-x-1/2 mb-1">
            <div class="w-0 h-0 border-l-4 border-r-4 border-transparent border-b-4 border-b-gray-900">
            </div>
          </div>
          {@text}
        </div>
      </div>
    </div>
    """
  end

  attr :value, :float, required: true, doc: "Progress value between 0.0 and 1.0"
  attr :max_value, :float, default: 1.0, doc: "Maximum value for percentage calculation"

  attr :color_class, :string,
    default: "bg-indigo-600",
    doc: "Tailwind color class for the progress bar"

  attr :size, :atom, default: :medium, values: [:small, :medium, :large], doc: "Size variant"
  attr :width_class, :string, default: "w-full", doc: "Width class for the container"
  attr :animate, :boolean, default: true, doc: "Whether to animate transitions"
  attr :label, :string, default: nil, doc: "Optional label text"
  attr :show_percentage, :boolean, default: false, doc: "Whether to show percentage text"

  def progress_bar(assigns) do
    height_class =
      case assigns.size do
        :small -> "h-1"
        :medium -> "h-2"
        :large -> "h-3"
      end

    percentage = min(assigns.value / assigns.max_value * 100, 100)
    assigns = assign(assigns, :height_class, height_class)
    assigns = assign(assigns, :percentage, percentage)

    ~H"""
    <div class={[@width_class]}>
      <%= if @label do %>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600">{@label}</span>
          <%= if @show_percentage do %>
            <span class="font-medium text-gray-900">{Float.round(@percentage, 1)}%</span>
          <% end %>
        </div>
      <% end %>
      <div class={["bg-gray-200 rounded-full", @height_class]}>
        <div
          class={[
            @height_class,
            "rounded-full",
            @color_class,
            @animate && "transition-all duration-500"
          ]}
          style={"width: #{@percentage}%"}
          role="progressbar"
          aria-valuenow={@value}
          aria-valuemin="0"
          aria-valuemax={@max_value}
          aria-label={@label || "Progress"}
        />
      </div>
    </div>
    """
  end

  # Helper function to round chart max value to nice numbers
  defp round_chart_max(value) when value <= 0, do: 100

  defp round_chart_max(value) do
    # Determine rounding factor based on magnitude
    rounding_factor =
      if value < 500 do
        10
      else
        100
      end

    # Round up to nearest rounding factor
    ceil(value / rounding_factor) * rounding_factor
  end
end
