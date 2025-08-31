defmodule StreampaiWeb.AnalyticsLive do
  @moduledoc """
  Analytics LiveView displaying streaming metrics and performance data.
  """
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    # TODO: Load actual analytics data when available
    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="analytics" page_title="Analytics">
      <div class="max-w-7xl mx-auto">
        <.vue
    count={2}
    v-component="Counter"
    v-socket={@socket}
    v-on:inc={JS.push("inc")}
    />

        <.empty_state
          icon="chart-bar"
          title="Analytics Dashboard"
          message="Stream analytics and insights will appear here once you start streaming."
        />
      </div>
    </.dashboard_layout>
    """
  end
end
