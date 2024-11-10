defmodule StreampaiWeb.DashboardAnalyticsLive do
  @moduledoc """
  Analytics LiveView displaying streaming metrics and performance data.
  """
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    {:ok, socket |> assign(:page_title, "Analytics"), layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="analytics" page_title="Analytics">
      <.coming_soon_placeholder
        title="Advanced Analytics"
        description="Detailed streaming analytics, performance metrics, audience insights, and revenue tracking across all your connected platforms."
      />
    </.dashboard_layout>
    """
  end
end
