defmodule StreampaiWeb.Components.AlertboxObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone alertbox widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own event state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view

  @impl true
  def mount(%{"user_id" => user_id}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")
      # Subscribe to alertbox events for real donations
      Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")
    end

    {:ok, %{config: config}} =
      Streampai.Accounts.WidgetConfig.get_by_user_and_type(%{
        user_id: user_id,
        type: :alertbox_widget
      })

    {:ok,
     socket
     |> assign(:user_id, user_id)
     |> assign(:widget_config, config)
     |> assign(:current_event, nil), layout: false}
  end


  # Handle real donation events from PubSub
  @impl true
  def handle_info({:new_alert, donation_event}, socket) do
    # Convert donation event to alertbox format
    alert_event = %{
      id: :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase(),
      type: String.to_existing_atom(donation_event.type),
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

    IO.puts(
      "[OBS Widget] Real donation received: #{donation_event.donor_name} - #{donation_event.currency} #{donation_event.amount}"
    )

    # Just set the current event - frontend will handle display timing
    socket = assign(socket, :current_event, alert_event)
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
        event={@current_event}
        class="w-full h-full"
        id="live-alertbox-widget"
      />
    </div>
    """
  end
end
