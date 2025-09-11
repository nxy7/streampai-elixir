defmodule Streampai.LivestreamManager.PresenceManager do
  @moduledoc """
  Manages UserStreamManager processes based on user presence.
  Spawns processes for active users and cleans them up after 5 seconds of inactivity.
  """
  use GenServer

  alias Phoenix.PubSub
  alias Streampai.LivestreamManager.UserStreamManager

  # 5 seconds
  @cleanup_timeout 5_000

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    # Subscribe to presence updates (both manual and Phoenix.Presence events)
    PubSub.subscribe(Streampai.PubSub, "presence_updates")
    PubSub.subscribe(Streampai.PubSub, "users_presence")

    # Track active users and their cleanup timers
    state = %{
      active_users: MapSet.new(),
      cleanup_timers: %{},
      # user_id -> pid
      managers: %{}
    }

    # Initialize with existing presence after a short delay to ensure Presence is ready
    Process.send_after(self(), :initialize_existing_presence, 1000)

    {:ok, state}
  end

  @impl true
  def handle_info({:user_joined, user_id}, state) do
    IO.puts("[PresenceManager] User #{user_id} joined - starting UserStreamManager")

    # Cancel any existing cleanup timer
    state = cancel_cleanup_timer(state, user_id)

    active_users = MapSet.put(state.active_users, user_id)

    # Start UserStreamManager if not already running
    managers = ensure_manager_started(state.managers, user_id)

    {:noreply, %{state | active_users: active_users, managers: managers}}
  end

  @impl true
  def handle_info({:user_left, user_id}, state) do
    IO.puts("[PresenceManager] User #{user_id} left - scheduling cleanup in #{@cleanup_timeout}ms")

    active_users = MapSet.delete(state.active_users, user_id)

    # Cancel any existing timer and schedule new cleanup
    state = cancel_cleanup_timer(state, user_id)
    timer_ref = Process.send_after(self(), {:cleanup_user, user_id}, @cleanup_timeout)
    cleanup_timers = Map.put(state.cleanup_timers, user_id, timer_ref)

    {:noreply, %{state | active_users: active_users, cleanup_timers: cleanup_timers}}
  end

  @impl true
  def handle_info({:cleanup_user, user_id}, state) do
    # Only cleanup if user is still not active
    if MapSet.member?(state.active_users, user_id) do
      IO.puts("[PresenceManager] User #{user_id} is active again, skipping cleanup")
      cleanup_timers = Map.delete(state.cleanup_timers, user_id)
      {:noreply, %{state | cleanup_timers: cleanup_timers}}
    else
      IO.puts("[PresenceManager] Cleaning up UserStreamManager for user #{user_id}")

      managers = stop_manager(state.managers, user_id)
      cleanup_timers = Map.delete(state.cleanup_timers, user_id)

      {:noreply, %{state | managers: managers, cleanup_timers: cleanup_timers}}
    end
  end

  @impl true
  def handle_info(:initialize_existing_presence, state) do
    IO.puts("[PresenceManager] Initializing UserStreamManagers for existing presence...")

    try do
      existing_users = "users_presence" |> StreampaiWeb.Presence.list() |> Map.keys()

      IO.puts("[PresenceManager] Found #{length(existing_users)} existing users: #{inspect(existing_users)}")

      # Start managers for existing users
      {active_users, managers} =
        Enum.reduce(existing_users, {state.active_users, state.managers}, fn user_id, {users_acc, managers_acc} ->
          users_acc = MapSet.put(users_acc, user_id)
          managers_acc = ensure_manager_started(managers_acc, user_id)
          {users_acc, managers_acc}
        end)

      {:noreply, %{state | active_users: active_users, managers: managers}}
    rescue
      error ->
        IO.puts("[PresenceManager] Error initializing existing presence: #{inspect(error)}")
        {:noreply, state}
    end
  end

  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: %{joins: joins, leaves: leaves}}, state) do
    IO.puts("[PresenceManager] Received presence_diff - joins: #{map_size(joins)}, leaves: #{map_size(leaves)}")

    {active_users, managers, cleanup_timers} =
      Enum.reduce(joins, {state.active_users, state.managers, state.cleanup_timers}, fn {user_id, _meta},
                                                                                        {users_acc, managers_acc,
                                                                                         timers_acc} ->
        IO.puts("[PresenceManager] Phoenix.Presence join: #{user_id}")
        users_acc = MapSet.put(users_acc, user_id)
        managers_acc = ensure_manager_started(managers_acc, user_id)

        # Cancel any pending cleanup for this user
        timers_acc = cancel_cleanup_timer_for_user(timers_acc, user_id)

        {users_acc, managers_acc, timers_acc}
      end)

    {active_users, cleanup_timers} =
      Enum.reduce(leaves, {active_users, cleanup_timers}, fn {user_id, _meta}, {users_acc, timers_acc} ->
        current_presence = StreampaiWeb.Presence.list("users_presence")
        user_still_present = Map.has_key?(current_presence, user_id)

        if user_still_present do
          IO.puts("[PresenceManager] Phoenix.Presence leave: #{user_id} - but still has other sessions, keeping active")

          # User still has other sessions, don't schedule cleanup
          {users_acc, timers_acc}
        else
          IO.puts("[PresenceManager] Phoenix.Presence leave: #{user_id} - no more sessions, scheduling cleanup")

          users_acc = MapSet.delete(users_acc, user_id)

          # Cancel existing timer and schedule cleanup
          timers_acc = cancel_cleanup_timer_for_user(timers_acc, user_id)
          timer_ref = Process.send_after(self(), {:cleanup_user, user_id}, @cleanup_timeout)
          timers_acc = Map.put(timers_acc, user_id, timer_ref)

          {users_acc, timers_acc}
        end
      end)

    {:noreply, %{state | active_users: active_users, managers: managers, cleanup_timers: cleanup_timers}}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    managers =
      state.managers
      |> Enum.reject(fn {_user_id, manager_pid} -> manager_pid == pid end)
      |> Map.new()

    {:noreply, %{state | managers: managers}}
  end

  @impl true
  def handle_info(msg, state) do
    IO.puts("[PresenceManager] Received unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  # Public API
  def user_joined(user_id) when is_binary(user_id) do
    PubSub.broadcast(Streampai.PubSub, "presence_updates", {:user_joined, user_id})
  end

  def user_left(user_id) when is_binary(user_id) do
    PubSub.broadcast(Streampai.PubSub, "presence_updates", {:user_left, user_id})
  end

  def get_active_users do
    GenServer.call(__MODULE__, :get_active_users)
  end

  def get_managed_users do
    GenServer.call(__MODULE__, :get_managed_users)
  end

  @doc """
  Get detailed metrics about active UserStreamManagers.
  Returns: %{
    total_managers: integer,
    managers: [%{user_id: string, pid: pid, memory: bytes, process_count: integer}],
    system_info: %{total_processes: integer, total_memory: integer}
  }
  """
  def get_metrics do
    GenServer.call(__MODULE__, :get_metrics, 10_000)
  end

  @doc """
  Get summary metrics for monitoring/plotting.
  Returns: %{total_managers: integer, total_memory_kb: integer, total_processes: integer}
  """
  def get_summary_metrics do
    GenServer.call(__MODULE__, :get_summary_metrics, 10_000)
  end

  @doc """
  Debug function to show current presence and manager state.
  Use in IEx: Streampai.LivestreamManager.PresenceManager.debug()
  """
  def debug do
    IO.puts("\n🔍 PresenceManager Debug Info")
    IO.puts("=" <> String.duplicate("=", 40))

    # Current presence
    presence = StreampaiWeb.Presence.list("users_presence")
    IO.puts("\n📍 Phoenix.Presence state:")

    if map_size(presence) == 0 do
      IO.puts("  No users present")
    else
      print_presence_info(presence)
    end

    # PresenceManager state
    active = get_active_users()
    managed = get_managed_users()

    IO.puts("\n🎯 PresenceManager state:")
    IO.puts("  Active users: #{inspect(active)}")
    IO.puts("  Managed users: #{inspect(managed)}")

    # Running managers
    IO.puts("\n⚡ Running UserStreamManagers:")

    if Enum.empty?(managed) do
      IO.puts("  None")
    else
      Enum.each(managed, &print_manager_status/1)
    end

    :ok
  end

  defp print_presence_info(presence) do
    Enum.each(presence, fn {user_id, %{metas: metas}} ->
      IO.puts("  #{user_id}: #{length(metas)} sessions")

      metas
      |> Enum.with_index(1)
      |> Enum.each(fn {meta, idx} ->
        IO.puts("    Session #{idx}: #{inspect(meta)}")
      end)
    end)
  end

  defp print_manager_status(user_id) do
    case Registry.lookup(
           Streampai.LivestreamManager.Registry,
           {:user_stream_manager, user_id}
         ) do
      [{pid, _}] -> IO.puts("  #{user_id}: #{inspect(pid)} (alive: #{Process.alive?(pid)})")
      [] -> IO.puts("  #{user_id}: NOT FOUND in registry")
    end
  end

  @impl true
  def handle_call(:get_active_users, _from, state) do
    {:reply, MapSet.to_list(state.active_users), state}
  end

  @impl true
  def handle_call(:get_managed_users, _from, state) do
    {:reply, Map.keys(state.managers), state}
  end

  @impl true
  def handle_call(:get_metrics, _from, state) do
    managers = Map.keys(state.managers)

    manager_metrics =
      managers
      |> Enum.map(fn user_id ->
        case Map.get(state.managers, user_id) do
          nil ->
            nil

          pid when is_pid(pid) ->
            try do
              # Get process info
              process_info = Process.info(pid, [:memory, :message_queue_len])
              memory = process_info[:memory] || 0

              # Count child processes
              child_count = count_manager_processes(user_id)

              %{
                user_id: user_id,
                pid: pid,
                memory_bytes: memory,
                process_count: child_count,
                alive: Process.alive?(pid)
              }
            rescue
              _ -> %{user_id: user_id, pid: pid, error: "failed_to_get_info", alive: false}
            end
        end
      end)
      |> Enum.reject(&is_nil/1)

    # System-wide metrics
    total_memory =
      Enum.reduce(manager_metrics, 0, fn
        %{memory_bytes: mem}, acc when is_integer(mem) -> acc + mem
        _, acc -> acc
      end)

    total_processes =
      Enum.reduce(manager_metrics, 0, fn
        %{process_count: count}, acc when is_integer(count) -> acc + count
        _, acc -> acc
      end)

    metrics = %{
      total_managers: length(managers),
      managers: manager_metrics,
      system_info: %{
        total_memory_bytes: total_memory,
        total_processes: total_processes,
        erlang_processes: :erlang.system_info(:process_count),
        memory_total: :erlang.memory(:total)
      }
    }

    {:reply, metrics, state}
  end

  @impl true
  def handle_call(:get_summary_metrics, _from, state) do
    managers = Map.keys(state.managers)

    # Quick summary without detailed process inspection
    total_memory =
      Enum.reduce(managers, 0, fn user_id, acc ->
        case Map.get(state.managers, user_id) do
          pid when is_pid(pid) ->
            try do
              case Process.info(pid, :memory) do
                {:memory, mem} -> acc + mem
                nil -> acc
              end
            rescue
              _ -> acc
            end

          _ ->
            acc
        end
      end)

    summary = %{
      total_managers: length(managers),
      total_memory_kb: div(total_memory, 1024),
      active_users: MapSet.size(state.active_users),
      cleanup_timers: map_size(state.cleanup_timers)
    }

    {:reply, summary, state}
  end

  # Private helpers

  defp cancel_cleanup_timer(state, user_id) do
    case Map.get(state.cleanup_timers, user_id) do
      nil ->
        state

      timer_ref ->
        Process.cancel_timer(timer_ref)
        cleanup_timers = Map.delete(state.cleanup_timers, user_id)
        %{state | cleanup_timers: cleanup_timers}
    end
  end

  defp cancel_cleanup_timer_for_user(cleanup_timers, user_id) do
    case Map.get(cleanup_timers, user_id) do
      nil ->
        cleanup_timers

      timer_ref ->
        Process.cancel_timer(timer_ref)
        Map.delete(cleanup_timers, user_id)
    end
  end

  defp ensure_manager_started(managers, user_id) do
    case Map.get(managers, user_id) do
      nil ->
        case start_manager(user_id) do
          {:ok, pid} ->
            Process.monitor(pid)
            Map.put(managers, user_id, pid)

          {:error, reason} ->
            IO.puts("[PresenceManager] Failed to start manager for #{user_id}: #{inspect(reason)}")

            managers
        end

      _pid ->
        # Already running
        managers
    end
  end

  defp start_manager(user_id) do
    DynamicSupervisor.start_child(
      Streampai.LivestreamManager.DynamicSupervisor,
      {UserStreamManager, user_id}
    )
  end

  defp stop_manager(managers, user_id) do
    case Map.get(managers, user_id) do
      nil ->
        managers

      pid ->
        DynamicSupervisor.terminate_child(Streampai.LivestreamManager.DynamicSupervisor, pid)
        Map.delete(managers, user_id)
    end
  end

  defp count_manager_processes(user_id) do
    # Count all processes registered under this user's UserStreamManager
    registry_entries =
      Registry.select(Streampai.LivestreamManager.Registry, [
        {{{:_, user_id}, :_, :_}, [], [true]}
      ])

    length(registry_entries)
  rescue
    _ -> 0
  end
end
