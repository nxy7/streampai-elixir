defmodule StreampaiWeb.WidgetLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  def mount(_params, _session, socket) do
    if connected?(socket) do
      :timer.send_interval(5000, self(), :update_dashboard)
    end

    {:ok, assign(socket, val: 10)}
  end

  def render(assigns) do
    ~H"""
    <div>elo <span>{@val}</span></div>

    <button phx-click="toggle">on</button>
    """
  end

  def handle_event("toggle", _, %{assigns: %{val: 0}} = socket) do
    {:noreply, assign(socket, val: 100)}
  end

  def handle_event("toggle", _, socket) do
    {:noreply, assign(socket, val: 0)}
  end
end
