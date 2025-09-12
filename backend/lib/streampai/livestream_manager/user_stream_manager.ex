defmodule Streampai.LivestreamManager.UserStreamManager do
  @moduledoc """
  Main coordinator for a user's livestream management.
  This supervisor manages all user-specific streaming processes.
  """
  use Supervisor

  alias Streampai.LivestreamManager.AlertQueue
  alias Streampai.LivestreamManager.CloudflareLiveInputMonitor
  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.LivestreamManager.PlatformSupervisor
  alias Streampai.LivestreamManager.StreamStateServer

  def start_link(user_id) when is_binary(user_id) do
    Supervisor.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    children = [
      {StreamStateServer, user_id},
      {CloudflareManager, user_id},
      {AlertQueue, user_id}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  # Public API

  def get_state(user_id) when is_binary(user_id) do
    StreamStateServer.get_state({:via, Registry, {get_registry_name(), {:stream_state, user_id}}})
  end

  def send_chat_message(user_id, message, platforms) when is_binary(user_id) do
    PlatformSupervisor.broadcast_message(user_id, message, platforms)
  end

  def update_stream_metadata(user_id, metadata, platforms) when is_binary(user_id) do
    PlatformSupervisor.update_metadata(user_id, metadata, platforms)
  end

  def configure_stream_outputs(user_id, platform_configs) when is_binary(user_id) do
    CloudflareManager.configure_outputs(
      {:via, Registry, {get_registry_name(), {:cloudflare_manager, user_id}}},
      platform_configs
    )
  end

  def get_stream_status(user_id) when is_binary(user_id) do
    CloudflareLiveInputMonitor.get_status(user_id)
  end

  def set_live_input_id(user_id, input_id) when is_binary(user_id) and is_binary(input_id) do
    CloudflareLiveInputMonitor.set_live_input_id(user_id, input_id)
  end

  def enqueue_alert(user_id, event) when is_binary(user_id) do
    AlertQueue.enqueue_event(
      {:via, Registry, {get_registry_name(), {:alert_queue, user_id}}},
      event
    )
  end

  def pause_alerts(user_id) when is_binary(user_id) do
    AlertQueue.pause_queue({:via, Registry, {get_registry_name(), {:alert_queue, user_id}}})
  end

  def resume_alerts(user_id) when is_binary(user_id) do
    AlertQueue.resume_queue({:via, Registry, {get_registry_name(), {:alert_queue, user_id}}})
  end

  def skip_alert(user_id) when is_binary(user_id) do
    AlertQueue.skip_event({:via, Registry, {get_registry_name(), {:alert_queue, user_id}}})
  end

  def clear_alert_queue(user_id) when is_binary(user_id) do
    AlertQueue.clear_queue({:via, Registry, {get_registry_name(), {:alert_queue, user_id}}})
  end

  def get_alert_queue_status(user_id) when is_binary(user_id) do
    AlertQueue.get_queue_status({:via, Registry, {get_registry_name(), {:alert_queue, user_id}}})
  end

  # Helper functions

  defp via_tuple(user_id) do
    {:via, Registry, {get_registry_name(), {:user_stream_manager, user_id}}}
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
