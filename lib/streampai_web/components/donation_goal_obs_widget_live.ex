defmodule StreampaiWeb.Components.DonationGoalObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone donation goal widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Subscribes to real donation events and configuration changes.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Accounts.WidgetConfigDefaults
  alias StreampaiWeb.Utils.IdUtils
  alias StreampaiWeb.Utils.WidgetHelpers

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    if is_nil(user_id) do
      raise "user_id is required for donation goal widget display"
    end

    if connected?(socket) do
      # Subscribe to config updates
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(:donation_goal_widget, user_id)
      )

      # Subscribe to real donation events
      subscribe_to_donation_events(user_id)
    end

    # Load configuration
    config =
      case WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :donation_goal_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:error, _} ->
          WidgetConfigDefaults.get_default_config(:donation_goal_widget)
      end

    # Get current donation total from database or cache
    current_amount = get_current_donation_total(user_id, config)

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> assign(:current_amount, current_amount)
      |> assign(:last_donation, nil)

    {:ok, socket, layout: false}
  end

  defp subscribe_to_donation_events(user_id) do
    # Subscribe to donation events for this user
    Phoenix.PubSub.subscribe(Streampai.PubSub, "donations:#{user_id}")
  end

  defp get_current_donation_total(_user_id, config) do
    # In a real implementation, this would query the database for actual donations
    # For now, we'll use the starting amount from config
    # You would implement something like:
    # Streampai.Donations.get_total_for_period(user_id, config.start_date, config.end_date)
    config.starting_amount || 0
  end

  # Handle configuration updates
  def handle_info(%{config: new_config, type: type}, socket) when type == :donation_goal_widget do
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  def handle_info(%{config: _config, type: _other_type}, socket) do
    {:noreply, socket}
  end

  # Handle real donation events
  def handle_info({:new_donation, donation_event}, socket) do
    # Transform the donation event to match our expected format
    donation = %{
      id: donation_event.id || generate_event_id(),
      amount: donation_event.amount,
      currency: donation_event.currency || socket.assigns.widget_config.currency,
      username: donation_event.donor_name || donation_event.username || "Anonymous",
      message: donation_event.message,
      timestamp: donation_event.timestamp || DateTime.utc_now()
    }

    # Update current amount
    new_amount = socket.assigns.current_amount + donation.amount

    {:noreply,
     socket
     |> assign(:current_amount, new_amount)
     |> assign(:last_donation, donation)}
  end

  # Handle donation events from the alertbox system
  def handle_info({:alert_event, %{type: :donation} = event}, socket) do
    donation = %{
      id: Map.get(event, :id, generate_event_id()),
      amount: event.amount,
      currency: Map.get(event, :currency, socket.assigns.widget_config.currency),
      username: Map.get(event, :username, "Anonymous"),
      message: Map.get(event, :message),
      timestamp: Map.get(event, :timestamp, DateTime.utc_now())
    }

    # Update current amount
    new_amount = socket.assigns.current_amount + donation.amount

    {:noreply,
     socket
     |> assign(:current_amount, new_amount)
     |> assign(:last_donation, donation)}
  end

  # Ignore non-donation alert events
  def handle_info({:alert_event, _event}, socket) do
    {:noreply, socket}
  end

  # Handle any other messages
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  defp generate_event_id, do: IdUtils.generate_event_id()

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent p-4">
      <.vue
        v-component="DonationGoalWidget"
        v-socket={@socket}
        config={@widget_config}
        currentAmount={@current_amount}
        donation={@last_donation}
        class="w-full h-auto"
        id="live-donation-goal-widget"
      />
    </div>
    """
  end
end
