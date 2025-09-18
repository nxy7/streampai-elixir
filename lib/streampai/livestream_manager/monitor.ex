defmodule Streampai.LivestreamManager.Monitor do
  @moduledoc """
  Monitoring and inspection utilities for the LivestreamManager system.
  Provides helper functions for debugging and observing active user streams in IEx.
  """

  alias Streampai.LivestreamManager.UserStreamManager

  @doc """
  Lists all active UserStreamManager processes with their user IDs and status.
  Useful for debugging and monitoring in IEx.

  ## Examples

      iex> Streampai.LivestreamManager.Monitor.list_active_users()
      [%{user_id: "user123", pid: #PID<0.123.0>, status: %{...}, uptime: 15000}]
  """
  def list_active_users do
    registry_name = get_registry_name()

    registry_name
    |> Registry.select([
      {{{:user_stream_manager, :"$1"}, :"$2", :"$3"}, [], [{{:"$1", :"$2"}}]}
    ])
    |> Enum.map(fn {user_id, pid} ->
      status = get_user_status(pid)

      %{
        user_id: user_id,
        pid: pid,
        status: status,
        uptime: get_process_uptime(pid)
      }
    end)
    |> Enum.sort_by(& &1.user_id)
  end

  @doc """
  Pretty prints all active UserStreamManager processes in a table format.

  ## Examples

      iex> Streampai.LivestreamManager.Monitor.print_active_users()
      
      === Active UserStreamManager Processes ===
      User ID             PID            Stream Status   Alert Queue Uptime
      ----------------------------------------------------------------------
      user123             <0.123.0>      ready           2 events    5m 30s
      user456             <0.456.0>      streaming       0 events    12m 15s
      
      Total: 2 active processes
      :ok
  """
  def print_active_users do
    active_users = list_active_users()

    if Enum.empty?(active_users) do
      require Logger

      Logger.info("No active UserStreamManager processes.")
    else
      IO.puts("\n=== Active UserStreamManager Processes ===")

      IO.puts(
        String.pad_trailing("User ID", 20) <>
          String.pad_trailing("PID", 15) <>
          String.pad_trailing("Stream Status", 15) <>
          String.pad_trailing("Alert Queue", 12) <> "Uptime"
      )

      IO.puts(String.duplicate("-", 70))

      Enum.each(active_users, fn user ->
        user_id_str = String.pad_trailing(user.user_id, 20)
        pid_str = String.pad_trailing(inspect(user.pid), 15)
        stream_status = String.pad_trailing(to_string(user.status.stream_status || "unknown"), 15)
        queue_status = String.pad_trailing("#{user.status.queue_length || 0} events", 12)
        uptime_str = format_uptime(user.uptime)

        IO.puts("#{user_id_str}#{pid_str}#{stream_status}#{queue_status}#{uptime_str}")
      end)

      IO.puts("\nTotal: #{length(active_users)} active processes")
    end

    :ok
  end

  @doc """
  Gets detailed status for a specific user's stream manager.

  ## Examples

      iex> Streampai.LivestreamManager.Monitor.get_user_details("user123")
      %{
        user_id: "user123",
        pid: #PID<0.123.0>,
        uptime: 15000,
        stream_state: %{...},
        alert_queue: %{...},
        child_processes: [...]
      }
      
      iex> Streampai.LivestreamManager.Monitor.get_user_details("nonexistent")
      {:error, :not_found}
  """
  def get_user_details(user_id) when is_binary(user_id) do
    case Registry.lookup(get_registry_name(), {:user_stream_manager, user_id}) do
      [{pid, _}] ->
        stream_state = UserStreamManager.get_state(pid)
        queue_status = UserStreamManager.get_alert_queue_status(pid)

        %{
          user_id: user_id,
          pid: pid,
          uptime: get_process_uptime(pid),
          stream_state: stream_state,
          alert_queue: queue_status,
          child_processes: get_child_processes(pid)
        }

      [] ->
        {:error, :not_found}
    end
  end

  @doc """
  Pretty prints detailed status for a specific user in a readable format.

  ## Examples

      iex> Streampai.LivestreamManager.Monitor.print_user_details("user123")
      
      === UserStreamManager Details: user123 ===
      PID: <0.123.0>
      Uptime: 5m 30s
      
      --- Stream State ---
      Status: ready
      Cloudflare Input: %{...}
      Platforms: ["twitch", "youtube"]
      
      --- Alert Queue ---
      State: playing
      Queue Length: 2
      Recent Events: 5
      
      --- Child Processes ---
        StreamStateServer: <0.124.0> (alive)
        CloudflareManager: <0.125.0> (alive)
        AlertQueue: <0.126.0> (alive)
      :ok
  """
  def print_user_details(user_id) when is_binary(user_id) do
    case get_user_details(user_id) do
      {:error, :not_found} ->
        IO.puts("No active UserStreamManager found for user: #{user_id}")

      details ->
        IO.puts("\n=== UserStreamManager Details: #{user_id} ===")
        IO.puts("PID: #{inspect(details.pid)}")
        IO.puts("Uptime: #{format_uptime(details.uptime)}")

        IO.puts("\n--- Stream State ---")
        IO.puts("Status: #{details.stream_state.status}")
        IO.puts("Cloudflare Input: #{inspect(details.stream_state.cloudflare_input)}")
        IO.puts("Platforms: #{inspect(Map.keys(details.stream_state.platforms))}")

        IO.puts("\n--- Alert Queue ---")
        IO.puts("State: #{details.alert_queue.queue_state}")
        IO.puts("Queue Length: #{details.alert_queue.queue_length}")
        IO.puts("Recent Events: #{length(details.alert_queue.recent_history)}")

        IO.puts("\n--- Child Processes ---")

        Enum.each(details.child_processes, fn {name, pid, status} ->
          IO.puts("  #{name}: #{inspect(pid)} (#{status})")
        end)
    end

    :ok
  end

  @doc """
  Counts active processes by status.

  ## Examples

      iex> Streampai.LivestreamManager.Monitor.count_by_status()
      %{
        total: 3,
        by_stream_status: %{ready: 1, streaming: 2},
        by_queue_state: %{playing: 2, paused: 1}
      }
  """
  def count_by_status do
    users = list_active_users()

    stream_status_counts =
      users
      |> Enum.group_by(fn user -> user.status.stream_status end)
      |> Map.new(fn {status, list} -> {status, length(list)} end)

    queue_state_counts =
      users
      |> Enum.group_by(fn user -> user.status.queue_state end)
      |> Map.new(fn {state, list} -> {state, length(list)} end)

    %{
      total: length(users),
      by_stream_status: stream_status_counts,
      by_queue_state: queue_state_counts
    }
  end

  # Private helper functions

  defp get_registry_name do
    if Application.get_env(:streampai, :test_mode, false) do
      case Process.get(:test_registry_name) do
        nil -> Streampai.LivestreamManager.Registry
        test_registry -> test_registry
      end
    else
      Streampai.LivestreamManager.Registry
    end
  end

  defp get_user_status(pid) do
    stream_state = UserStreamManager.get_state(pid)
    queue_status = UserStreamManager.get_alert_queue_status(pid)

    %{
      stream_status: stream_state.status,
      queue_length: queue_status.queue_length,
      queue_state: queue_status.queue_state
    }
  rescue
    _ -> %{stream_status: :error, queue_length: 0, queue_state: :error}
  end

  defp get_process_uptime(pid) do
    # Get process start time from process info
    case Process.info(pid, :start_time) do
      {:start_time, start_time} ->
        now = System.monotonic_time(:microsecond)
        # Convert to milliseconds
        div(now - start_time, 1000)

      nil ->
        0
    end
  rescue
    _ -> 0
  end

  defp get_child_processes(supervisor_pid) do
    supervisor_pid
    |> Supervisor.which_children()
    |> Enum.map(fn {name, pid, _type, _modules} ->
      status = if Process.alive?(pid), do: :alive, else: :dead
      {name, pid, status}
    end)
  rescue
    _ -> []
  end

  defp format_uptime(uptime_ms) when is_integer(uptime_ms) do
    seconds = div(uptime_ms, 1000)
    minutes = div(seconds, 60)
    hours = div(minutes, 60)

    cond do
      hours > 0 -> "#{hours}h #{rem(minutes, 60)}m"
      minutes > 0 -> "#{minutes}m #{rem(seconds, 60)}s"
      true -> "#{seconds}s"
    end
  end

  defp format_uptime(_), do: "unknown"
end
