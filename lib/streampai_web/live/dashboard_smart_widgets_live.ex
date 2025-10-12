defmodule StreampaiWeb.DashboardSmartWidgetsLive do
  @moduledoc """
  Smart Widgets page - Interactive canvas for composing widget layouts
  """
  use StreampaiWeb.BaseLive

  alias Streampai.Accounts.SmartWidgetLayout

  @impl true
  def mount(_params, _session, socket) do
    user = socket.assigns.current_user

    widgets =
      SmartWidgetLayout
      |> Ash.Query.for_read(:get_by_user, %{user_id: user.id}, actor: user)
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
     |> assign(page_title: "Smart Widgets", current_page: "smart-widgets")
     |> assign(widgets: widgets)
     |> assign(layout_saved: true), layout: false}
  end

  defp atomize_widget_keys(widget) when is_map(widget) do
    %{
      id: widget["id"] || widget[:id],
      type: widget["type"] || widget[:type],
      x: widget["x"] || widget[:x],
      y: widget["y"] || widget[:y]
    }
  end

  @impl true
  def render(assigns) do
    ~H"""
    <style>
      .placeholder-widget:hover .delete-widget-btn {
        opacity: 1 !important;
      }
    </style>
    <.dashboard_layout
      current_user={@current_user}
      current_page={@current_page}
      page_title={@page_title}
    >
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Smart Widgets Canvas</h2>
          <p class="text-gray-600">
            Compose your stream overlay with interactive widgets. Add multiple widgets and position them as needed.
          </p>
        </div>
        <!-- OBS URL -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <svg
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 mb-1">OBS Browser Source URL</h3>
              <p class="text-sm text-gray-600 mb-2">
                Copy this URL and add it as a Browser Source in OBS to display your Smart Widgets:
              </p>
              <div class="flex gap-2">
                <input
                  type="text"
                  readonly
                  value={"#{StreampaiWeb.Endpoint.url()}/widgets/smart-widgets/display?user_id=#{@current_user.id}"}
                  class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white font-mono"
                  id="obs-url-input"
                />
                <button
                  phx-hook="CopyToClipboard"
                  data-clipboard-text={"#{StreampaiWeb.Endpoint.url()}/widgets/smart-widgets/display?user_id=#{@current_user.id}"}
                  data-clipboard-message="OBS URL copied to clipboard!"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  id="copy-obs-url-btn"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
        
    <!-- Controls -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <button
                phx-click="add_widget"
                phx-value-type="placeholder"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                id="add-widget-btn"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Widget
              </button>
              <button
                phx-click="save_layout"
                class={"px-4 py-2 rounded-lg transition-colors flex items-center gap-2 #{if @layout_saved, do: "bg-green-600 text-white", else: "bg-blue-600 text-white hover:bg-blue-700"}"}
                id="save-layout-btn"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                {if @layout_saved, do: "Layout Saved", else: "Save Layout"}
              </button>
              <button
                phx-click="clear_widgets"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                id="clear-widgets-btn"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear All
              </button>
            </div>
            <div class="text-sm text-gray-600" id="widget-count">
              Widgets: {length(@widgets)}
            </div>
          </div>
        </div>
        
    <!-- Canvas -->
        <div class="bg-gray-900 rounded-lg shadow-lg p-4">
          <div class="widget-canvas-container" id="widget-canvas">
            <div
              phx-hook="CanvasContextMenu"
              id="canvas-area"
              class="widget-canvas"
              style="aspect-ratio: 16 / 9; max-width: 100%; margin: 0 auto; position: relative; background: #0f0f0f; border: 2px solid #333; border-radius: 0.375rem; overflow: hidden;"
            >
              <div
                phx-hook="WidgetConnections"
                id="canvas-grid"
                class="canvas-grid"
                style="position: relative; width: 100%; height: 100%; min-height: 400px;"
              >
                <!-- Grid overlay -->
                <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 0;">
                </div>
                <!-- Connection lines between widgets (managed by JavaScript) -->
                <svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
                </svg>
                
    <!-- Render widgets -->
                <%= for widget <- @widgets do %>
                  <div
                    phx-hook="DraggableWidget"
                    data-widget-id={widget.id}
                    id={"widget-#{widget.id}"}
                    class="placeholder-widget group"
                    style={"position: absolute; left: #{widget.x}px; top: #{widget.y}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; padding: 1rem; min-width: 200px; min-height: 120px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); cursor: move; user-select: none;"}
                  >
                    <div
                      class="widget-header"
                      style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: white; position: relative;"
                    >
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
                      <button
                        phx-click="delete_widget"
                        phx-value-id={widget.id}
                        class="delete-widget-btn"
                        style="position: absolute; right: -0.5rem; top: -0.5rem; background: #ef4444; color: white; border-radius: 9999px; width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; cursor: pointer; border: 2px solid white;"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div style="background: rgba(0, 0, 0, 0.2); border-radius: 0.375rem; padding: 0.5rem;">
                      <p style="font-size: 0.75rem; color: #9ca3af;">ID: {widget.id}</p>
                      <p style="font-size: 0.75rem; color: #9ca3af;">
                        Position: ({widget.x}, {widget.y})
                      </p>
                    </div>
                  </div>
                <% end %>
                
    <!-- Empty state -->
                <%= if length(@widgets) == 0 do %>
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1;">
                    <svg
                      class="w-16 h-16 mx-auto mb-4"
                      style="color: #9ca3af;"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    <h3 style="font-size: 1.125rem; font-weight: 500; color: #d1d5db; margin-bottom: 0.5rem;">
                      No Widgets Yet
                    </h3>
                    <p style="font-size: 0.875rem; color: #9ca3af;">
                      Click "Add Widget" above to start building your overlay
                    </p>
                  </div>
                <% end %>
              </div>
              
    <!-- Canvas info overlay -->
              <div style="position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(0, 0, 0, 0.7); padding: 0.25rem 0.5rem; border-radius: 0.25rem; z-index: 10;">
                <span style="font-size: 0.75rem; color: #9ca3af;">1920x1080 (16:9)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Context Menu -->
      <div
        id="widget-context-menu"
        class="hidden fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
        style="min-width: 200px;"
      >
        <button
          phx-hook="ContextMenuButton"
          id="context-menu-add-widget"
          class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Widget Here
        </button>
      </div>
    </.dashboard_layout>
    """
  end

  @impl true
  def handle_event("add_widget", %{"type" => type}, socket) do
    new_widget = %{
      id: "widget-#{:rand.uniform(100_000)}",
      type: type,
      x: :rand.uniform(400),
      y: :rand.uniform(200)
    }

    {:noreply,
     socket
     |> assign(widgets: [new_widget | socket.assigns.widgets])
     |> assign(layout_saved: false)}
  end

  def handle_event("add_widget_at_position", %{"x" => x, "y" => y}, socket) do
    new_widget = %{
      id: "widget-#{:rand.uniform(100_000)}",
      type: "placeholder",
      x: x,
      y: y
    }

    {:noreply,
     socket
     |> assign(widgets: [new_widget | socket.assigns.widgets])
     |> assign(layout_saved: false)}
  end

  def handle_event("clear_widgets", _params, socket) do
    {:noreply,
     socket
     |> assign(widgets: [])
     |> assign(layout_saved: false)}
  end

  def handle_event("delete_widget", %{"id" => widget_id}, socket) do
    widgets = Enum.reject(socket.assigns.widgets, fn w -> w.id == widget_id end)

    {:noreply,
     socket
     |> assign(widgets: widgets)
     |> assign(layout_saved: false)}
  end

  def handle_event("update_widget_position", %{"id" => widget_id, "x" => x, "y" => y}, socket) do
    widgets =
      Enum.map(socket.assigns.widgets, fn widget ->
        if widget.id == widget_id do
          %{widget | x: x, y: y}
        else
          widget
        end
      end)

    {:noreply,
     socket
     |> assign(widgets: widgets)
     |> assign(layout_saved: false)}
  end

  def handle_event("save_layout", _params, socket) do
    require Logger

    user = socket.assigns.current_user
    widgets = socket.assigns.widgets

    Logger.info("Saving layout for user #{user.id} with #{length(widgets)} widgets")
    Logger.debug("Widgets: #{inspect(widgets)}")

    case SmartWidgetLayout.create(
           %{user_id: user.id, widgets: widgets},
           actor: user
         ) do
      {:ok, layout} ->
        Logger.info("Layout saved successfully: #{layout.id}")

        Phoenix.PubSub.broadcast(
          Streampai.PubSub,
          "smart_widgets:#{user.id}",
          {:layout_updated, widgets}
        )

        {:noreply, assign(socket, layout_saved: true)}

      {:error, error} ->
        Logger.error("Failed to save layout: #{inspect(error)}")
        {:noreply, socket}
    end
  end
end
