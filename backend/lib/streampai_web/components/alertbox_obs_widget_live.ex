defmodule StreampaiWeb.Components.AlertboxObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone alertbox widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own event state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view
  alias StreampaiWeb.Utils.FakeAlert

  @impl true
  def mount(%{"user_id" => user_id}, _session, socket) do
    if connected?(socket) do
      schedule_next_event()
      Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")
    end

    initial_events = FakeAlert.initial_events()

    {:ok, %{config: config}} =
      Streampai.Accounts.WidgetConfig.get_by_user_and_type(%{
        user_id: user_id,
        type: :alertbox_widget
      })

    {:ok,
     socket
     |> stream(:events, initial_events)
     |> assign(:user_id, user_id)
     |> assign(:widget_config, config)
     |> assign(:vue_events, initial_events), layout: false}
  end

  @impl true
  def handle_info(:generate_event, socket) do
    new_event = FakeAlert.generate_event()

    socket = stream_insert(socket, :events, new_event)

    current_vue_events = Map.get(socket.assigns, :vue_events, [])
    updated_vue_events = [new_event | current_vue_events]

    # Keep last 10 events for the widget
    limited_vue_events = Enum.take(updated_vue_events, 10)

    socket = assign(socket, :vue_events, limited_vue_events)

    schedule_next_event()
    {:noreply, socket}
  end

  # Handle widget config updates from PubSub
  def handle_info(%{config: new_config, type: :alertbox_widget}, socket) do
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  # Ignore other widget config updates
  def handle_info(%{config: _config, type: _other_type}, socket) do
    {:noreply, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent">
      <.vue
        v-component="AlertboxWidget"
        v-socket={@socket}
        config={@widget_config}
        events={@vue_events}
        class="w-full h-full"
        id="live-alertbox-widget"
      />
    </div>
    """
  end

  # Helper functions

  defp schedule_next_event do
    # 7 seconds between alerts for demo
    delay = 7000
    Process.send_after(self(), :generate_event, delay)
  end
end
