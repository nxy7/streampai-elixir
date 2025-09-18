defmodule StreampaiWeb.ViewerDetailsLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.DashboardLayout
  import StreampaiWeb.AnalyticsComponents

  alias StreampaiWeb.Utils.MockViewers

  @impl true
  def mount(%{"id" => viewer_id}, _session, socket) do
    viewer = MockViewers.generate_viewer_details(viewer_id)

    socket =
      socket
      |> assign(:page_title, "Viewer: #{viewer.username}")
      |> assign(:viewer, viewer)
      |> assign(:active_tab, :overview)

    {:ok, socket, layout: false}
  end

  @impl true
  def handle_event("change_tab", %{"tab" => tab}, socket) do
    {:noreply, assign(socket, :active_tab, String.to_atom(tab))}
  end

  defp format_duration(minutes) do
    hours = div(minutes, 60)
    remaining_minutes = rem(minutes, 60)

    cond do
      hours > 24 -> "#{div(hours, 24)}d #{rem(hours, 24)}h"
      hours > 0 -> "#{hours}h #{remaining_minutes}m"
      true -> "#{remaining_minutes}m"
    end
  end

  defp format_datetime(datetime) do
    Calendar.strftime(datetime, "%b %d, %Y at %I:%M %p")
  end

  defp format_date_relative(datetime) do
    StreampaiWeb.Utils.FormatHelpers.format_date_relative(datetime)
  end

  defp platform_color(platform) do
    StreampaiWeb.Utils.PlatformUtils.platform_badge_color(platform)
  end

  @tag_colors %{
    "VIP" => "bg-yellow-100 text-yellow-800",
    "Subscriber" => "bg-purple-100 text-purple-800",
    "Moderator" => "bg-green-100 text-green-800",
    "Regular" => "bg-blue-100 text-blue-800",
    "New" => "bg-pink-100 text-pink-800",
    "Turbo" => "bg-indigo-100 text-indigo-800",
    "Prime" => "bg-orange-100 text-orange-800",
    "Gifted Sub" => "bg-red-100 text-red-800"
  }

  defp tag_color(tag) do
    Map.get(@tag_colors, tag, "bg-gray-100 text-gray-800")
  end

  defp donation_type_icon(type) do
    case type do
      :bits -> "💎"
      :superchat -> "💰"
      :donation -> "🎁"
      :subscription -> "⭐"
      _ -> "💵"
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <.dashboard_layout
      current_page={:viewers}
      current_user={@current_user}
      page_title="Viewer Details"
    >
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <.link
              navigate={~p"/dashboard/viewers"}
              class="text-gray-500 hover:text-gray-700"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </.link>
            <div class="flex items-center">
              <img class="h-12 w-12 rounded-full" src={@viewer.avatar} alt={@viewer.username} />
              <div class="ml-4">
                <h1 class="text-2xl font-bold text-gray-900">{@viewer.username}</h1>
                <p class="text-sm text-gray-500">{@viewer.email}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <%= if @viewer.is_subscriber do %>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Subscriber • Tier {@viewer.subscription_tier}
              </span>
            <% end %>
            <%= if @viewer.is_follower do %>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Follower
              </span>
            <% end %>
          </div>
        </div>

        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              phx-click="change_tab"
              phx-value-tab="overview"
              class={"whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm " <>
                if @active_tab == :overview do
                  "border-purple-500 text-purple-600"
                else
                  "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                end}
            >
              Overview
            </button>
            <button
              phx-click="change_tab"
              phx-value-tab="statistics"
              class={"whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm " <>
                if @active_tab == :statistics do
                  "border-purple-500 text-purple-600"
                else
                  "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                end}
            >
              Statistics
            </button>
            <button
              phx-click="change_tab"
              phx-value-tab="chat_history"
              class={"whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm " <>
                if @active_tab == :chat_history do
                  "border-purple-500 text-purple-600"
                else
                  "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                end}
            >
              Chat History
            </button>
            <button
              phx-click="change_tab"
              phx-value-tab="donations"
              class={"whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm " <>
                if @active_tab == :donations do
                  "border-purple-500 text-purple-600"
                else
                  "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                end}
            >
              Donations
            </button>
          </nav>
        </div>

        <%= case @active_tab do %>
          <% :overview -> %>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">AI Summary</h3>
                  <p class="text-gray-700 leading-relaxed">
                    {@viewer.ai_summary}
                  </p>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Linked Accounts
                  </h3>
                  <div class="space-y-3">
                    <%= for account <- @viewer.linked_accounts do %>
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-3">
                          <span class={"inline-flex items-center px-2 py-1 rounded text-xs font-medium " <> platform_color(account.platform)}>
                            {account.platform |> Atom.to_string() |> String.capitalize()}
                          </span>
                          <div>
                            <p class="text-sm font-medium text-gray-900">
                              {account.username}
                            </p>
                            <p class="text-xs text-gray-500">
                              Linked via {account.linked_via} • {format_date_relative(
                                account.linked_at
                              )}
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-xs text-gray-500">Confidence</p>
                          <p class="text-sm font-semibold text-gray-900">
                            {account.confidence}%
                          </p>
                        </div>
                      </div>
                    <% end %>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Badges & Achievements
                  </h3>
                  <div class="grid grid-cols-2 gap-4">
                    <%= for badge <- @viewer.badges do %>
                      <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span class="text-2xl">{badge.icon}</span>
                        <div>
                          <p class="text-sm font-medium text-gray-900">
                            {badge.name}
                          </p>
                          <p class="text-xs text-gray-500">{badge.description}</p>
                        </div>
                      </div>
                    <% end %>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                  <dl class="space-y-4">
                    <div>
                      <dt class="text-sm font-medium text-gray-500">
                        Total Watch Time
                      </dt>
                      <dd class="mt-1 text-xl font-semibold text-gray-900">
                        {format_duration(@viewer.total_watch_time)}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">
                        Total Messages
                      </dt>
                      <dd class="mt-1 text-xl font-semibold text-gray-900">
                        {@viewer.total_messages
                        |> Integer.to_string()
                        |> String.replace(~r/(\d)(?=(\d{3})+(?!\d))/, "\\1,")}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">
                        Total Donations
                      </dt>
                      <dd class="mt-1 text-xl font-semibold text-gray-900">
                        ${:erlang.float_to_binary(@viewer.total_donations, decimals: 2)}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">
                        Engagement Score
                      </dt>
                      <dd class="mt-1">
                        <.progress_bar
                          value={@viewer.engagement_score}
                          max_value={100.0}
                          color_class="bg-purple-500"
                          size={:medium}
                          show_percentage={true}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">Sentiment</dt>
                      <dd class="mt-1">
                        <.progress_bar
                          value={@viewer.sentiment_score}
                          max_value={100.0}
                          color_class="bg-green-500"
                          size={:medium}
                          show_percentage={true}
                        />
                      </dd>
                    </div>
                  </dl>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div class="flex flex-wrap gap-2">
                    <%= for tag <- @viewer.tags do %>
                      <span class={"inline-flex items-center px-3 py-1 rounded-full text-sm font-medium " <> tag_color(tag)}>
                        {tag}
                      </span>
                    <% end %>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Activity Info
                  </h3>
                  <dl class="space-y-3">
                    <div>
                      <dt class="text-sm font-medium text-gray-500">First Seen</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {format_datetime(@viewer.first_seen)}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500">Last Seen</dt>
                      <dd class="mt-1 text-sm text-gray-900">
                        {format_date_relative(@viewer.last_seen)}
                      </dd>
                    </div>
                    <%= if @viewer.is_subscriber do %>
                      <div>
                        <dt class="text-sm font-medium text-gray-500">
                          Subscription
                        </dt>
                        <dd class="mt-1 text-sm text-gray-900">
                          {@viewer.subscription_months} months • Tier {@viewer.subscription_tier}
                        </dd>
                      </div>
                    <% end %>
                  </dl>
                </div>
              </div>
            </div>
          <% :statistics -> %>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Top Donations</h3>
                <div class="space-y-3">
                  <%= for {donation, index} <- Enum.with_index(@viewer.top_donations, 1) do %>
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <span class="flex-shrink-0 text-2xl font-bold text-gray-400">
                          #{index}
                        </span>
                        <div>
                          <p class="text-lg font-semibold text-gray-900">
                            ${:erlang.float_to_binary(donation.amount, decimals: 2)}
                          </p>
                          <p class="text-sm text-gray-500">
                            {format_date_relative(donation.timestamp)} via {donation.platform}
                          </p>
                        </div>
                      </div>
                    </div>
                  <% end %>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Favorite Emotes
                </h3>
                <div class="space-y-3">
                  <%= for emote <- @viewer.favorite_emotes do %>
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-900">
                        {emote.emote}
                      </span>
                      <div class="flex items-center space-x-2">
                        <.progress_bar
                          value={min(100, emote.usage_count / 5)}
                          max_value={100.0}
                          color_class="bg-purple-500"
                          width_class="w-32"
                          size={:medium}
                        />
                        <span class="text-sm text-gray-500">
                          {emote.usage_count}
                        </span>
                      </div>
                    </div>
                  <% end %>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Chat Activity Patterns
                </h3>
                <dl class="space-y-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Most Active Hour
                    </dt>
                    <dd class="mt-1 text-lg font-semibold text-gray-900">
                      {@viewer.common_chat_times.most_active_hour}:00 - {@viewer.common_chat_times.most_active_hour +
                        1}:00
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Most Active Day
                    </dt>
                    <dd class="mt-1 text-lg font-semibold text-gray-900">
                      {@viewer.common_chat_times.most_active_day}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Avg Messages per Stream
                    </dt>
                    <dd class="mt-1 text-lg font-semibold text-gray-900">
                      {@viewer.common_chat_times.average_messages_per_stream}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Chat Participation Rate
                    </dt>
                    <dd class="mt-1 text-lg font-semibold text-gray-900">
                      {@viewer.common_chat_times.chat_participation_rate}%
                    </dd>
                  </div>
                </dl>
              </div>

              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Recent Watch Sessions
                </h3>
                <div class="space-y-2">
                  <%= for session <- Enum.take(@viewer.watch_sessions, 5) do %>
                    <div class="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {format_date_relative(session.date)}
                        </p>
                        <p class="text-xs text-gray-500">
                          {session.platform} • {session.chat_messages} messages
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-semibold text-gray-900">
                          {format_duration(div(session.duration, 60))}
                        </p>
                        <p class="text-xs text-gray-500">
                          {session.engagement_rate}% engaged
                        </p>
                      </div>
                    </div>
                  <% end %>
                </div>
              </div>
            </div>
          <% :chat_history -> %>
            <div class="bg-white rounded-lg shadow">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">
                  Recent Chat Messages
                </h3>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div class="divide-y divide-gray-200">
                  <%= for message <- @viewer.chat_history do %>
                    <div class={"px-6 py-3 " <> if message.highlighted, do: "bg-yellow-50", else: "hover:bg-gray-50"}>
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <p class="text-sm text-gray-900">
                            {message.message}
                          </p>
                          <div class="mt-1 flex items-center space-x-2">
                            <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium " <> platform_color(message.platform)}>
                              {message.platform |> Atom.to_string() |> String.capitalize()}
                            </span>
                            <span class="text-xs text-gray-500">
                              {format_datetime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                        <%= if message.highlighted do %>
                          <span class="ml-2 text-yellow-500">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </span>
                        <% end %>
                      </div>
                    </div>
                  <% end %>
                </div>
              </div>
            </div>
          <% :donations -> %>
            <div class="bg-white rounded-lg shadow">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Donation History</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Platform
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <%= for donation <- @viewer.donation_history do %>
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format_datetime(donation.timestamp)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <span class="inline-flex items-center space-x-1">
                            <span>{donation_type_icon(donation.type)}</span>
                            <span class="text-gray-900">
                              {donation.type |> Atom.to_string() |> String.capitalize()}
                            </span>
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium " <> platform_color(donation.platform)}>
                            {donation.platform |> Atom.to_string() |> String.capitalize()}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${:erlang.float_to_binary(donation.amount, decimals: 2)}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                          {donation.message || "-"}
                        </td>
                      </tr>
                    <% end %>
                  </tbody>
                </table>
              </div>
            </div>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
