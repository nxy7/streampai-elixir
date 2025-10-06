defmodule StreampaiWeb.ViewerDetailsLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.DashboardLayout
  import StreampaiWeb.Utils.PlatformUtils

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamViewer

  require Ash.Query

  @impl true
  def mount(%{"id" => viewer_id}, _session, socket) do
    user_id = socket.assigns.current_user.id

    viewer =
      StreamViewer
      |> Ash.Query.for_read(:read)
      |> Ash.Query.filter(viewer_id == ^viewer_id and user_id == ^user_id)
      |> Ash.read_one!()

    messages = ChatMessage.get_for_viewer!(viewer_id, user_id)
    events = StreamEvent.get_for_viewer!(viewer_id, user_id)

    socket =
      socket
      |> assign(:page_title, "Viewer: #{viewer.display_name}")
      |> assign(:viewer, viewer)
      |> assign(:messages, messages)
      |> assign(:events, events)

    {:ok, socket, layout: false}
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
              class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
              <%= if @viewer.avatar_url do %>
                <img
                  class="h-12 w-12 rounded-full"
                  src={@viewer.avatar_url}
                  alt={@viewer.display_name}
                />
              <% else %>
                <div class="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span class="text-gray-600 dark:text-gray-300 text-xl font-medium">
                    {String.first(@viewer.display_name) |> String.upcase()}
                  </span>
                </div>
              <% end %>
              <div class="ml-4">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {@viewer.display_name}
                </h1>
                <%= if @viewer.channel_url do %>
                  <a
                    href={@viewer.channel_url}
                    target="_blank"
                    class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Channel
                  </a>
                <% end %>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <%= if @viewer.is_verified do %>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Verified
              </span>
            <% end %>
            <%= if @viewer.is_owner do %>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Owner
              </span>
            <% end %>
            <%= if @viewer.is_moderator do %>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Moderator
              </span>
            <% end %>
            <%= if @viewer.is_patreon do %>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                Patron
              </span>
            <% end %>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              AI Summary
            </h3>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              {@viewer.ai_summary || "No AI summary available yet."}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Activity Info
            </h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  First Seen
                </dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {Calendar.strftime(@viewer.first_seen_at, "%b %d, %Y %I:%M %p")}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Seen
                </dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {Calendar.strftime(@viewer.last_seen_at, "%b %d, %Y %I:%M %p")}
                </dd>
              </div>
              <%= if @viewer.notes do %>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Notes
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {@viewer.notes}
                  </dd>
                </div>
              <% end %>
            </dl>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Recent Messages
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({length(@messages)})
              </span>
            </h3>
          </div>
          <%= if Enum.empty?(@messages) do %>
            <div class="p-12 text-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p class="mt-4 text-gray-500 dark:text-gray-400">No messages yet</p>
              <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Messages will appear here once this viewer chats
              </p>
            </div>
          <% else %>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <%= for message <- @messages do %>
                <div class="p-6">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(message.platform)}"}>
                      {platform_name(message.platform)}
                    </span>
                    <%= if message.sender_is_moderator do %>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Moderator
                      </span>
                    <% end %>
                    <%= if message.livestream_id do %>
                      <.link
                        navigate={~p"/dashboard/stream-history/#{message.livestream_id}"}
                        class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {format_datetime(message.inserted_at)}
                      </.link>
                    <% else %>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {format_datetime(message.inserted_at)}
                      </span>
                    <% end %>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{message.message}</p>
                </div>
              <% end %>
            </div>
          <% end %>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Recent Events
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({length(@events)})
              </span>
            </h3>
          </div>
          <%= if Enum.empty?(@events) do %>
            <div class="p-12 text-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="mt-4 text-gray-500 dark:text-gray-400">No events yet</p>
              <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Events like donations and subscriptions will appear here
              </p>
            </div>
          <% else %>
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <%= for event <- @events do %>
                <div class="p-6">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {event.type}
                    </span>
                    <%= if event.platform do %>
                      <span class={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{platform_badge_color(event.platform)}"}>
                        {platform_name(event.platform)}
                      </span>
                    <% end %>
                    <%= if event.livestream_id do %>
                      <.link
                        navigate={~p"/dashboard/stream-history/#{event.livestream_id}"}
                        class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {format_datetime(event.inserted_at)}
                      </.link>
                    <% else %>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {format_datetime(event.inserted_at)}
                      </span>
                    <% end %>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {format_event_data(event)}
                  </p>
                </div>
              <% end %>
            </div>
          <% end %>
        </div>
      </div>
    </.dashboard_layout>
    """
  end

  defp format_event_data(%{data: data}) when is_map(data) do
    Enum.map_join(data, ", ", fn {k, v} -> "#{k}: #{v}" end)
  end

  defp format_event_data(_), do: "—"

  defp format_datetime(datetime) do
    now = DateTime.utc_now()
    diff_seconds = DateTime.diff(now, datetime, :second)

    cond do
      diff_seconds < 60 ->
        "just now"

      diff_seconds < 3600 ->
        minutes = div(diff_seconds, 60)
        "#{minutes}m ago"

      diff_seconds < 86_400 ->
        hours = div(diff_seconds, 3600)
        "#{hours}h ago"

      diff_seconds < 604_800 ->
        days = div(diff_seconds, 86_400)
        "#{days}d ago"

      true ->
        Calendar.strftime(datetime, "%b %d, %Y")
    end
  end
end
