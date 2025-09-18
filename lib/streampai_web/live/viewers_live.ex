defmodule StreampaiWeb.ViewersLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.DashboardLayout

  alias StreampaiWeb.Utils.MockViewers

  @impl true
  def mount(_params, _session, socket) do
    viewers = MockViewers.generate_viewers(100)

    socket =
      socket
      |> assign(:page_title, "Viewers")
      |> assign(:all_viewers, viewers)
      |> assign(:viewers, viewers)
      |> assign(:search_term, "")
      |> assign(:selected_platform, nil)
      |> assign(:selected_tags, [])
      |> assign(:sort_by, :last_seen)
      |> assign(:sort_order, :desc)

    {:ok, socket, layout: false}
  end

  @impl true
  def handle_event("search", %{"search" => %{"term" => term}}, socket) do
    filtered_viewers =
      filter_and_sort_viewers(
        socket.assigns.all_viewers,
        term,
        socket.assigns.selected_platform,
        socket.assigns.selected_tags,
        socket.assigns.sort_by,
        socket.assigns.sort_order
      )

    {:noreply, assign(socket, search_term: term, viewers: filtered_viewers)}
  end

  @impl true
  def handle_event("filter_platform", %{"platform" => platform}, socket) do
    platform = if platform == "all", do: nil, else: String.to_atom(platform)

    filtered_viewers =
      filter_and_sort_viewers(
        socket.assigns.all_viewers,
        socket.assigns.search_term,
        platform,
        socket.assigns.selected_tags,
        socket.assigns.sort_by,
        socket.assigns.sort_order
      )

    {:noreply, assign(socket, selected_platform: platform, viewers: filtered_viewers)}
  end

  @impl true
  def handle_event("toggle_tag", %{"tag" => tag}, socket) do
    selected_tags =
      if tag in socket.assigns.selected_tags do
        List.delete(socket.assigns.selected_tags, tag)
      else
        [tag | socket.assigns.selected_tags]
      end

    filtered_viewers =
      filter_and_sort_viewers(
        socket.assigns.all_viewers,
        socket.assigns.search_term,
        socket.assigns.selected_platform,
        selected_tags,
        socket.assigns.sort_by,
        socket.assigns.sort_order
      )

    {:noreply, assign(socket, selected_tags: selected_tags, viewers: filtered_viewers)}
  end

  @impl true
  def handle_event("sort", %{"by" => sort_by}, socket) do
    sort_by = String.to_atom(sort_by)

    sort_order =
      if sort_by == socket.assigns.sort_by do
        if socket.assigns.sort_order == :asc, do: :desc, else: :asc
      else
        default_sort_order(sort_by)
      end

    filtered_viewers =
      filter_and_sort_viewers(
        socket.assigns.all_viewers,
        socket.assigns.search_term,
        socket.assigns.selected_platform,
        socket.assigns.selected_tags,
        sort_by,
        sort_order
      )

    {:noreply, assign(socket, sort_by: sort_by, sort_order: sort_order, viewers: filtered_viewers)}
  end

  defp filter_and_sort_viewers(viewers, search_term, platform, tags, sort_by, sort_order) do
    viewers
    |> MockViewers.filter_viewers(search_term)
    |> filter_by_platform(platform)
    |> filter_by_tags(tags)
    |> sort_viewers(sort_by, sort_order)
  end

  defp filter_by_platform(viewers, nil), do: viewers

  defp filter_by_platform(viewers, platform) do
    Enum.filter(viewers, fn viewer ->
      platform in viewer.platforms
    end)
  end

  defp filter_by_tags(viewers, []), do: viewers

  defp filter_by_tags(viewers, tags) do
    Enum.filter(viewers, fn viewer ->
      Enum.any?(tags, fn tag -> tag in viewer.tags end)
    end)
  end

  defp sort_viewers(viewers, sort_by, sort_order) do
    Enum.sort_by(
      viewers,
      fn viewer ->
        case sort_by do
          :username -> viewer.username
          :last_seen -> viewer.last_seen
          :total_messages -> viewer.total_messages
          :total_donations -> viewer.total_donations
          :watch_time -> viewer.total_watch_time
          _ -> viewer.last_seen
        end
      end,
      sort_order
    )
  end

  defp default_sort_order(:username), do: :asc
  defp default_sort_order(_), do: :desc

  defp format_duration(minutes) do
    hours = div(minutes, 60)
    remaining_minutes = rem(minutes, 60)

    cond do
      hours > 24 -> "#{div(hours, 24)}d #{rem(hours, 24)}h"
      hours > 0 -> "#{hours}h #{remaining_minutes}m"
      true -> "#{remaining_minutes}m"
    end
  end

  defp format_date(datetime) do
    case NaiveDateTime.diff(NaiveDateTime.utc_now(), datetime, :day) do
      0 -> "Today"
      1 -> "Yesterday"
      days when days < 7 -> "#{days} days ago"
      days when days < 30 -> "#{div(days, 7)} weeks ago"
      days -> "#{div(days, 30)} months ago"
    end
  end

  defp platform_color(platform) do
    case platform do
      :twitch -> "bg-purple-100 text-purple-800"
      :youtube -> "bg-red-100 text-red-800"
      :facebook -> "bg-blue-100 text-blue-800"
      :kick -> "bg-green-100 text-green-800"
      _ -> "bg-gray-100 text-gray-800"
    end
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

  @impl true
  def render(assigns) do
    ~H"""
    <.dashboard_layout current_page={:viewers} current_user={@current_user} page_title="Viewers">
      <div class="space-y-6">
        <div class="flex flex-col gap-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Stream Viewers</h1>
            <p class="mt-2 text-gray-600">
              Manage and analyze your viewer base across all platforms
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-3 space-y-4">
              <div class="bg-white rounded-lg shadow p-4">
                <div class="flex flex-col sm:flex-row gap-4">
                  <form phx-submit="search" phx-change="search" class="flex-1">
                    <div class="relative">
                      <input
                        type="text"
                        name="search[term]"
                        value={@search_term}
                        placeholder="Search by username, email, or name..."
                        class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                      <svg
                        class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </form>

                  <div class="flex gap-2">
                    <select
                      phx-change="filter_platform"
                      name="platform"
                      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="all" selected={@selected_platform == nil}>All Platforms</option>
                      <option value="twitch" selected={@selected_platform == :twitch}>Twitch</option>
                      <option value="youtube" selected={@selected_platform == :youtube}>
                        YouTube
                      </option>
                      <option value="facebook" selected={@selected_platform == :facebook}>
                        Facebook
                      </option>
                      <option value="kick" selected={@selected_platform == :kick}>Kick</option>
                    </select>
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <span class="text-sm text-gray-600 mr-2">Filter by tags:</span>
                  <%= for tag <- ["VIP", "Subscriber", "Moderator", "Regular", "New"] do %>
                    <button
                      phx-click="toggle_tag"
                      phx-value-tag={tag}
                      class={"inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors " <>
                        if tag in @selected_tags do
                          tag_color(tag)
                        else
                          "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        end}
                    >
                      {tag}
                      <%= if tag in @selected_tags do %>
                        <svg class="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      <% end %>
                    </button>
                  <% end %>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left">
                          <button
                            phx-click="sort"
                            phx-value-by="username"
                            class="group inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Viewer
                            <span class="ml-2 flex-none">
                              <%= if @sort_by == :username do %>
                                <%= if @sort_order == :asc do %>
                                  ↑
                                <% else %>
                                  ↓
                                <% end %>
                              <% else %>
                                <span class="text-gray-400">↕</span>
                              <% end %>
                            </span>
                          </button>
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Platforms
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tags
                        </th>
                        <th scope="col" class="px-6 py-3 text-left">
                          <button
                            phx-click="sort"
                            phx-value-by="total_messages"
                            class="group inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Messages
                            <span class="ml-2 flex-none">
                              <%= if @sort_by == :total_messages do %>
                                <%= if @sort_order == :asc do %>
                                  ↑
                                <% else %>
                                  ↓
                                <% end %>
                              <% else %>
                                <span class="text-gray-400">↕</span>
                              <% end %>
                            </span>
                          </button>
                        </th>
                        <th scope="col" class="px-6 py-3 text-left">
                          <button
                            phx-click="sort"
                            phx-value-by="total_donations"
                            class="group inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Donations
                            <span class="ml-2 flex-none">
                              <%= if @sort_by == :total_donations do %>
                                <%= if @sort_order == :asc do %>
                                  ↑
                                <% else %>
                                  ↓
                                <% end %>
                              <% else %>
                                <span class="text-gray-400">↕</span>
                              <% end %>
                            </span>
                          </button>
                        </th>
                        <th scope="col" class="px-6 py-3 text-left">
                          <button
                            phx-click="sort"
                            phx-value-by="watch_time"
                            class="group inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Watch Time
                            <span class="ml-2 flex-none">
                              <%= if @sort_by == :watch_time do %>
                                <%= if @sort_order == :asc do %>
                                  ↑
                                <% else %>
                                  ↓
                                <% end %>
                              <% else %>
                                <span class="text-gray-400">↕</span>
                              <% end %>
                            </span>
                          </button>
                        </th>
                        <th scope="col" class="px-6 py-3 text-left">
                          <button
                            phx-click="sort"
                            phx-value-by="last_seen"
                            class="group inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Last Seen
                            <span class="ml-2 flex-none">
                              <%= if @sort_by == :last_seen do %>
                                <%= if @sort_order == :asc do %>
                                  ↑
                                <% else %>
                                  ↓
                                <% end %>
                              <% else %>
                                <span class="text-gray-400">↕</span>
                              <% end %>
                            </span>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <%= for viewer <- @viewers do %>
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <.link
                              navigate={~p"/dashboard/viewers/#{viewer.id}"}
                              class="flex items-center group"
                            >
                              <img
                                class="h-10 w-10 rounded-full"
                                src={viewer.avatar}
                                alt={viewer.username}
                              />
                              <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 group-hover:text-purple-600">
                                  {viewer.username}
                                </div>
                                <div class="text-sm text-gray-500">
                                  {viewer.email}
                                </div>
                              </div>
                            </.link>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex flex-wrap gap-1">
                              <%= for platform <- viewer.platforms do %>
                                <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium " <> platform_color(platform)}>
                                  {platform |> Atom.to_string() |> String.capitalize()}
                                </span>
                              <% end %>
                            </div>
                          </td>
                          <td class="px-6 py-4">
                            <div class="flex flex-wrap gap-1">
                              <%= for tag <- Enum.take(viewer.tags, 3) do %>
                                <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium " <> tag_color(tag)}>
                                  {tag}
                                </span>
                              <% end %>
                              <%= if length(viewer.tags) > 3 do %>
                                <span class="text-xs text-gray-500">
                                  +{length(viewer.tags) - 3}
                                </span>
                              <% end %>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {viewer.total_messages
                            |> Integer.to_string()
                            |> String.replace(~r/(\d)(?=(\d{3})+(?!\d))/, "\\1,")}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <%= if viewer.total_donations > 0 do %>
                              ${:erlang.float_to_binary(viewer.total_donations, decimals: 0)}
                            <% else %>
                              <span class="text-gray-400">-</span>
                            <% end %>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format_duration(viewer.total_watch_time)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format_date(viewer.last_seen)}
                          </td>
                        </tr>
                      <% end %>
                    </tbody>
                  </table>
                </div>

                <%= if @viewers == [] do %>
                  <div class="text-center py-12">
                    <svg
                      class="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">
                      No viewers found
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                <% end %>
              </div>
            </div>

            <div class="space-y-4">
              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
                <dl class="space-y-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Total Viewers
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold text-gray-900">
                      {length(@all_viewers)}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Active Subscribers
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold text-gray-900">
                      {Enum.count(@all_viewers, & &1.is_subscriber)}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Total Followers
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold text-gray-900">
                      {Enum.count(@all_viewers, & &1.is_follower)}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">
                      Multi-Platform
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold text-gray-900">
                      {Enum.count(@all_viewers, fn v -> length(v.platforms) > 1 end)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Top Contributors
                </h3>
                <div class="space-y-3">
                  <%= for viewer <- @all_viewers |> Enum.sort_by(& &1.total_donations, :desc) |> Enum.take(5) do %>
                    <.link
                      navigate={~p"/dashboard/viewers/#{viewer.id}"}
                      class="flex items-center justify-between group"
                    >
                      <div class="flex items-center">
                        <img class="h-8 w-8 rounded-full" src={viewer.avatar} alt={viewer.username} />
                        <span class="ml-2 text-sm font-medium text-gray-900 group-hover:text-purple-600">
                          {viewer.username}
                        </span>
                      </div>
                      <span class="text-sm font-semibold text-gray-900">
                        ${:erlang.float_to_binary(viewer.total_donations, decimals: 0)}
                      </span>
                    </.link>
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
end
