defmodule StreampaiWeb.Components.AlertboxObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone alertbox widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own event state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view
  alias Streampai.Fake.Alert

  @impl true
  def mount(%{"user_id" => user_id}, _session, socket) do
    initial_event =
      if connected?(socket) do
        # Generate initial event and start cycle
        event = Alert.generate_event()
        display_time = Enum.random(3..8)
        event_with_time = Map.put(event, :display_time, display_time)
        Process.send_after(self(), :hide_event, display_time * 1000)
        Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")
        # Subscribe to alertbox events for real donations
        Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")
        event_with_time
      else
        nil
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
     |> assign(:current_event, initial_event), layout: false}
  end

  @impl true
  def handle_info(:generate_event, socket) do
    new_event = Alert.generate_event()
    # Random display time between 3-8 seconds
    display_time = Enum.random(3..8)
    # 2 seconds gap between events
    _gap_time = 2

    # Add display_time to event
    event_with_display_time = Map.put(new_event, :display_time, display_time)

    # Add some debugging info
    IO.puts(
      "[OBS Widget] Generated new event: #{new_event.type} - #{new_event.username} (ID: #{new_event.id}) - Display time: #{display_time}s"
    )

    socket = assign(socket, :current_event, event_with_display_time)

    # Set event to nil 1 second after gap starts (display_time + 1)
    Process.send_after(self(), :hide_event, (display_time + 1) * 1000)
    {:noreply, socket}
  end

  def handle_info(:hide_event, socket) do
    IO.puts("[OBS Widget] Setting event to nil")
    socket = assign(socket, :current_event, nil)

    # Show next event after remaining 1 second of the gap
    Process.send_after(self(), :generate_event, 1000)
    {:noreply, socket}
  end

  # Handle real donation events from PubSub
  def handle_info({:new_alert, donation_event}, socket) do
    # Convert donation event to alertbox format
    alert_event = %{
      id: :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase(),
      type: donation_event.type,
      username: donation_event.donor_name,
      message: donation_event.message,
      amount: donation_event.amount,
      currency: donation_event.currency,
      timestamp: donation_event.timestamp,
      display_time: 5  # Fixed 5 seconds for real donations
    }
    
    IO.puts("[OBS Widget] Real donation received: #{donation_event.donor_name} - #{donation_event.currency} #{donation_event.amount}")
    
    # Clear any current event and show the donation immediately
    socket = assign(socket, :current_event, alert_event)
    
    # Hide event after display time
    Process.send_after(self(), :hide_event, alert_event.display_time * 1000)
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

  # Helper functions

  # defp _schedule_next_event do
  #   # 7 seconds between alerts for demo
  #   delay = 7000
  #   Process.send_after(self(), :generate_event, delay)
  # end
end
