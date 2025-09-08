defmodule StreampaiWeb.Components.AlertboxObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone alertbox widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own event state and subscribes to configuration changes.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :display,
    widget_type: :alertbox_widget

  defp initialize_display_assigns(socket) do
    socket
    |> assign(:current_event, nil)
  end

  defp subscribe_to_real_events(user_id) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")
  end

  defp handle_real_event(socket, {:new_alert, donation_event}) do
    alert_event = %{
      id: :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase(),
      type: :donation,
      username: donation_event.donor_name,
      message: donation_event.message,
      amount: donation_event.amount,
      currency: donation_event.currency,
      timestamp: donation_event.timestamp,
      platform: %{
        icon: "twitch",
        color: "bg-purple-600"
      },
      display_time: 5
    }

    {:noreply, assign(socket, :current_event, alert_event)}
  end

  defp handle_real_event(socket, _event_data) do
    # Handle other real events here
    {:noreply, socket}
  end

  # Handle real donation events from PubSub
  def handle_info({:new_alert, donation_event}, socket) do
    handle_real_event(socket, {:new_alert, donation_event})
  end

  # Handle config updates from PubSub
  def handle_info(%{config: new_config, type: type}, socket) when type == :alertbox_widget do
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  # Ignore other widget types
  def handle_info(%{config: _config, type: _other_type}, socket) do
    {:noreply, socket}
  end

  # Handle other messages
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent">
      <.vue
        v-component="AlertboxWidget"
        v-socket={@socket}
        config={@widget_config}
        event={@current_event}
        class="w-full h-full"
        id="live-alertbox-widget"
      />
    </div>
    """
  end
end
