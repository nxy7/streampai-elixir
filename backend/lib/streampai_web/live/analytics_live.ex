defmodule StreampaiWeb.AnalyticsLive do
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout

  def mount(_params, _session, socket) do
    {:ok, assign(socket, sidebar_expanded: true), layout: false}
  end

  def handle_event("toggle_sidebar", _params, socket) do
    {:noreply, assign(socket, sidebar_expanded: !socket.assigns.sidebar_expanded)}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout 
      current_user={@current_user} 
      sidebar_expanded={@sidebar_expanded}
      current_page="analytics"
      page_title="Analytics"
    >
      <div class="max-w-7xl mx-auto">
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">Analytics Dashboard</h3>
          <p class="mt-1 text-sm text-gray-500">Stream analytics and insights will appear here once you start streaming.</p>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end