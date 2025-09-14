defmodule StreampaiWeb.Components.TopDonorsObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone top donors widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Subscribes to real donation events and configuration changes.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Fake.TopDonors
  alias StreampaiWeb.Utils.WidgetHelpers

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    if is_nil(user_id) do
      raise "user_id is required for top donors widget display"
    end

    if connected?(socket) do
      # Subscribe to config updates
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(:top_donors_widget, user_id)
      )

      # Subscribe to real donation events to update rankings
      subscribe_to_donation_events(user_id)

      # For demo purposes, generate periodic updates to show the animation
      schedule_demo_update()
    end

    # Load configuration
    config =
      case WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :top_donors_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:error, _} ->
          TopDonors.default_config()
      end

    # Get current top donors from database or generate demo data
    donors = get_current_top_donors(user_id, config)

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> assign(:donors, donors)

    {:ok, socket, layout: false}
  end

  defp subscribe_to_donation_events(user_id) do
    # Subscribe to donation events for this user
    Phoenix.PubSub.subscribe(Streampai.PubSub, "donations:#{user_id}")
  end

  defp get_current_top_donors(_user_id, _config) do
    # In a real implementation, this would query the database for actual top donors
    # For now, we'll generate demo data to show the widget functionality
    # You would implement something like:
    # Streampai.Donations.get_top_donors(user_id, limit: config.display_count)
    TopDonors.generate_top_donors_list(20)
  end

  defp schedule_demo_update do
    # Schedule demo updates every 15-20 seconds to show animations
    delay = Enum.random(15_000..20_000)
    Process.send_after(self(), :demo_update, delay)
  end

  # Handle configuration updates
  def handle_info(%{config: new_config, type: type}, socket) when type == :top_donors_widget do
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  def handle_info(%{config: _config, type: _other_type}, socket) do
    {:noreply, socket}
  end

  # Handle real donation events
  def handle_info({:new_donation, _donation_event}, socket) do
    # In a real implementation, this would update the top donors ranking
    # based on the new donation. For demo purposes, we'll regenerate the list.
    new_donors = get_current_top_donors(socket.assigns.user_id, socket.assigns.widget_config)
    {:noreply, assign(socket, :donors, new_donors)}
  end

  # Handle donation events from the alertbox system
  def handle_info({:alert_event, %{type: :donation} = _event}, socket) do
    # Update the top donors list when a new donation comes in
    new_donors = get_current_top_donors(socket.assigns.user_id, socket.assigns.widget_config)
    {:noreply, assign(socket, :donors, new_donors)}
  end

  # Ignore non-donation alert events
  def handle_info({:alert_event, _event}, socket) do
    {:noreply, socket}
  end

  # Handle demo updates
  def handle_info(:demo_update, socket) do
    # Generate new shuffled donors list for demo animation, passing current list for realistic updates
    current_donors = socket.assigns.donors
    new_donors = TopDonors.generate_shuffled_top_donors(current_donors, 20)

    # Schedule next demo update
    schedule_demo_update()

    {:noreply, assign(socket, :donors, new_donors)}
  end

  # Handle any other messages
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="min-h-screen w-screen bg-transparent p-4 flex items-start">
      <.vue
        v-component="TopDonorsWidget"
        v-socket={@socket}
        config={@widget_config}
        donors={Enum.slice(@donors, 0, @widget_config.display_count || 10)}
        class="w-full max-w-md"
        id="live-top-donors-widget"
      />
    </div>
    """
  end
end
