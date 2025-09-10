defmodule StreampaiWeb.Components.AlertboxObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone alertbox widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own event state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    if is_nil(user_id) do
      raise "user_id is required for alertbox widget display"
    end

    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        StreampaiWeb.Utils.WidgetHelpers.widget_config_topic(:alertbox_widget, user_id)
      )

      subscribe_to_real_events(user_id)
    end

    # Load widget configuration with default fallback
    config =
      case Streampai.Accounts.WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :alertbox_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:error, _} ->
          # Use default config if none exists
          %{
            animation_type: "slide_in",
            display_duration: 5,
            sound_enabled: true,
            font_size: "medium"
          }
      end

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> initialize_display_assigns()

    {:ok, socket, layout: false}
  end

  defp initialize_display_assigns(socket) do
    socket
    |> assign(:current_event, nil)
  end

  defp subscribe_to_real_events(user_id) do
    # Subscribe to AlertQueue events instead of direct channel events
    Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")
  end

  defp handle_real_event(socket, {:alert_event, event}) do
    # Transform AlertQueue event to widget format
    alert_event = transform_alert_event(event)
    {:noreply, assign(socket, :current_event, alert_event)}
  end

  defp handle_real_event(socket, _event_data) do
    # Handle other real events here
    {:noreply, socket}
  end

  # Handle config updates from PubSub
  def handle_info(%{config: new_config, type: type}, socket) when type == :alertbox_widget do
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  # Ignore other widget types
  def handle_info(%{config: _config, type: _other_type}, socket) do
    {:noreply, socket}
  end

  # Handle AlertQueue events from PubSub
  def handle_info({:alert_event, event}, socket) do
    handle_real_event(socket, {:alert_event, event})
  end

  # Legacy support for direct donation events (for backward compatibility)
  def handle_info({:new_alert, donation_event}, socket) do
    # Transform legacy format to AlertQueue format
    event = %{
      type: :donation,
      username: donation_event.donor_name,
      message: donation_event.message,
      amount: donation_event.amount,
      currency: donation_event.currency,
      timestamp: donation_event.timestamp
    }

    handle_real_event(socket, {:alert_event, event})
  end

  # Handle other messages
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  # Transform AlertQueue event to widget display format
  defp transform_alert_event(event) do
    %{
      id: :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase(),
      type: event.type,
      username: Map.get(event, :username, "Unknown"),
      message: Map.get(event, :message, ""),
      amount: Map.get(event, :amount),
      currency: Map.get(event, :currency, "USD"),
      bits: Map.get(event, :bits),
      months: Map.get(event, :months),
      tier: Map.get(event, :tier),
      viewer_count: Map.get(event, :viewer_count),
      timestamp: Map.get(event, :timestamp, DateTime.utc_now()),
      platform: get_platform_info(event),
      display_time: get_display_duration(event)
    }
  end

  # Get platform-specific display information
  defp get_platform_info(event) do
    case Map.get(event, :platform, :twitch) do
      :twitch -> %{icon: "twitch", color: "bg-purple-600"}
      :youtube -> %{icon: "youtube", color: "bg-red-600"}
      :facebook -> %{icon: "facebook", color: "bg-blue-600"}
      :kick -> %{icon: "kick", color: "bg-green-600"}
      _ -> %{icon: "default", color: "bg-gray-600"}
    end
  end

  defp get_display_duration(event) do
    case event.type do
      :donation -> get_donation_duration(event)
      :raid -> get_raid_duration(event)
      :cheer -> get_cheer_duration(event)
      :subscription -> 5
      :follow -> 3
      _ -> 4
    end
  end

  defp get_donation_duration(event) do
    amount = Map.get(event, :amount)

    cond do
      is_number(amount) and amount >= 50 -> 8
      is_number(amount) and amount >= 10 -> 6
      true -> 4
    end
  end

  defp get_raid_duration(event) do
    viewer_count = Map.get(event, :viewer_count)

    if is_number(viewer_count) and viewer_count >= 10 do
      6
    else
      4
    end
  end

  defp get_cheer_duration(event) do
    bits = Map.get(event, :bits)

    if is_number(bits) and bits >= 100 do
      4
    else
      3
    end
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
