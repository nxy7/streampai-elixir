defmodule Streampai.LivestreamManager.UserStreamManager do
  @moduledoc """
  Main coordinator for a user's livestream management.
  This supervisor manages all user-specific streaming processes.
  """
  use Supervisor

  alias Streampai.Accounts.User
  alias Streampai.LivestreamManager.AlertQueue
  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.LivestreamManager.Platforms.FacebookManager
  alias Streampai.LivestreamManager.Platforms.KickManager
  alias Streampai.LivestreamManager.Platforms.TwitchManager
  alias Streampai.LivestreamManager.Platforms.YouTubeManager
  alias Streampai.LivestreamManager.PlatformSupervisor
  alias Streampai.LivestreamManager.StreamStateServer

  require Logger

  def start_link(user_id) when is_binary(user_id) do
    Supervisor.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    children = [
      {StreamStateServer, user_id},
      {CloudflareManager, user_id},
      {PlatformSupervisor, user_id},
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
    CloudflareManager.get_status(user_id)
  end

  def set_live_input_id(user_id, input_id) when is_binary(user_id) and is_binary(input_id) do
    CloudflareManager.set_live_input_id(user_id, input_id)
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

  @doc """
  Starts streaming for all connected platforms.
  Generates a stream UUID and starts platform processes.
  """
  def start_stream(user_id) when is_binary(user_id) do
    stream_uuid = Ecto.UUID.generate()

    # Update stream state
    StreamStateServer.start_stream(
      {:via, Registry, {get_registry_name(), {:stream_state, user_id}}},
      stream_uuid
    )

    # Start CloudflareManager streaming (enables live outputs and sets status to :streaming)
    CloudflareManager.start_streaming({:via, Registry, {get_registry_name(), {:cloudflare_manager, user_id}}})

    # Start platform streaming processes
    start_platform_streaming(user_id, stream_uuid)

    # Broadcast stream status change
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, %{user_id: user_id, status: :streaming, stream_uuid: stream_uuid}}
    )

    {:ok, stream_uuid}
  end

  @doc """
  Stops streaming for all connected platforms.
  Cleans up platform processes and updates stream state.
  """
  def stop_stream(user_id) when is_binary(user_id) do
    # Stop platform streaming processes
    stop_platform_streaming(user_id)

    # Stop CloudflareManager streaming (disables live outputs and sets status to :inactive)
    CloudflareManager.stop_streaming({:via, Registry, {get_registry_name(), {:cloudflare_manager, user_id}}})

    # Update stream state
    StreamStateServer.stop_stream({:via, Registry, {get_registry_name(), {:stream_state, user_id}}})

    # Broadcast stream status change
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, %{user_id: user_id, status: :inactive}}
    )

    :ok
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

  defp start_platform_streaming(user_id, stream_uuid) do
    # Get all active platforms from PlatformSupervisor
    active_platforms = get_active_platforms(user_id)

    Logger.info("[UserStreamManager:#{user_id}] Starting streaming on platforms: #{inspect(active_platforms)}")

    # Ensure platform managers are started and then start streaming on each platform
    Enum.each(active_platforms, fn platform ->
      # Ensure platform manager is started before calling it
      ensure_platform_manager_started(user_id, platform)

      case platform do
        :twitch ->
          TwitchManager.start_streaming(
            user_id,
            stream_uuid
          )

        :youtube ->
          YouTubeManager.start_streaming(
            user_id,
            stream_uuid
          )

        :facebook ->
          FacebookManager.start_streaming(
            user_id,
            stream_uuid
          )

        :kick ->
          KickManager.start_streaming(user_id, stream_uuid)

        _ ->
          Logger.warning("[UserStreamManager:#{user_id}] Unknown platform: #{platform}")
      end
    end)
  end

  defp stop_platform_streaming(user_id) do
    # Get all active platforms from PlatformSupervisor
    active_platforms = get_active_platforms(user_id)

    Logger.info("[UserStreamManager:#{user_id}] Stopping streaming on platforms: #{inspect(active_platforms)}")

    # Stop streaming on each platform
    Enum.each(active_platforms, fn platform ->
      case platform do
        :twitch ->
          TwitchManager.stop_streaming(user_id)

        :youtube ->
          YouTubeManager.stop_streaming(user_id)

        :facebook ->
          FacebookManager.stop_streaming(user_id)

        :kick ->
          KickManager.stop_streaming(user_id)

        _ ->
          Logger.warning("[UserStreamManager:#{user_id}] Unknown platform: #{platform}")
      end
    end)
  end

  # Get connected streaming accounts from database instead of looking at running processes
  # First get the user to use as actor
  defp get_active_platforms(user_id) do
    case Ash.get(User, user_id, authorize?: false) do
      {:ok, user} ->
        # Then get user with streaming accounts using the user as actor
        case Ash.get(User, user_id, actor: user, load: [:streaming_accounts]) do
          {:ok, user_with_accounts} ->
            Enum.map(user_with_accounts.streaming_accounts, & &1.platform)

          {:error, reason} ->
            Logger.warning("[UserStreamManager:#{user_id}] Could not load streaming accounts: #{inspect(reason)}")

            []
        end

      {:error, reason} ->
        Logger.warning("[UserStreamManager:#{user_id}] Could not load user: #{inspect(reason)}")
        []
    end
  rescue
    e ->
      Logger.error("[UserStreamManager:#{user_id}] Exception loading user platforms: #{inspect(e)}")

      []
  end

  defp ensure_platform_manager_started(user_id, platform) do
    # Check if platform manager is already running
    case Registry.lookup(get_registry_name(), {:platform_manager, user_id, platform}) do
      [{_pid, _}] ->
        # Platform manager already exists
        :ok

      [] ->
        # Platform manager doesn't exist, start it
        case get_platform_config(user_id, platform) do
          {:ok, config} ->
            PlatformSupervisor.start_platform_manager(user_id, platform, config)
            # Give it a moment to start
            Process.sleep(100)

          {:error, reason} ->
            Logger.warning("[UserStreamManager:#{user_id}] Could not get config for #{platform}: #{inspect(reason)}")
        end
    end
  end

  defp get_platform_config(user_id, platform) do
    with {:ok, user} <- Ash.get(User, user_id, authorize?: false),
         {:ok, user_with_accounts} <- Ash.get(User, user_id, actor: user, load: [:streaming_accounts]),
         %{} = account <- find_platform_account(user_with_accounts.streaming_accounts, platform) do
      format_platform_config(account)
    else
      nil -> {:error, :platform_not_found}
      {:error, reason} -> {:error, reason}
    end
  rescue
    e ->
      Logger.error("[UserStreamManager:#{user_id}] Exception getting platform config: #{inspect(e)}")
      {:error, e}
  end

  defp find_platform_account(streaming_accounts, platform) do
    Enum.find(streaming_accounts, &(&1.platform == platform))
  end

  defp format_platform_config(%{
    access_token: token,
    refresh_token: refresh,
    access_token_expires_at: expires,
    extra_data: extra
  }) do
    {:ok, %{
      access_token: token,
      refresh_token: refresh,
      expires_at: expires,
      extra_data: extra
    }}
  end
end
