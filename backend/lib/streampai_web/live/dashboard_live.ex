defmodule StreampaiWeb.DashboardLive do
  @moduledoc """
  Main dashboard LiveView providing overview of user's streaming status and quick actions.
  """
  use StreampaiWeb.BaseLive
  import StreampaiWeb.Components.DashboardComponents

  # @dev_env Application.compile_env(:streampai, :env) == :dev

  alias Streampai.Dashboard

  def mount_page(socket, _params, _session) do
    greeting_text =
      if connected?(socket) and Map.has_key?(socket.assigns, :greeting_text) do
        socket.assigns.greeting_text
      else
        Enum.random([
          "Ready to start streaming to multiple platforms? Connect your accounts and manage your content all in one place.",
          "How is it going handsome?"
        ])
      end

    socket =
      socket
      |> safe_load(
        fn ->
          Dashboard.get_dashboard_data(socket.assigns.current_user)
        end,
        :dashboard_data,
        "Failed to load dashboard data"
      )
      |> assign(
        display_name: get_display_name(socket),
        greeting_text: greeting_text,
        page_title: "Dashboard"
      )

    {:ok, socket, layout: false}
  end

  defp get_display_name(%{assigns: %{dashboard_data: %{user_info: %{display_name: name}}}})
       when is_binary(name),
       do: name

  defp get_display_name(_s) do
    "User"
  end

  defp get_joined_date(%{user_info: %{joined_at: joined_at}}) when not is_nil(joined_at) do
    DateTime.to_date(joined_at)
  end

  defp get_joined_date(_), do: Date.utc_today()

  def render(assigns) do
    # Provide fallback data if dashboard_data is nil
    dashboard_data =
      assigns[:dashboard_data] ||
        %{
          user_info: %{joined_at: DateTime.utc_now()},
          metrics: [],
          usage: %{hours_used: 0, hours_limit: 0},
          quick_actions: []
        }

    assigns = assign(assigns, :dashboard_data, dashboard_data)

    ~H"""
    <.dashboard_layout {assigns} current_page="dashboard" page_title="Dashboard">
      <div class="max-w-7xl mx-auto">
        <!-- Welcome Card -->
        <.dashboard_card
          title={
            get_welcome_message(
              @display_name,
              get_joined_date(@dashboard_data)
            )
          }
          class="mb-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <StreampaiWeb.Components.DashboardComponents.icon name="clock" class="w-4 h-4" />
              <span>Last login: {Date.utc_today()}</span>
            </div>
          </div>
          <p class="text-gray-600">
            {@greeting_text}
          </p>
        </.dashboard_card>
        <!-- Metrics Cards -->
        <div
          :if={@dashboard_data.metrics && length(@dashboard_data.metrics) > 0}
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        >
          <%= for metric <- @dashboard_data.metrics do %>
            <.metric_card
              title={metric.title}
              value={metric.value}
              change={metric.change}
              change_type={metric.change_type}
              icon={metric.icon}
              description={metric.description}
            />
          <% end %>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <.dashboard_card title="Account Info" icon="user">
            <div class="space-y-3">
              <.info_row label="Email" value={@dashboard_data.user_info.email || "Not available"} />
              <.info_row label="User ID">
                <p class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {@dashboard_data.user_info.id || "N/A"}
                </p>
              </.info_row>
              <.info_row label="Plan">
                <.status_badge status="success">
                  {case Map.get(@current_user, :tier) do
                    :pro -> "Pro (Unlimited hours/month)"
                    :free -> "Free (#{Streampai.Constants.free_tier_hour_limit()} hours/month)"
                    _ -> "Free (#{Streampai.Constants.free_tier_hour_limit()} hours/month)"
                  end}
                </.status_badge>
              </.info_row>
            </div>
          </.dashboard_card>
          <.dashboard_card title="Streaming Status" icon="activity">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Status</span>
                <.status_badge status="offline">Offline</.status_badge>
              </div>
              <.info_row
                label="Connected Platforms"
                value={to_string(Map.get(@current_user || %{}, :connected_platforms, 0))}
              />
              <.info_row label="Hours Used">
                <span class="text-sm font-medium">
                  {Map.get(@dashboard_data, :usage, %{}) |> Map.get(:hours_used, 0)} / {case Map.get(
                                                                                               @current_user ||
                                                                                                 %{},
                                                                                               :tier
                                                                                             ) do
                    :pro -> "∞"
                    :free -> Map.get(@dashboard_data, :usage, %{}) |> Map.get(:hours_limit, 0)
                    _ -> Map.get(@dashboard_data, :usage, %{}) |> Map.get(:hours_limit, 0)
                  end}
                </span>
              </.info_row>
            </div>
          </.dashboard_card>
          <.dashboard_card title="Quick Actions" icon="lightning">
            <div class="space-y-3">
              <%= for action <- Map.get(@dashboard_data, :quick_actions, []) do %>
                <a
                  href={action.url}
                  class="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <div class={"w-8 h-8 bg-#{action.color}-500 rounded flex items-center justify-center"}>
                      <span class="text-white text-xs">★</span>
                    </div>
                    <div>
                      <p class="font-medium text-sm">{action.name}</p>
                      <p class="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </a>
              <% end %>
            </div>
          </.dashboard_card>
        </div>
        {debug_section(assigns)}
      </div>
    </.dashboard_layout>
    """
  end

  defp get_welcome_message(display_name, joined_date) do
    today = Date.utc_today()
    same_day = Date.compare(joined_date, today) == :eq

    if same_day do
      "Welcome, #{display_name}! Great to have you here :-)"
    else
      "Welcome back, #{display_name}!"
    end
  end

  if Application.compile_env(:streampai, :env) != :prod do
    defp debug_section(assigns) do
      ~H"""
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 class="text-sm font-medium text-yellow-800 mb-2">Debug Info (Development Only)</h3>
        <details>
          <summary class="cursor-pointer text-xs text-yellow-700">Current User Data</summary>
          <pre class="text-xs text-yellow-700 overflow-x-auto mt-2"><%= inspect(@current_user, pretty: true, limit: :infinity) %></pre>
        </details>
        <details class="mt-2">
          <summary class="cursor-pointer text-xs text-yellow-700">Dashboard Data</summary>
          <pre class="text-xs text-yellow-700 overflow-x-auto mt-2"><%= inspect(@dashboard_data, pretty: true, limit: :infinity) %></pre>
        </details>
      </div>
      """
    end
  else
    defp debug_section(_assigns), do: ""
  end
end
