defmodule Streampai.LivestreamManager.AlertQueue do
  @moduledoc """
  GenServer that manages a priority queue of alert events for a user's alertbox.

  Uses a simple sorted list in process memory with a single bouncing `send_after`
  timer. Events are received via direct `enqueue_event/2` casts (no PubSub).

  The current alert is written to `CurrentStreamData.active_alert` (synced to
  frontend via Electric SQL). Queue metadata (paused, queue_size, current_event_id)
  is written to `CurrentStreamData.alertbox_state`.
  """
  use GenServer

  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.StreamEvent

  require Logger

  defstruct [
    :user_id,
    # Sorted list of %{id, priority, event, timestamp}, head = next to display
    alerts: [],
    # %{id, stream_event_id, expires_at} | nil — what's currently showing
    current_alert: nil,
    # Whether alert processing is paused
    paused: false,
    # Single timer ref for the bouncing tick
    tick_timer: nil
  ]

  # Event priorities (lower number = higher priority)
  @replay_priority 0
  @high_priority 1
  @medium_priority 2
  @low_priority 3

  # --- Public API ---

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @doc "Enqueues an alert event for display."
  def enqueue_event(server, event) do
    GenServer.cast(server, {:enqueue_event, event})
  end

  @doc "Replays an event at the front of the queue (after current alert)."
  def replay_event(server, event) do
    GenServer.cast(server, {:replay_event, event})
  end

  @doc "Pauses the alertbox (clears current alert, stops processing)."
  def pause_queue(server), do: GenServer.cast(server, :pause)

  @doc "Resumes the alertbox."
  def resume_queue(server), do: GenServer.cast(server, :resume)

  @doc "Skips the current alert and moves to the next one."
  def skip_event(server), do: GenServer.cast(server, :skip)

  @doc "Clears all queued alerts and the current alert."
  def clear_queue(server), do: GenServer.cast(server, :clear)

  @doc "Gets the current queue status."
  def get_queue_status(server), do: GenServer.call(server, :get_queue_status)

  # Keep old API for compatibility
  def enqueue_control(server, command), do: GenServer.cast(server, command)
  def process_next_event(server), do: GenServer.call(server, :get_queue_status)

  # --- Server callbacks ---

  @impl true
  def init(user_id) do
    state = %__MODULE__{user_id: user_id}
    sync_alertbox_state(state)
    Logger.info("AlertQueue started for user #{user_id}")
    {:ok, state}
  end

  @impl true
  def handle_cast({:enqueue_event, event}, state) do
    priority = determine_priority(event)

    alert = %{
      id: generate_id(),
      priority: priority,
      event: event,
      timestamp: DateTime.utc_now()
    }

    alerts = insert_sorted(state.alerts, alert)
    state = %{state | alerts: alerts}

    sync_alertbox_state(state)

    # Kick the loop if nothing is currently displaying
    state =
      if is_nil(state.current_alert) and not state.paused do
        schedule_tick(state, 0)
      else
        state
      end

    {:noreply, state}
  end

  @impl true
  def handle_cast({:replay_event, event}, state) do
    stream_event_id = Map.get(event, :stream_event_id)

    # Remove any existing entry with same stream_event_id
    alerts =
      if stream_event_id do
        Enum.reject(state.alerts, fn a ->
          Map.get(a.event, :stream_event_id) == stream_event_id
        end)
      else
        state.alerts
      end

    alert = %{
      id: generate_id(),
      priority: @replay_priority,
      event: event,
      timestamp: DateTime.utc_now()
    }

    # Prepend (priority 0 sorts before everything)
    alerts = [alert | alerts]
    state = %{state | alerts: alerts}

    sync_alertbox_state(state)

    state =
      if is_nil(state.current_alert) and not state.paused do
        schedule_tick(state, 0)
      else
        state
      end

    Logger.info("AlertQueue replaying event",
      user_id: state.user_id,
      stream_event_id: stream_event_id
    )

    {:noreply, state}
  end

  @impl true
  def handle_cast(:pause, state) do
    state = cancel_timer(state)
    state = clear_current_alert(state)
    state = %{state | paused: true}
    sync_alertbox_state(state)
    Logger.info("AlertQueue paused", user_id: state.user_id)
    {:noreply, state}
  end

  @impl true
  def handle_cast(:resume, state) do
    state = %{state | paused: false}
    sync_alertbox_state(state)
    state = schedule_tick(state, 0)
    Logger.info("AlertQueue resumed", user_id: state.user_id)
    {:noreply, state}
  end

  @impl true
  def handle_cast(:skip, state) do
    state = clear_current_alert(state)
    state = schedule_tick(state, 0)
    sync_alertbox_state(state)
    Logger.info("AlertQueue skipped", user_id: state.user_id)
    {:noreply, state}
  end

  @impl true
  def handle_cast(:clear, state) do
    state = cancel_timer(state)
    state = clear_current_alert(state)
    state = %{state | alerts: []}
    sync_alertbox_state(state)
    Logger.info("AlertQueue cleared", user_id: state.user_id)
    {:noreply, state}
  end

  @impl true
  def handle_call(:get_queue_status, _from, state) do
    status = %{
      paused: state.paused,
      queue_size: length(state.alerts),
      current_alert: state.current_alert,
      next_events: Enum.take(state.alerts, 5)
    }

    {:reply, status, state}
  end

  @impl true
  def handle_info(:tick, state) do
    state = process_tick(state)
    {:noreply, state}
  end

  # Catch-all
  @impl true
  def handle_info(_msg, state), do: {:noreply, state}

  # --- Tick loop ---

  defp process_tick(%{paused: true} = state), do: state

  defp process_tick(%{current_alert: %{expires_at: expires_at}} = state) do
    now = System.monotonic_time(:millisecond)

    if now >= expires_at do
      # Current alert expired — clear it, then fall through to show next
      state = clear_current_alert(state)
      process_tick(state)
    else
      # Not expired yet — reschedule at expiry
      remaining = expires_at - now
      schedule_tick(state, remaining)
    end
  end

  defp process_tick(%{current_alert: nil, alerts: []} = state), do: state

  defp process_tick(%{current_alert: nil, alerts: [next | rest]} = state) do
    display_time = Map.get(next.event, :display_time, 10)
    display_ms = display_time * 1000
    now = System.monotonic_time(:millisecond)

    stream_event_id = Map.get(next.event, :stream_event_id)
    alert_data = build_alert_data(next, display_ms)

    case CurrentStreamData.set_active_alert_for_user(state.user_id, alert_data) do
      {:ok, _} ->
        Logger.info("AlertQueue displaying alert",
          user_id: state.user_id,
          alert_id: next.id,
          type: next.event.type,
          display_time: display_time
        )

        # Mark stream event as displayed (fire-and-forget)
        maybe_mark_displayed(stream_event_id)

      {:error, reason} ->
        Logger.warning("Failed to write active alert: #{inspect(reason)}")
    end

    current = %{id: next.id, stream_event_id: stream_event_id, expires_at: now + display_ms}
    state = %{state | alerts: rest, current_alert: current}

    sync_alertbox_state(state)
    schedule_tick(state, display_ms)
  end

  # --- Helpers ---

  defp clear_current_alert(%{current_alert: nil} = state), do: state

  defp clear_current_alert(state) do
    CurrentStreamData.clear_active_alert_for_user(state.user_id, state.current_alert.id)
    %{state | current_alert: nil}
  end

  defp maybe_mark_displayed(nil), do: :ok

  defp maybe_mark_displayed(stream_event_id) do
    Task.start(fn ->
      case Ash.get(StreamEvent, stream_event_id) do
        {:ok, event} ->
          Ash.update(event, %{},
            action: :mark_as_displayed,
            actor: Streampai.SystemActor.system()
          )

        {:error, _} ->
          :ok
      end
    end)
  end

  defp schedule_tick(state, delay_ms) do
    state = cancel_timer(state)
    timer = Process.send_after(self(), :tick, max(trunc(delay_ms), 0))
    %{state | tick_timer: timer}
  end

  defp cancel_timer(%{tick_timer: nil} = state), do: state

  defp cancel_timer(%{tick_timer: timer} = state) do
    Process.cancel_timer(timer)
    %{state | tick_timer: nil}
  end

  defp build_alert_data(alert, duration_ms) do
    event = alert.event

    %{
      "id" => alert.id,
      "type" => to_string(event.type),
      "username" => Map.get(event, :username) || Map.get(event, :donor_name, "Unknown"),
      "message" => Map.get(event, :message),
      "amount" => Map.get(event, :amount),
      "currency" => Map.get(event, :currency),
      "platform" => to_string(Map.get(event, :platform, "unknown")),
      "started_at" => DateTime.to_iso8601(DateTime.utc_now()),
      "duration" => duration_ms,
      "tts_url" => Map.get(event, :tts_url),
      "stream_event_id" => Map.get(event, :stream_event_id)
    }
  end

  defp insert_sorted(alerts, new_alert) do
    {before, after_} =
      Enum.split_while(alerts, fn a ->
        a.priority < new_alert.priority or
          (a.priority == new_alert.priority and
             DateTime.compare(a.timestamp, new_alert.timestamp) != :gt)
      end)

    before ++ [new_alert] ++ after_
  end

  defp determine_priority(event) do
    case event.type do
      :donation ->
        if (Map.get(event, :amount) || 0) >= 10.0, do: @high_priority, else: @medium_priority

      :raid ->
        if (Map.get(event, :viewer_count) || 0) >= 10, do: @high_priority, else: @medium_priority

      :subscription ->
        @medium_priority

      :cheer ->
        if (Map.get(event, :bits) || 0) >= 100, do: @medium_priority, else: @low_priority

      :follow ->
        @medium_priority

      _ ->
        @medium_priority
    end
  end

  defp sync_alertbox_state(state) do
    current_event_id =
      case state.current_alert do
        %{stream_event_id: id} -> id
        _ -> nil
      end

    data = %{
      "paused" => state.paused,
      "queue_size" => length(state.alerts),
      "current_event_id" => current_event_id
    }

    case CurrentStreamData.update_alertbox_state_for_user(state.user_id, data) do
      {:ok, _} -> :ok
      {:error, reason} -> Logger.debug("Failed to sync alertbox_state: #{inspect(reason)}")
    end
  end

  defp generate_id do
    "alert_#{8 |> :crypto.strong_rand_bytes() |> Base.encode64() |> String.slice(0, 12)}"
  end

  defp via_tuple(user_id) do
    RegistryHelpers.via_tuple(:alert_queue, user_id)
  end
end
