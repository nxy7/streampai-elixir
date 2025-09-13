defmodule StreampaiWeb.DashboardStreamHistoryLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    {:ok, assign(socket, :page_title, "Stream History"), layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="stream-history" page_title="Stream History">
      <.coming_soon_placeholder
        title="Stream History"
        description="View your complete streaming history across all platforms. Browse past livestreams, analyze performance metrics, and track your streaming journey over time."
      />
    </.dashboard_layout>
    """
  end
end
