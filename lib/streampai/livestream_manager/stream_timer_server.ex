defmodule Streampai.LivestreamManager.StreamTimerServer do
  @moduledoc """
  GenServer that sends recurring chat messages during a livestream.

  Started when a stream goes live, stopped when it ends. Fire times are
  computed from `stream_started_at + N * interval_seconds` — no DB writes
  on each fire.

  Subscribes to PubSub topic `"stream_timers:{user_id}"` to react to
  timer config changes (create/update/delete/enable/disable) in real-time.
  """
  use GenServer

  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Stream.StreamTimer

  require Logger

  @max_tick_interval_ms 5_000

  defstruct [:user_id, :stream_started_at, timers: [], fired_epochs: %{}, tick_ref: nil]

  # ── Client API ──────────────────────────────────────────────────

  def start_link({user_id, stream_started_at}) do
    GenServer.start_link(
      __MODULE__,
      {user_id, stream_started_at},
      name: RegistryHelpers.via_tuple(:stream_timer_server, user_id)
    )
  end

  def child_spec({user_id, _stream_started_at} = args) do
    %{
      id: {:stream_timer_server, user_id},
      start: {__MODULE__, :start_link, [args]},
      restart: :transient,
      type: :worker
    }
  end

  # ── GenServer callbacks ─────────────────────────────────────────

  @impl true
  def init({user_id, stream_started_at}) do
    Logger.metadata(component: :stream_timer_server, user_id: user_id)
    Logger.info("[StreamTimerServer] started for user #{user_id}")

    Phoenix.PubSub.subscribe(Streampai.PubSub, "stream_timers:#{user_id}")

    state = %__MODULE__{
      user_id: user_id,
      stream_started_at: stream_started_at
    }

    state = load_timers(state)
    state = schedule_tick(state)

    {:ok, state}
  end

  @impl true
  def handle_info(:check_timers, state) do
    state = %{state | tick_ref: nil}
    state = fire_due_timers(state)
    state = schedule_tick(state)
    {:noreply, state}
  end

  def handle_info(:timers_changed, state) do
    Logger.info("[StreamTimerServer] timer config changed, reloading")
    state = load_timers(state)
    state = cancel_tick(state)
    state = schedule_tick(state)
    {:noreply, state}
  end

  def handle_info(msg, state) do
    Logger.warning("[StreamTimerServer] unhandled message: #{inspect(msg)}")
    {:noreply, state}
  end

  # ── Private ─────────────────────────────────────────────────────

  defp load_timers(state) do
    timers =
      case StreamTimer.get_enabled_for_user(state.user_id, actor: Streampai.SystemActor.system()) do
        {:ok, timers} -> timers
        {:error, _} -> []
      end

    # Preserve fired_epochs for timers that still exist
    existing_ids = MapSet.new(timers, & &1.id)

    fired_epochs =
      Map.filter(state.fired_epochs, fn {id, _} -> MapSet.member?(existing_ids, id) end)

    %{state | timers: timers, fired_epochs: fired_epochs}
  end

  defp fire_due_timers(state) do
    now = DateTime.utc_now()
    elapsed = DateTime.diff(now, state.stream_started_at, :second)

    Enum.reduce(state.timers, state, fn timer, acc ->
      current_epoch = div(elapsed, timer.interval_seconds)

      if current_epoch > Map.get(acc.fired_epochs, timer.id, -1) do
        # Don't fire at epoch 0 (stream just started)
        if current_epoch > 0 do
          Logger.info("[StreamTimerServer] firing timer #{timer.label} (epoch #{current_epoch})")

          Task.start(fn ->
            StreamManager.send_chat_message(acc.user_id, timer.content)
          end)
        end

        %{acc | fired_epochs: Map.put(acc.fired_epochs, timer.id, current_epoch)}
      else
        acc
      end
    end)
  end

  defp schedule_tick(state) do
    if state.timers == [] do
      state
    else
      delay_ms = compute_next_tick_delay(state)
      ref = Process.send_after(self(), :check_timers, delay_ms)
      %{state | tick_ref: ref}
    end
  end

  defp cancel_tick(%{tick_ref: nil} = state), do: state

  defp cancel_tick(%{tick_ref: ref} = state) do
    Process.cancel_timer(ref)
    %{state | tick_ref: nil}
  end

  defp compute_next_tick_delay(state) do
    now = DateTime.utc_now()
    elapsed_s = DateTime.diff(now, state.stream_started_at, :second)

    # For each timer, compute seconds until next fire
    delays =
      Enum.map(state.timers, fn timer ->
        current_epoch = div(elapsed_s, timer.interval_seconds)
        next_fire_at_s = (current_epoch + 1) * timer.interval_seconds
        max(next_fire_at_s - elapsed_s, 0)
      end)

    case delays do
      [] ->
        @max_tick_interval_ms

      delays ->
        soonest_s = Enum.min(delays)
        # Convert to ms, cap at max interval, minimum 100ms
        soonest_s
        |> Kernel.*(1_000)
        |> min(@max_tick_interval_ms)
        |> max(100)
    end
  end
end
