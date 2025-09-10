defmodule StreampaiWeb.DashboardPatreonsLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    {:ok, assign(socket, :page_title, "Patreons"), layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="patreons" page_title="Patreons">
      <.coming_soon_placeholder
        title="Patreon Management"
        description="Manage your supporters from multiple platforms in one unified dashboard. Track subscriptions, donations, and engagement across YouTube, Twitch and other platforms."
      />
    </.dashboard_layout>
    """
  end
end
