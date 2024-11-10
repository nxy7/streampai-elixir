defmodule Streampai.LivestreamManager.AlertManager do
  @moduledoc """
  Processes and manages alerts for a user's livestream.
  Receives events from EventBroadcaster and formats them for alertbox widgets.
  """
  use GenServer
  require Logger

  defstruct [
    :user_id,
    # Queue of pending alerts
    :alert_queue,
    # Currently displayed alert
    :current_alert,
    # User's alert configuration
    :alert_settings
  ]

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    # Subscribe to events for this user
    Phoenix.PubSub.subscribe(Streampai.PubSub, "user_stream:#{user_id}:events")

    state = %__MODULE__{
      user_id: user_id,
      alert_queue: :queue.new(),
      current_alert: nil,
      alert_settings: load_alert_settings(user_id)
    }

    Logger.info("AlertManager started for user #{user_id}")
    {:ok, state}
  end

  # Client API

  @doc """
  Gets the current alert being displayed.
  """
  def get_current_alert(server) do
    GenServer.call(server, :get_current_alert)
  end

  @doc """
  Updates alert settings for the user.
  """
  def update_alert_settings(server, settings) do
    GenServer.cast(server, {:update_alert_settings, settings})
  end

  @doc """
  Manually triggers an alert (for testing purposes).
  """
  def trigger_test_alert(server, alert_type) do
    GenServer.cast(server, {:trigger_test_alert, alert_type})
  end

  # Server callbacks

  @impl true
  def handle_info({:stream_event, event}, state) do
    # Process stream events that should become alerts
    if should_create_alert?(event, state.alert_settings) do
      alert = create_alert_from_event(event, state.alert_settings)
      state = enqueue_alert(state, alert)

      # If no alert is currently displayed, process immediately
      new_state =
        if state.current_alert == nil do
          process_next_alert(state)
        else
          state
        end

      {:noreply, new_state}
    else
      {:noreply, state}
    end
  end

  @impl true
  def handle_info(:alert_finished, state) do
    # Current alert finished, process next one
    state = %{state | current_alert: nil}
    state = process_next_alert(state)
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_current_alert, _from, state) do
    {:reply, state.current_alert, state}
  end

  @impl true
  def handle_cast({:update_alert_settings, settings}, state) do
    # TODO: Validate and save settings to database
    state = %{state | alert_settings: Map.merge(state.alert_settings, settings)}
    {:noreply, state}
  end

  @impl true
  def handle_cast({:trigger_test_alert, alert_type}, state) do
    test_alert = create_test_alert(alert_type, state.user_id)
    state = enqueue_alert(state, test_alert)

    new_state =
      if state.current_alert == nil do
        process_next_alert(state)
      else
        state
      end

    {:noreply, new_state}
  end

  # Helper functions

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_manager, user_id}}}
  end

  defp load_alert_settings(_user_id) do
    # TODO: Load from WidgetConfig for alertbox_widget
    # For now, return default settings
    %{
      donations_enabled: true,
      donations_min_amount: 1.0,
      follows_enabled: true,
      subscriptions_enabled: true,
      raids_enabled: true,
      raids_min_viewers: 1,
      alert_duration: 7
    }
  end

  defp should_create_alert?(event, settings) do
    case event.type do
      :donation ->
        settings.donations_enabled and
          event.amount >= settings.donations_min_amount

      :follow ->
        settings.follows_enabled

      :subscription ->
        settings.subscriptions_enabled

      :raid ->
        settings.raids_enabled and
          event.viewer_count >= settings.raids_min_viewers

      _ ->
        false
    end
  end

  defp create_alert_from_event(event, settings) do
    base_alert = %{
      id: generate_alert_id(),
      type: event.type,
      username: event.username,
      platform: create_platform_info(event.platform),
      timestamp: event.timestamp || DateTime.utc_now(),
      display_time: settings.alert_duration
    }

    case event.type do
      :donation ->
        Map.merge(base_alert, %{
          amount: event.amount,
          currency: event.currency || "USD",
          message: event.message
        })

      :subscription ->
        Map.merge(base_alert, %{
          tier: event.tier || "Tier 1",
          message: event.message
        })

      :raid ->
        Map.merge(base_alert, %{
          viewer_count: event.viewer_count,
          message: "Raiding with #{event.viewer_count} viewers!"
        })

      :follow ->
        base_alert

      _ ->
        base_alert
    end
  end

  defp create_test_alert(alert_type, _user_id) do
    base_alert = %{
      id: generate_alert_id(),
      type: alert_type,
      username: "TestUser#{:rand.uniform(999)}",
      platform: create_platform_info(:twitch),
      timestamp: DateTime.utc_now(),
      display_time: 7
    }

    case alert_type do
      :donation ->
        Map.merge(base_alert, %{
          amount: 5.00 + :rand.uniform(45),
          currency: "USD",
          message: "Keep up the great work!"
        })

      :subscription ->
        Map.merge(base_alert, %{
          tier: "Tier 1",
          message: "Love the content!"
        })

      :raid ->
        Map.merge(base_alert, %{
          viewer_count: 50 + :rand.uniform(200),
          message: "Raiding with #{50 + :rand.uniform(200)} viewers!"
        })

      :follow ->
        base_alert

      _ ->
        base_alert
    end
  end

  defp create_platform_info(platform) do
    case platform do
      :twitch -> %{icon: "twitch", color: "#9146FF"}
      :youtube -> %{icon: "youtube", color: "#FF0000"}
      :facebook -> %{icon: "facebook", color: "#1877F2"}
      :kick -> %{icon: "kick", color: "#53FC18"}
      _ -> %{icon: "generic", color: "#6B7280"}
    end
  end

  defp enqueue_alert(state, alert) do
    queue = :queue.in(alert, state.alert_queue)
    %{state | alert_queue: queue}
  end

  defp process_next_alert(state) do
    case :queue.out(state.alert_queue) do
      {{:value, alert}, remaining_queue} ->
        # Send alert to alertbox widget
        Phoenix.PubSub.broadcast(
          Streampai.PubSub,
          "widget_events:#{state.user_id}:alertbox",
          {:widget_event, alert}
        )

        # Schedule alert finish
        Process.send_after(self(), :alert_finished, alert.display_time * 1000)

        %{state | current_alert: alert, alert_queue: remaining_queue}

      {:empty, _} ->
        state
    end
  end

  defp generate_alert_id do
    :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
  end
end
