defmodule Streampai.LivestreamManager.UserStreamManager do
  @moduledoc """
  Main coordinator for a user's livestream management.
  This supervisor manages all user-specific streaming processes.
  """
  use Supervisor

  alias Streampai.LivestreamManager.{
    AlertQueue,
    CloudflareLiveInputMonitor,
    CloudflareManager,
    PlatformSupervisor,
    StreamStateServer
  }

  def start_link(user_id) when is_binary(user_id) do
    Supervisor.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    children = [
      # Core stream state management
      {StreamStateServer, user_id},

      # Cloudflare live input/output management (enhanced with polling)
      {CloudflareManager, user_id},

      # Alert event queuing and prioritization
      {AlertQueue, user_id}

      # # Console logger for testing purposes
      # {ConsoleLogger, user_id}

      # # Platform-specific managers (dynamic supervisor)
      # {PlatformSupervisor, user_id},
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  # Public API that delegates to appropriate child processes

  def get_state(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    StreamStateServer.get_state(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:stream_state, user_id}}}
    )
  end

  def send_chat_message(pid, message, platforms) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)
    PlatformSupervisor.broadcast_message(user_id, message, platforms)
  end

  def update_stream_metadata(pid, metadata, platforms) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)
    PlatformSupervisor.update_metadata(user_id, metadata, platforms)
  end

  def configure_stream_outputs(pid, platform_configs) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    CloudflareManager.configure_outputs(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}},
      platform_configs
    )
  end

  def get_stream_status(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)
    CloudflareLiveInputMonitor.get_status(user_id)
  end

  def set_live_input_id(pid, input_id) when is_pid(pid) and is_binary(input_id) do
    user_id = get_user_id_from_supervisor(pid)
    CloudflareLiveInputMonitor.set_live_input_id(user_id, input_id)
  end

  # Alert Queue API

  def enqueue_alert(pid, event) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    AlertQueue.enqueue_event(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_queue, user_id}}},
      event
    )
  end

  def pause_alerts(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    AlertQueue.pause_queue(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_queue, user_id}}}
    )
  end

  def resume_alerts(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    AlertQueue.resume_queue(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_queue, user_id}}}
    )
  end

  def skip_alert(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    AlertQueue.skip_event(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_queue, user_id}}}
    )
  end

  def clear_alert_queue(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    AlertQueue.clear_queue(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_queue, user_id}}}
    )
  end

  def get_alert_queue_status(pid) when is_pid(pid) do
    user_id = get_user_id_from_supervisor(pid)

    AlertQueue.get_queue_status(
      {:via, Registry, {Streampai.LivestreamManager.Registry, {:alert_queue, user_id}}}
    )
  end

  # Helper functions

  defp via_tuple(user_id) do
    {:via, Registry, {get_registry_name(), {:user_stream_manager, user_id}}}
  end

  defp get_user_id_from_supervisor(pid) do
    # Extract user_id from the supervisor's registered name
    case Registry.keys(get_registry_name(), pid) do
      [{:user_stream_manager, user_id}] -> user_id
      [] -> nil
    end
  end

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
end
