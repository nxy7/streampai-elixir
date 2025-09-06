defmodule Streampai.LivestreamManager.UserStreamManager do
  @moduledoc """
  Main coordinator for a user's livestream management.
  This supervisor manages all user-specific streaming processes.
  """
  use Supervisor

  alias Streampai.LivestreamManager.{
    AlertManager,
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

      # Platform-specific managers (dynamic supervisor)
      {PlatformSupervisor, user_id},

      # Cloudflare live input/output management
      {CloudflareManager, user_id},

      # Alert processing and broadcasting
      {AlertManager, user_id}
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

  # Helper functions

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}}}
  end

  defp get_user_id_from_supervisor(pid) do
    # Extract user_id from the supervisor's registered name
    # This is a bit hacky but works for our use case
    case Registry.keys(Streampai.LivestreamManager.Registry, pid) do
      [{:user_stream_manager, user_id}] -> user_id
      [] -> nil
    end
  end
end
