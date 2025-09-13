defmodule StreampaiWeb.DashboardViewersLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  def mount_page(socket, _params, _session) do
    {:ok, assign(socket, :page_title, "Viewers"), layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="viewers" page_title="Viewers">
      <.coming_soon_placeholder
        title="Viewer Analytics"
        description="Track all interactions with specific real people across platforms. View unified profiles, chat history, donations, and engagement patterns for your community members."
      />
    </.dashboard_layout>
    """
  end
end
