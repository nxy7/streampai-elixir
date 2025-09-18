defmodule StreampaiWeb.DashboardPatreonsLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  alias StreampaiWeb.Utils.FakePatreon

  def mount_page(socket, _params, _session) do
    patreons = FakePatreon.generate_patreons(250)
    platform_stats = FakePatreon.get_platform_stats(patreons)
    tier_distribution = FakePatreon.get_tier_distribution(patreons)
    monthly_revenue = FakePatreon.get_monthly_revenue_chart_data(patreons)
    growth_metrics = FakePatreon.get_growth_metrics(patreons)

    socket =
      socket
      |> assign(:page_title, "Patreons")
      |> assign(:patreons, patreons)
      |> assign(:filtered_patreons, patreons)
      |> assign(:platform_stats, platform_stats)
      |> assign(:tier_distribution, tier_distribution)
      |> assign(:monthly_revenue, monthly_revenue)
      |> assign(:growth_metrics, growth_metrics)
      |> assign(:search_query, "")
      |> assign(:filter_platform, "all")
      |> assign(:filter_tier, "all")
      |> assign(:filter_status, "all")
      |> assign(:sort_by, "recent")

    {:ok, socket, layout: false}
  end

  def handle_event("search", %{"query" => query}, socket) do
    filtered = filter_patreons(socket.assigns.patreons, query, socket.assigns)
    {:noreply, assign(socket, search_query: query, filtered_patreons: filtered)}
  end

  def handle_event("filter_platform", %{"platform" => platform}, socket) do
    filtered =
      filter_patreons(
        socket.assigns.patreons,
        socket.assigns.search_query,
        Map.put(socket.assigns, :filter_platform, platform)
      )

    {:noreply, assign(socket, filter_platform: platform, filtered_patreons: filtered)}
  end

  def handle_event("filter_tier", %{"tier" => tier}, socket) do
    filtered =
      filter_patreons(
        socket.assigns.patreons,
        socket.assigns.search_query,
        Map.put(socket.assigns, :filter_tier, tier)
      )

    {:noreply, assign(socket, filter_tier: tier, filtered_patreons: filtered)}
  end

  def handle_event("filter_status", %{"status" => status}, socket) do
    filtered =
      filter_patreons(
        socket.assigns.patreons,
        socket.assigns.search_query,
        Map.put(socket.assigns, :filter_status, status)
      )

    {:noreply, assign(socket, filter_status: status, filtered_patreons: filtered)}
  end

  def handle_event("sort", %{"sort_by" => sort_by}, socket) do
    sorted = sort_patreons(socket.assigns.filtered_patreons, sort_by)
    {:noreply, assign(socket, sort_by: sort_by, filtered_patreons: sorted)}
  end

  defp filter_patreons(patreons, query, assigns) do
    patreons
    |> filter_by_search(query)
    |> filter_by_platform(assigns.filter_platform)
    |> filter_by_tier(assigns.filter_tier)
    |> filter_by_status(assigns.filter_status)
    |> sort_patreons(assigns.sort_by)
  end

  defp filter_by_search(patreons, ""), do: patreons

  defp filter_by_search(patreons, query) do
    downcased = String.downcase(query)

    Enum.filter(patreons, fn p ->
      String.contains?(String.downcase(p.username), downcased) or
        String.contains?(String.downcase(p.display_name), downcased)
    end)
  end

  defp filter_by_platform(patreons, "all"), do: patreons

  defp filter_by_platform(patreons, platform) do
    Enum.filter(patreons, &(&1.platform == platform))
  end

  defp filter_by_tier(patreons, "all"), do: patreons

  defp filter_by_tier(patreons, tier) do
    Enum.filter(patreons, &(&1.tier == tier))
  end

  defp filter_by_status(patreons, "all"), do: patreons

  defp filter_by_status(patreons, "active") do
    Enum.filter(patreons, & &1.is_active)
  end

  defp filter_by_status(patreons, "inactive") do
    Enum.filter(patreons, &(not &1.is_active))
  end

  defp sort_patreons(patreons, "recent") do
    Enum.sort_by(patreons, & &1.start_date, {:desc, DateTime})
  end

  defp sort_patreons(patreons, "amount") do
    Enum.sort_by(patreons, & &1.amount, :desc)
  end

  defp sort_patreons(patreons, "lifetime") do
    Enum.sort_by(patreons, & &1.lifetime_value, :desc)
  end

  defp sort_patreons(patreons, "name") do
    Enum.sort_by(patreons, & &1.display_name)
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="patreons" page_title="Patreons">
      <div class="space-y-6">
        <!-- Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Total Patreons</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {@growth_metrics.total_patreons}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {@growth_metrics.active_patreons} active
                </p>
              </div>
              <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <StreampaiWeb.CoreComponents.icon
                  name="hero-users"
                  class="w-6 h-6 text-purple-600 dark:text-purple-400"
                />
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  ${Float.round(Enum.sum(Enum.map(@platform_stats, & &1.revenue)), 2)}
                </p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                  <StreampaiWeb.CoreComponents.icon name="hero-arrow-trending-up" class="w-3 h-3 inline" />
                  {@growth_metrics.growth_rate}% growth
                </p>
              </div>
              <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <StreampaiWeb.CoreComponents.icon
                  name="hero-currency-dollar"
                  class="w-6 h-6 text-green-600 dark:text-green-400"
                />
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">New This Month</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {@growth_metrics.new_this_month}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Joined recently
                </p>
              </div>
              <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <StreampaiWeb.CoreComponents.icon
                  name="hero-user-plus"
                  class="w-6 h-6 text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Retention Rate</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {@growth_metrics.retention_rate}%
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Active subscribers
                </p>
              </div>
              <div class="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <StreampaiWeb.CoreComponents.icon
                  name="hero-chart-pie"
                  class="w-6 h-6 text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
        
    <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Platform Distribution -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Platform Distribution
            </h3>
            <div class="space-y-4">
              <%= for stat <- @platform_stats do %>
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stat.platform}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {stat.active} active / {stat.total} total
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class={"h-2 rounded-full #{platform_color_class(stat.platform)}"}
                      style={"width: #{percentage_width(stat.active, @growth_metrics.active_patreons)}%"}
                    >
                    </div>
                  </div>
                </div>
              <% end %>
            </div>
          </div>
          
    <!-- Tier Distribution -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tier Distribution
            </h3>
            <div class="space-y-4">
              <%= for tier <- @tier_distribution do %>
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {tier.tier}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {tier.count} ({tier.percentage}%)
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class={"h-2 rounded-full #{tier_color_class(tier.tier)}"}
                      style={"width: #{tier.percentage}%"}
                    >
                    </div>
                  </div>
                </div>
              <% end %>
            </div>
          </div>
        </div>
        
    <!-- Filters and Search -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-1 min-w-[200px]">
              <div class="relative">
                <input
                  type="text"
                  value={@search_query}
                  phx-keyup="search"
                  phx-debounce="300"
                  placeholder="Search patreons..."
                  class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <StreampaiWeb.CoreComponents.icon
                  name="hero-magnifying-glass"
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                />
              </div>
            </div>

            <select
              phx-change="filter_platform"
              name="platform"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Platforms</option>
              <option value="Twitch">Twitch</option>
              <option value="YouTube">YouTube</option>
              <option value="Facebook">Facebook</option>
              <option value="Kick">Kick</option>
              <option value="Streampai">Streampai</option>
            </select>

            <select
              phx-change="filter_tier"
              name="tier"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Tiers</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Diamond">Diamond</option>
              <option value="Platinum">Platinum</option>
            </select>

            <select
              phx-change="filter_status"
              name="status"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              phx-change="sort"
              name="sort_by"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Most Recent</option>
              <option value="amount">Highest Amount</option>
              <option value="lifetime">Lifetime Value</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
        
    <!-- Patreons Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patreon
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tier
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <%= for patreon <- Enum.take(@filtered_patreons, 20) do %>
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <img
                          class="h-10 w-10 rounded-full"
                          src={patreon.avatar_url}
                          alt={patreon.display_name}
                        />
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {patreon.display_name}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            @{patreon.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{platform_badge_class(patreon.platform)}"}>
                        {patreon.platform}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{tier_badge_class(patreon.tier)}"}>
                        {patreon.tier}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${patreon.amount} {patreon.currency}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {patreon.months_subscribed} months
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <%= if patreon.is_active do %>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      <% else %>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Inactive
                        </span>
                      <% end %>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <.link
                        navigate={"/dashboard/viewers/#{patreon.viewer_id}"}
                        class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        View Profile →
                      </.link>
                    </td>
                  </tr>
                <% end %>
              </tbody>
            </table>
          </div>

          <%= if length(@filtered_patreons) > 20 do %>
            <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 text-center">
              Showing 20 of {length(@filtered_patreons)} patreons
            </div>
          <% end %>
        </div>
      </div>
    </.dashboard_layout>
    """
  end

  defp platform_color_class("Twitch"), do: "bg-purple-600"
  defp platform_color_class("YouTube"), do: "bg-red-600"
  defp platform_color_class("Facebook"), do: "bg-blue-600"
  defp platform_color_class("Kick"), do: "bg-green-600"
  defp platform_color_class("Streampai"), do: "bg-gradient-to-r from-purple-600 to-pink-600"
  defp platform_color_class(_), do: "bg-gray-600"

  defp platform_badge_class("Twitch"), do: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"

  defp platform_badge_class("YouTube"), do: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"

  defp platform_badge_class("Facebook"), do: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"

  defp platform_badge_class("Kick"), do: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"

  defp platform_badge_class("Streampai"), do: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"

  defp platform_badge_class(_), do: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"

  defp tier_color_class("Bronze"), do: "bg-amber-700"
  defp tier_color_class("Silver"), do: "bg-gray-500"
  defp tier_color_class("Gold"), do: "bg-yellow-500"
  defp tier_color_class("Diamond"), do: "bg-cyan-500"
  defp tier_color_class("Platinum"), do: "bg-purple-600"
  defp tier_color_class(_), do: "bg-gray-600"

  defp tier_badge_class("Bronze"), do: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"

  defp tier_badge_class("Silver"), do: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"

  defp tier_badge_class("Gold"), do: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"

  defp tier_badge_class("Diamond"), do: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"

  defp tier_badge_class("Platinum"), do: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"

  defp tier_badge_class(_), do: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"

  defp percentage_width(value, total) when total > 0 do
    Float.round(value / total * 100, 1)
  end

  defp percentage_width(_, _), do: 0
end
