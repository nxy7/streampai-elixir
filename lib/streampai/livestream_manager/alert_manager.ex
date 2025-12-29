defmodule Streampai.LivestreamManager.AlertManager do
  @moduledoc """
  Processes and manages alerts for a user's livestream.
  Receives events from EventBroadcaster and formats them for alertbox widgets.
  Uses Phoenix.Sync.Shape to sync widget configuration in real-time.
  """
  use GenServer

  import Ecto.Query

  alias Phoenix.Sync.Shape
  alias Streampai.Accounts.WidgetConfig

  require Logger

  defstruct [
    :user_id,
    :alert_queue,
    :current_alert,
    :alert_settings,
    :config_shape_ref,
    :config_shape_pid
  ]

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "user_stream:#{user_id}:events")

    config_query =
      from(wc in WidgetConfig,
        where: wc.user_id == ^user_id and wc.type == ^:alertbox_widget
      )

    {shape_pid, shape_ref} =
      case Shape.start_link(config_query) do
        {:ok, pid} ->
          {pid, Shape.subscribe(pid)}

        {:error, reason} ->
          Logger.warning("AlertManager failed to start shape for user #{user_id}: #{inspect(reason)}")

          {nil, nil}
      end

    state = %__MODULE__{
      user_id: user_id,
      alert_queue: :queue.new(),
      current_alert: nil,
      alert_settings: load_alert_settings(user_id),
      config_shape_ref: shape_ref,
      config_shape_pid: shape_pid
    }

    Logger.info("AlertManager started for user #{user_id}")
    {:ok, state}
  end

  @doc "Gets the current alert being displayed."
  def get_current_alert(server) do
    GenServer.call(server, :get_current_alert)
  end

  @doc "Updates alert settings for the user."
  def update_alert_settings(server, settings) do
    GenServer.cast(server, {:update_alert_settings, settings})
  end

  @doc "Manually triggers an alert (for testing purposes)."
  def trigger_test_alert(server, alert_type) do
    GenServer.cast(server, {:trigger_test_alert, alert_type})
  end

  @impl true
  def handle_info({:stream_event, event}, state) do
    if should_create_alert?(event, state.alert_settings) do
      alert = create_alert_from_event(event, state.alert_settings)
      state = enqueue_alert(state, alert)

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
    state = %{state | current_alert: nil}
    state = process_next_alert(state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:sync, ref, {operation, {_key, widget_config}}}, state)
      when operation in [:insert, :update] and ref == state.config_shape_ref do
    new_settings = extract_alert_settings(widget_config.config)
    Logger.debug("AlertManager received config sync update for user #{state.user_id}")
    {:noreply, %{state | alert_settings: new_settings}}
  end

  @impl true
  def handle_info({:sync, ref, {:delete, _data}}, state) when ref == state.config_shape_ref do
    Logger.debug("AlertManager widget config deleted for user #{state.user_id}, resetting to defaults")

    {:noreply, %{state | alert_settings: default_alert_settings()}}
  end

  @impl true
  def handle_info({:sync, ref, control}, state)
      when ref == state.config_shape_ref and control in [:up_to_date, :must_refetch] do
    Logger.debug("AlertManager sync control: #{control} for user #{state.user_id}")
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_current_alert, _from, state) do
    {:reply, state.current_alert, state}
  end

  @impl true
  def handle_cast({:update_alert_settings, settings}, state) do
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

  @impl true
  def terminate(_reason, state) do
    if state.config_shape_pid && Process.alive?(state.config_shape_pid) do
      GenServer.stop(state.config_shape_pid, :normal, 5000)
    end

    :ok
  end

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_manager, user_id}}}
  end

  defp load_alert_settings(user_id) do
    case WidgetConfig.get_by_user_and_type(
           %{user_id: user_id, type: :alertbox_widget},
           actor: %{id: user_id}
         ) do
      {:ok, %{config: config}} ->
        extract_alert_settings(config)

      _ ->
        default_alert_settings()
    end
  end

  defp extract_alert_settings(config) when is_map(config) do
    defaults = default_alert_settings()

    %{
      donations_enabled: get_config_value(config, :donations_enabled, defaults.donations_enabled),
      donations_min_amount: get_config_value(config, :donations_min_amount, defaults.donations_min_amount),
      follows_enabled: get_config_value(config, :follows_enabled, defaults.follows_enabled),
      subscriptions_enabled: get_config_value(config, :subscriptions_enabled, defaults.subscriptions_enabled),
      raids_enabled: get_config_value(config, :raids_enabled, defaults.raids_enabled),
      raids_min_viewers: get_config_value(config, :raids_min_viewers, defaults.raids_min_viewers),
      alert_duration: get_config_value(config, :display_duration, defaults.alert_duration)
    }
  end

  defp get_config_value(config, key, default) when is_atom(key) do
    case Map.get(config, key) do
      nil -> Map.get(config, Atom.to_string(key), default)
      value -> value
    end
  end

  defp default_alert_settings do
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
        settings.donations_enabled and event.amount >= settings.donations_min_amount

      :follow ->
        settings.follows_enabled

      :subscription ->
        settings.subscriptions_enabled

      :raid ->
        settings.raids_enabled and event.viewer_count >= settings.raids_min_viewers

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
        Phoenix.PubSub.broadcast(
          Streampai.PubSub,
          "widget_events:#{state.user_id}:alertbox",
          {:widget_event, alert}
        )

        Process.send_after(self(), :alert_finished, alert.display_time * 1000)

        %{state | current_alert: alert, alert_queue: remaining_queue}

      {:empty, _} ->
        state
    end
  end

  defp generate_alert_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode16(case: :lower)
  end
end
