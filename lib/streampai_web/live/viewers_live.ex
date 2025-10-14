defmodule StreampaiWeb.ViewersLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.DashboardLayout

  alias Streampai.Stream.BannedViewer
  alias Streampai.Stream.ModerationAction
  alias Streampai.Stream.StreamViewer

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_user.id
    platform_filter = nil
    time_filter = :all_time
    viewers = load_viewers(user_id, platform_filter, time_filter)
    platform_distribution = get_platform_distribution(user_id, time_filter)

    socket =
      socket
      |> assign(:page_title, "Viewers")
      |> assign(:view_mode, :viewers)
      |> assign(:viewers, viewers)
      |> assign(:banned_viewers, [])
      |> assign(:search_query, "")
      |> assign(:platform_filter, platform_filter)
      |> assign(:time_filter, time_filter)
      |> assign(:filtered_count, length(viewers))
      |> assign(:platform_distribution, platform_distribution)

    {:ok, socket, layout: false}
  end

  @impl true
  def handle_event("switch_view", %{"view" => view}, socket) do
    user_id = socket.assigns.current_user.id
    view_mode = String.to_existing_atom(view)

    socket =
      case view_mode do
        :viewers ->
          viewers =
            load_viewers(user_id, socket.assigns.platform_filter, socket.assigns.time_filter)

          socket
          |> assign(:view_mode, :viewers)
          |> assign(:viewers, viewers)
          |> assign(:search_query, "")

        :banned ->
          banned_viewers = load_banned_viewers(user_id)

          socket
          |> assign(:view_mode, :banned)
          |> assign(:banned_viewers, banned_viewers)
          |> assign(:search_query, "")
      end

    {:noreply, socket}
  end

  @impl true
  def handle_event("unban_viewer", %{"id" => id}, socket) do
    user_id = socket.assigns.current_user.id
    actor = socket.assigns.current_user

    case ModerationAction.unban_viewer(%{user_id: user_id, banned_viewer_id: id}, actor: actor) do
      {:ok, _result} ->
        banned_viewers = load_banned_viewers(user_id)

        socket =
          socket
          |> assign(:banned_viewers, banned_viewers)
          |> put_flash(:info, "Viewer unbanned successfully")

        {:noreply, socket}

      {:error, _reason} ->
        socket = put_flash(socket, :error, "Failed to unban viewer")

        {:noreply, socket}
    end
  end

  @impl true
  def handle_event("search", %{"query" => query}, socket) do
    viewers =
      if query == "" do
        load_viewers(
          socket.assigns.current_user.id,
          socket.assigns.platform_filter,
          socket.assigns.time_filter
        )
      else
        search_viewers(socket.assigns.current_user.id, query)
      end

    socket =
      socket
      |> assign(:viewers, viewers)
      |> assign(:search_query, query)
      |> assign(:filtered_count, length(viewers))

    {:noreply, socket}
  end

  @impl true
  def handle_event("filter_platform", %{"platform" => platform_str}, socket) do
    user_id = socket.assigns.current_user.id

    platform_filter =
      case platform_str do
        "" -> nil
        "all" -> nil
        p -> String.to_existing_atom(p)
      end

    viewers = load_viewers(user_id, platform_filter, socket.assigns.time_filter)

    socket =
      socket
      |> assign(:viewers, viewers)
      |> assign(:platform_filter, platform_filter)
      |> assign(:filtered_count, length(viewers))

    {:noreply, socket}
  end

  @impl true
  def handle_event("filter_time", %{"time" => time_str}, socket) do
    user_id = socket.assigns.current_user.id

    time_filter =
      case time_str do
        "last_7d" -> :last_7d
        "last_30d" -> :last_30d
        "all_time" -> :all_time
        _ -> :all_time
      end

    viewers = load_viewers(user_id, socket.assigns.platform_filter, time_filter)
    platform_distribution = get_platform_distribution(user_id, time_filter)

    socket =
      socket
      |> assign(:viewers, viewers)
      |> assign(:time_filter, time_filter)
      |> assign(:filtered_count, length(viewers))
      |> assign(:platform_distribution, platform_distribution)
      |> push_event("update-chart", %{stats: platform_distribution})

    {:noreply, socket}
  end

  defp load_viewers(user_id, platform_filter, time_filter) do
    require Ash.Query

    query = Ash.Query.for_read(StreamViewer, :for_user, %{user_id: user_id})

    query =
      if platform_filter do
        Ash.Query.filter(query, platform == ^platform_filter)
      else
        query
      end

    query = apply_time_filter(query, time_filter)

    Ash.read!(query)
  end

  defp search_viewers(user_id, query) do
    StreamViewer
    |> Ash.Query.for_read(:by_display_name, %{
      user_id: user_id,
      display_name: query,
      similarity_threshold: 0.3
    })
    |> Ash.read!()
  end

  defp load_banned_viewers(user_id) do
    require Ash.Query

    BannedViewer
    |> Ash.Query.for_read(:get_active_bans, %{user_id: user_id})
    |> Ash.Query.load([:banned_by_user])
    |> Ash.read!(authorize?: false)
  end

  defp get_platform_distribution(user_id, time_filter) do
    require Ash.Query

    query = Ash.Query.for_read(StreamViewer, :for_user, %{user_id: user_id})
    query = apply_time_filter(query, time_filter)

    query
    |> Ash.read!(authorize?: false)
    |> Enum.group_by(& &1.platform)
    |> Map.new(fn {platform, viewers} -> {platform, length(viewers)} end)
  end

  defp apply_time_filter(query, time_filter) do
    require Ash.Query

    case time_filter do
      :last_7d ->
        cutoff_date = DateTime.add(DateTime.utc_now(), -7, :day)
        Ash.Query.filter(query, last_seen_at >= ^cutoff_date)

      :last_30d ->
        cutoff_date = DateTime.add(DateTime.utc_now(), -30, :day)
        Ash.Query.filter(query, last_seen_at >= ^cutoff_date)

      :all_time ->
        query
    end
  end

  defp format_relative_date(datetime) do
    now = DateTime.utc_now()
    date_only = DateTime.to_date(datetime)
    today = DateTime.to_date(now)
    diff_days = Date.diff(today, date_only)

    cond do
      diff_days == 0 ->
        "Today"

      diff_days == 1 ->
        "Yesterday"

      diff_days >= 2 and diff_days <= 5 ->
        "#{diff_days} days ago"

      true ->
        Calendar.strftime(datetime, "%b %d, %Y %I:%M %p")
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <.dashboard_layout current_page={:viewers} current_user={@current_user} page_title="Viewers">
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Viewers</h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track all viewers across platforms
          </p>
        </div>

        <%= if @view_mode == :viewers do %>
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-3">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Platform Distribution
                </h3>
                <div
                  phx-hook="PlatformChart"
                  phx-update="ignore"
                  id="platform-chart"
                  data-stats={Jason.encode!(@platform_distribution)}
                  class="w-full h-[280px]"
                >
                  <canvas></canvas>
                </div>
              </div>
            </div>

            <div class="lg:col-span-1">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full flex flex-col justify-center items-center">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Filtered Results
                </p>
                <p class="text-6xl font-bold text-indigo-600 dark:text-indigo-400">
                  {@filtered_count}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  viewers
                </p>
              </div>
            </div>
          </div>
        <% end %>

        <div class="flex items-center gap-4">
          <div class="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              phx-click="switch_view"
              phx-value-view="viewers"
              class={[
                "px-4 py-2 text-sm font-medium transition-colors",
                if(@view_mode == :viewers,
                  do: "bg-indigo-600 text-white",
                  else:
                    "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )
              ]}
            >
              Viewers
            </button>
            <button
              phx-click="switch_view"
              phx-value-view="banned"
              class={[
                "px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-colors",
                if(@view_mode == :banned,
                  do: "bg-indigo-600 text-white",
                  else:
                    "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )
              ]}
            >
              Banned Viewers
            </button>
          </div>

          <%= if @view_mode == :viewers do %>
            <form phx-change="filter_time">
              <select
                name="time"
                value={@time_filter}
                class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all_time">All Time</option>
                <option value="last_7d">Last 7 Days</option>
                <option value="last_30d">Last 30 Days</option>
              </select>
            </form>

            <form phx-change="filter_platform">
              <select
                name="platform"
                value={@platform_filter || "all"}
                class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Platforms</option>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="kick">Kick</option>
              </select>
            </form>

            <form phx-change="search" class="flex-1">
              <input
                type="text"
                name="query"
                value={@search_query}
                placeholder="Search viewers..."
                class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </form>
          <% end %>
        </div>

        <%= if @view_mode == :viewers do %>
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Viewer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    First Seen
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Seen
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <%= for viewer <- @viewers do %>
                  <tr
                    class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    phx-click={JS.navigate("/dashboard/viewers/#{viewer.viewer_id}")}
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <%= if viewer.avatar_url do %>
                            <img class="h-10 w-10 rounded-full" src={viewer.avatar_url} alt="" />
                          <% else %>
                            <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span class="text-gray-600 dark:text-gray-300 font-medium">
                                {String.first(viewer.display_name) |> String.upcase()}
                              </span>
                            </div>
                          <% end %>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {viewer.display_name}
                          </div>
                          <%= if viewer.channel_url do %>
                            <a
                              href={viewer.channel_url}
                              target="_blank"
                              class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View Channel
                            </a>
                          <% end %>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {viewer.platform |> to_string() |> String.capitalize()}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex gap-2">
                        <%= if viewer.is_verified do %>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Verified
                          </span>
                        <% end %>
                        <%= if viewer.is_owner do %>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Owner
                          </span>
                        <% end %>
                        <%= if viewer.is_moderator do %>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Mod
                          </span>
                        <% end %>
                        <%= if viewer.is_patreon do %>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                            Patron
                          </span>
                        <% end %>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format_relative_date(viewer.first_seen_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format_relative_date(viewer.last_seen_at)}
                    </td>
                  </tr>
                <% end %>
              </tbody>
            </table>

            <%= if Enum.empty?(@viewers) do %>
              <div class="text-center py-12">
                <p class="text-gray-500 dark:text-gray-400">
                  <%= if @search_query != "" do %>
                    No viewers found matching "{@search_query}"
                  <% else %>
                    No viewers yet. They'll appear here once someone chats!
                  <% end %>
                </p>
              </div>
            <% end %>
          </div>
        <% else %>
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Viewer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Banned Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Banned By
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <%= for banned_viewer <- @banned_viewers do %>
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {banned_viewer.viewer_username}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        ID: {banned_viewer.viewer_platform_id}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {banned_viewer.platform |> to_string() |> String.capitalize()}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {banned_viewer.reason || "-"}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {Calendar.strftime(banned_viewer.inserted_at, "%b %d, %Y %I:%M %p")}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <%= if banned_viewer.banned_by_user do %>
                        {banned_viewer.banned_by_user.email}
                      <% else %>
                        System
                      <% end %>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        phx-click="unban_viewer"
                        phx-value-id={banned_viewer.id}
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Unban
                      </button>
                    </td>
                  </tr>
                <% end %>
              </tbody>
            </table>

            <%= if Enum.empty?(@banned_viewers) do %>
              <div class="text-center py-12">
                <p class="text-gray-500 dark:text-gray-400">
                  No banned viewers. All viewers are currently allowed!
                </p>
              </div>
            <% end %>
          </div>
        <% end %>
      </div>
    </.dashboard_layout>
    """
  end
end
