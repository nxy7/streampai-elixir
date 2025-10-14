defmodule StreampaiWeb.Components.SmartCanvasObsLive do
  @moduledoc """
  LiveView for displaying the Smart Canvas for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Displays widgets in their configured positions on a transparent 16:9 canvas.
  """
  use StreampaiWeb, :live_view

  def mount(%{"user_id" => user_id}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        "smart_canvas:#{user_id}"
      )
    end

    widgets =
      Streampai.Accounts.SmartCanvasLayout
      |> Ash.Query.for_read(:get_by_user, %{user_id: user_id}, authorize?: false)
      |> Ash.read_one()
      |> case do
        {:ok, layout} when not is_nil(layout) ->
          # Convert string keys to atom keys for widgets loaded from DB
          Enum.map(layout.widgets, &atomize_widget_keys/1)

        _ ->
          []
      end

    {:ok,
     socket
     |> assign(:user_id, user_id)
     |> assign(:widgets, widgets), layout: {StreampaiWeb.Layouts, :widget}}
  end

  defp atomize_widget_keys(widget) when is_map(widget) do
    %{
      id: widget["id"] || widget[:id],
      type: widget["type"] || widget[:type],
      x: widget["x"] || widget[:x],
      y: widget["y"] || widget[:y]
    }
  end

  def handle_info({:layout_updated, widgets}, socket) do
    # Also atomize keys for real-time updates
    atomized_widgets = Enum.map(widgets, &atomize_widget_keys/1)
    {:noreply, assign(socket, :widgets, atomized_widgets)}
  end

  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    </style>
    <div
      class="widget-canvas"
      style="position: absolute; inset: 0; width: 100vw; height: 100vh; background: transparent;"
    >
      <%= for widget <- @widgets do %>
        <div
          class="placeholder-widget"
          style={"position: absolute; left: #{widget.x}px; top: #{widget.y}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; padding: 1rem; min-width: 200px; min-height: 120px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);"}
        >
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: white;">
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.375rem; border-radius: 0.375rem;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <span style="font-size: 0.875rem; font-weight: 600;">Placeholder Widget</span>
          </div>
          <div style="background: rgba(0, 0, 0, 0.2); border-radius: 0.375rem; padding: 0.5rem;">
            <p style="font-size: 0.75rem; color: #9ca3af;">ID: {widget.id}</p>
            <p style="font-size: 0.75rem; color: #9ca3af;">
              Position: ({widget.x}, {widget.y})
            </p>
          </div>
        </div>
      <% end %>
    </div>
    """
  end
end
