defmodule Streampai.LivestreamManager.TimerManager do
  @moduledoc """
  Manages timer state and handles timer events for the timer widget.
  This GenServer maintains the timer state, handles extensions, and broadcasts updates.
  """
  use GenServer

  require Logger

  defstruct [
    :user_id,
    :current_time,
    :total_duration,
    :timer_ref,
    :is_running,
    :is_paused,
    :count_direction,
    :config,
    :start_time,
    :pause_time
  ]

  # Client API

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  def child_spec(user_id) do
    %{
      id: {:timer_manager, user_id},
      start: {__MODULE__, :start_link, [user_id]},
      restart: :temporary
    }
  end

  def start_timer(user_id, duration \\ nil) do
    GenServer.call(via_tuple(user_id), {:start_timer, duration})
  end

  def stop_timer(user_id) do
    GenServer.call(via_tuple(user_id), :stop_timer)
  end

  def pause_timer(user_id) do
    GenServer.call(via_tuple(user_id), :pause_timer)
  end

  def resume_timer(user_id) do
    GenServer.call(via_tuple(user_id), :resume_timer)
  end

  def reset_timer(user_id, duration \\ nil) do
    GenServer.call(via_tuple(user_id), {:reset_timer, duration})
  end

  def extend_timer(user_id, amount, username, source_type) do
    GenServer.call(via_tuple(user_id), {:extend_timer, amount, username, source_type})
  end

  def set_time(user_id, time) do
    GenServer.call(via_tuple(user_id), {:set_time, time})
  end

  def get_state(user_id) do
    try do
      GenServer.call(via_tuple(user_id), :get_state)
    catch
      :exit, {:noproc, _} ->
        # Return default state if process doesn't exist
        %{
          current_time: 300,
          total_duration: 300,
          is_running: false,
          is_paused: false,
          count_direction: "down"
        }
    end
  end

  def update_config(user_id, config) do
    GenServer.cast(via_tuple(user_id), {:update_config, config})
  end

  # Server callbacks

  @impl true
  def init(user_id) do
    # Subscribe to user stream events for automatic extensions
    Phoenix.PubSub.subscribe(Streampai.PubSub, "user_stream:#{user_id}:events")

    # Subscribe to timer config updates
    Phoenix.PubSub.subscribe(
      Streampai.PubSub,
      "widget_config:timer_widget:#{user_id}"
    )

    config = load_timer_config(user_id)

    state = %__MODULE__{
      user_id: user_id,
      current_time: 0,
      total_duration: config[:initial_duration] || 300,
      timer_ref: nil,
      is_running: false,
      is_paused: false,
      count_direction: config[:count_direction] || "down",
      config: config,
      start_time: nil,
      pause_time: nil
    }

    Logger.info("TimerManager started for user #{user_id}")
    {:ok, state}
  end

  @impl true
  def handle_call({:start_timer, duration}, _from, state) do
    new_duration = duration || state.config[:initial_duration] || state.total_duration

    state = cancel_timer(state)

    new_state = %{state |
      total_duration: new_duration,
      current_time: if(state.count_direction == "down", do: new_duration, else: 0),
      is_running: true,
      is_paused: false,
      start_time: System.monotonic_time(:second)
    }

    new_state = schedule_tick(new_state)
    broadcast_event(new_state, %{type: :start, duration: new_duration})

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:stop_timer, _from, state) do
    state = cancel_timer(state)
    new_state = %{state |
      is_running: false,
      is_paused: false,
      start_time: nil,
      pause_time: nil
    }

    broadcast_event(new_state, %{type: :stop})
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:pause_timer, _from, state) do
    if state.is_running and not state.is_paused do
      state = cancel_timer(state)
      new_state = %{state |
        is_running: false,
        is_paused: true,
        pause_time: System.monotonic_time(:second)
      }

      broadcast_event(new_state, %{type: :pause})
      {:reply, :ok, new_state}
    else
      {:reply, {:error, :not_running}, state}
    end
  end

  @impl true
  def handle_call(:resume_timer, _from, state) do
    if state.is_paused do
      new_state = %{state |
        is_running: true,
        is_paused: false,
        start_time: System.monotonic_time(:second),
        pause_time: nil
      }

      new_state = schedule_tick(new_state)
      broadcast_event(new_state, %{type: :resume})
      {:reply, :ok, new_state}
    else
      {:reply, {:error, :not_paused}, state}
    end
  end

  @impl true
  def handle_call({:reset_timer, duration}, _from, state) do
    state = cancel_timer(state)
    new_duration = duration || state.config[:initial_duration] || state.total_duration

    new_state = %{state |
      total_duration: new_duration,
      current_time: if(state.count_direction == "down", do: new_duration, else: 0),
      is_running: false,
      is_paused: false,
      start_time: nil,
      pause_time: nil
    }

    broadcast_event(new_state, %{type: :reset, duration: new_duration})
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:extend_timer, amount, username, source_type}, _from, state) do
    new_state = if state.count_direction == "down" do
      %{state | current_time: state.current_time + amount}
    else
      %{state | total_duration: state.total_duration + amount}
    end

    broadcast_event(new_state, %{
      type: :extend,
      amount: amount,
      username: username,
      source_type: source_type
    })

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:set_time, time}, _from, state) do
    new_state = %{state | current_time: max(0, time)}
    broadcast_event(new_state, %{type: :set_time, time: new_state.current_time})
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    timer_state = %{
      current_time: state.current_time,
      total_duration: state.total_duration,
      is_running: state.is_running,
      is_paused: state.is_paused,
      count_direction: state.count_direction
    }
    {:reply, timer_state, state}
  end

  @impl true
  def handle_cast({:update_config, config}, state) do
    new_state = %{state |
      config: config,
      count_direction: config[:count_direction] || state.count_direction
    }
    {:noreply, new_state}
  end

  @impl true
  def handle_info(:tick, state) do
    if state.is_running do
      new_time = if state.count_direction == "down" do
        state.current_time - 1
      else
        state.current_time + 1
      end

      new_state = %{state | current_time: new_time}

      # Check if timer has ended (for countdown)
      new_state = if state.count_direction == "down" and new_time <= 0 do
        handle_timer_end(new_state)
      else
        schedule_tick(new_state)
      end

      # Broadcast tick update
      broadcast_tick(new_state)

      {:noreply, new_state}
    else
      {:noreply, state}
    end
  end

  @impl true
  def handle_info({:stream_event, event}, state) do
    # Handle stream events for automatic extensions
    if should_extend_timer?(event, state.config) do
      extension_amount = calculate_extension(event, state.config)

      if extension_amount > 0 do
        new_state = if state.count_direction == "down" do
          %{state | current_time: state.current_time + extension_amount}
        else
          %{state | total_duration: state.total_duration + extension_amount}
        end

        broadcast_event(new_state, %{
          type: :extend,
          amount: extension_amount,
          username: event.username,
          source_type: event.type
        })

        {:noreply, new_state}
      else
        {:noreply, state}
      end
    else
      {:noreply, state}
    end
  end

  @impl true
  def handle_info(%{config: config, type: :timer_widget}, state) do
    # Update config when changed from settings
    new_state = %{state |
      config: config,
      count_direction: config[:count_direction] || state.count_direction
    }
    {:noreply, new_state}
  end

  @impl true
  def handle_info({:auto_restart, duration}, state) do
    new_state = %{state |
      total_duration: duration,
      current_time: if(state.count_direction == "down", do: duration, else: 0),
      is_running: true,
      is_paused: false,
      start_time: System.monotonic_time(:second)
    }

    new_state = schedule_tick(new_state)
    broadcast_event(new_state, %{type: :start, duration: duration, auto_restarted: true})

    {:noreply, new_state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # Private functions

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:timer_manager, user_id}}}
  end

  defp load_timer_config(user_id) do
    case Streampai.Accounts.WidgetConfig.get_by_user_and_type(
      %{user_id: user_id, type: :timer_widget},
      actor: %{id: user_id}  # Simple actor for reading
    ) do
      {:ok, %{config: config}} -> config
      _ -> Streampai.Fake.Timer.default_config()
    end
  end

  defp cancel_timer(state) do
    if state.timer_ref do
      Process.cancel_timer(state.timer_ref)
    end
    %{state | timer_ref: nil}
  end

  defp schedule_tick(state) do
    timer_ref = Process.send_after(self(), :tick, 1000)
    %{state | timer_ref: timer_ref}
  end

  defp handle_timer_end(state) do
    state = cancel_timer(state)

    if state.config[:auto_restart] do
      restart_duration = state.config[:restart_duration] || state.total_duration

      # Schedule restart after 1 second
      Process.send_after(self(), {:auto_restart, restart_duration}, 1000)

      broadcast_event(state, %{type: :timer_end, auto_restart: true})
      %{state | is_running: false, current_time: 0}
    else
      broadcast_event(state, %{type: :timer_end, auto_restart: false})
      %{state | is_running: false, current_time: 0}
    end
  end

  defp should_extend_timer?(event, config) do
    case event.type do
      :donation ->
        config[:donation_extension_enabled] and
        event.amount >= (config[:donation_min_amount] || 1)

      :subscription ->
        config[:subscription_extension_enabled]

      :raid ->
        config[:raid_extension_enabled] and
        event.viewer_count >= (config[:raid_min_viewers] || 5)

      :patreon ->
        config[:patreon_extension_enabled]

      _ ->
        false
    end
  end

  defp calculate_extension(event, config) do
    case event.type do
      :donation ->
        amount = event.amount || 0
        extension_per_dollar = config[:donation_extension_amount] || 30
        round(amount * extension_per_dollar)

      :subscription ->
        config[:subscription_extension_amount] || 60

      :raid ->
        viewers = event.viewer_count || 0
        per_viewer = config[:raid_extension_per_viewer] || 1
        round(viewers * per_viewer)

      :patreon ->
        config[:patreon_extension_amount] || 120

      _ ->
        0
    end
  end

  defp broadcast_event(state, event_data) do
    event = Map.merge(event_data, %{
      current_time: state.current_time,
      total_duration: state.total_duration,
      is_running: state.is_running,
      is_paused: state.is_paused,
      timestamp: DateTime.utc_now()
    })

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "widget_events:#{state.user_id}:timer",
      {:timer_event, event}
    )
  end

  defp broadcast_tick(state) do
    # Only broadcast tick updates to the widget
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "widget_events:#{state.user_id}:timer",
      {:timer_tick, %{
        current_time: state.current_time,
        total_duration: state.total_duration,
        is_running: state.is_running,
        is_paused: state.is_paused
      }}
    )
  end
end