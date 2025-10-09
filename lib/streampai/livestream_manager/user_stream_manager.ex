defmodule Streampai.LivestreamManager.UserStreamManager do
  @moduledoc """
  Main coordinator for a user's livestream management.
  This supervisor manages all user-specific streaming processes.
  """
  use Supervisor

  alias Streampai.Accounts.User
  alias Streampai.Jobs.ProcessFinishedLivestreamJob
  alias Streampai.LivestreamManager.AlertQueue
  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.LivestreamManager.LivestreamMetricsCollector
  alias Streampai.LivestreamManager.Platforms.FacebookManager
  alias Streampai.LivestreamManager.Platforms.KickManager
  alias Streampai.LivestreamManager.Platforms.TwitchManager
  alias Streampai.LivestreamManager.Platforms.YouTubeManager
  alias Streampai.LivestreamManager.PlatformSupervisor
  alias Streampai.LivestreamManager.StreamStateServer
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.MetadataHelper

  require Logger

  @platform_manager_startup_delay 100

  def start_link(user_id) when is_binary(user_id) do
    Supervisor.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    Logger.metadata(component: :user_stream_manager, user_id: user_id)

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
  Generates a livestream ID and starts platform processes.
  Creates a livestream database record.
  """
  def start_stream(user_id, metadata \\ %{}) when is_binary(user_id) do
    {:ok, user} = Ash.get(User, user_id, authorize?: false)
    livestream_id = Ash.UUID.generate()
    title = MetadataHelper.get_stream_title(metadata, livestream_id)
    description = Map.get(metadata, :description)
    thumbnail_file_id = Map.get(metadata, :thumbnail_file_id)

    livestream_attrs =
      %{id: livestream_id, user_id: user_id, started_at: DateTime.utc_now(), title: title}
      |> maybe_put(:description, description)
      |> maybe_put(:thumbnail_file_id, thumbnail_file_id)

    {:ok, _livestream} = Livestream.create(livestream_attrs, actor: user)

    StreamStateServer.start_stream(
      {:via, Registry, {get_registry_name(), {:stream_state, user_id}}},
      livestream_id
    )

    # Clean up any leftover outputs from previous streams before starting
    cloudflare_server = {:via, Registry, {get_registry_name(), {:cloudflare_manager, user_id}}}
    CloudflareManager.cleanup_all_outputs(cloudflare_server)

    CloudflareManager.start_streaming(cloudflare_server)

    start_metrics_collector(user_id, livestream_id)

    start_platform_streaming(user_id, livestream_id, metadata)

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, %{user_id: user_id, status: :streaming, livestream_id: livestream_id}}
    )

    {:ok, livestream_id}
  end

  @doc """
  Stops streaming for all connected platforms.
  Cleans up platform processes and updates stream state.
  Updates the livestream record's ended_at timestamp.
  """
  def stop_stream(user_id) when is_binary(user_id) do
    # Get current livestream ID before stopping
    stream_state = get_state(user_id)
    livestream_id = stream_state.livestream_id

    # Stop platform streaming processes
    stop_platform_streaming(user_id)

    # Stop metrics collector
    stop_metrics_collector(user_id)

    # Stop CloudflareManager streaming (disables live outputs and sets status to :inactive)
    cloudflare_server = {:via, Registry, {get_registry_name(), {:cloudflare_manager, user_id}}}
    CloudflareManager.stop_streaming(cloudflare_server)

    # Clean up all outputs to ensure they're deleted from Cloudflare
    CloudflareManager.cleanup_all_outputs(cloudflare_server)

    # Update stream state
    StreamStateServer.stop_stream({:via, Registry, {get_registry_name(), {:stream_state, user_id}}})

    # Update livestream record with ended_at timestamp
    if livestream_id do
      {:ok, user} = Ash.get(User, user_id, authorize?: false)
      {:ok, livestream} = Ash.get(Livestream, livestream_id, authorize?: false)

      {:ok, _updated_livestream} =
        Livestream.update(livestream, %{ended_at: DateTime.utc_now()}, actor: user)

      Logger.info("Updated livestream #{livestream_id} with end time")

      # Schedule post-stream processing job
      %{livestream_id: livestream_id}
      |> ProcessFinishedLivestreamJob.new()
      |> Oban.insert()

      Logger.info("Scheduled post-stream processing job for livestream #{livestream_id}")
    end

    # Broadcast stream status change
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, %{user_id: user_id, status: :inactive}}
    )

    :ok
  end

  # Helper functions

  defp start_platform_streaming(user_id, livestream_id, metadata) do
    active_platforms = get_active_platforms(user_id)
    Logger.info("Starting streaming on platforms: #{inspect(active_platforms)}")

    Enum.each(active_platforms, fn platform ->
      ensure_platform_manager_started(user_id, platform)
      start_platform(platform, user_id, livestream_id, metadata)
    end)
  end

  defp start_platform(:twitch, user_id, livestream_id, _metadata) do
    TwitchManager.start_streaming(user_id, livestream_id)
  end

  defp start_platform(:youtube, user_id, livestream_id, metadata) do
    YouTubeManager.start_streaming(user_id, livestream_id, metadata)
  end

  defp start_platform(:facebook, user_id, livestream_id, _metadata) do
    FacebookManager.start_streaming(user_id, livestream_id)
  end

  defp start_platform(:kick, user_id, livestream_id, _metadata) do
    KickManager.start_streaming(user_id, livestream_id)
  end

  defp start_platform(platform, _user_id, _livestream_id, _metadata) do
    Logger.warning("Unknown platform: #{platform}")
  end

  defp stop_platform_streaming(user_id) do
    active_platforms = get_active_platforms(user_id)
    Logger.info("Stopping streaming on platforms: #{inspect(active_platforms)}")

    Enum.each(active_platforms, &stop_platform(&1, user_id))
  end

  defp stop_platform(:twitch, user_id), do: TwitchManager.stop_streaming(user_id)
  defp stop_platform(:youtube, user_id), do: YouTubeManager.stop_streaming(user_id)
  defp stop_platform(:facebook, user_id), do: FacebookManager.stop_streaming(user_id)
  defp stop_platform(:kick, user_id), do: KickManager.stop_streaming(user_id)

  defp stop_platform(platform, _user_id) do
    Logger.warning("Unknown platform: #{platform}")
  end

  defp get_active_platforms(user_id) do
    with {:ok, user} <- Ash.get(User, user_id, authorize?: false),
         {:ok, user_with_accounts} <-
           Ash.get(User, user_id, actor: user, load: [:streaming_accounts]) do
      Enum.map(user_with_accounts.streaming_accounts, & &1.platform)
    else
      {:error, reason} ->
        Logger.warning("Could not load user or streaming accounts: #{inspect(reason)}")
        []
    end
  rescue
    e ->
      Logger.error("Exception loading user platforms: #{inspect(e)}")
      []
  end

  defp ensure_platform_manager_started(user_id, platform) do
    case Registry.lookup(get_registry_name(), {:platform_manager, user_id, platform}) do
      [{_pid, _}] ->
        :ok

      [] ->
        start_new_platform_manager(user_id, platform)
    end
  end

  defp start_new_platform_manager(user_id, platform) do
    case get_platform_config(user_id, platform) do
      {:ok, config} ->
        PlatformSupervisor.start_platform_manager(user_id, platform, config)
        Process.sleep(@platform_manager_startup_delay)

      {:error, reason} ->
        Logger.warning("Could not get config for #{platform}: #{inspect(reason)}")
    end
  end

  defp get_platform_config(user_id, platform) do
    with {:ok, user} <- Ash.get(User, user_id, authorize?: false),
         {:ok, user_with_accounts} <-
           Ash.get(User, user_id, actor: user, load: [:streaming_accounts]),
         %{} = account <-
           Enum.find(user_with_accounts.streaming_accounts, &(&1.platform == platform)) do
      format_platform_config(account)
    else
      nil -> {:error, :platform_not_found}
      {:error, reason} -> {:error, reason}
    end
  rescue
    e ->
      Logger.error("Exception getting platform config: #{inspect(e)}")
      {:error, e}
  end

  defp format_platform_config(%{
         access_token: token,
         refresh_token: refresh,
         access_token_expires_at: expires,
         extra_data: extra
       }) do
    {:ok,
     %{
       access_token: token,
       refresh_token: refresh,
       expires_at: expires,
       extra_data: extra
     }}
  end

  defp start_metrics_collector(user_id, stream_id) do
    case LivestreamMetricsCollector.start_link(user_id: user_id, stream_id: stream_id) do
      {:ok, pid} ->
        # Store PID in process dictionary for later cleanup
        Process.put({:metrics_collector_pid, user_id}, pid)
        Logger.info("Started metrics collector for stream #{stream_id}")
        pid

      {:error, reason} ->
        Logger.error("Failed to start metrics collector: #{inspect(reason)}")
        nil
    end
  end

  defp stop_metrics_collector(user_id) do
    case Process.get({:metrics_collector_pid, user_id}) do
      nil ->
        :ok

      pid when is_pid(pid) ->
        if Process.alive?(pid) do
          Process.exit(pid, :normal)
          Logger.info("Stopped metrics collector for user #{user_id}")
        end

        Process.delete({:metrics_collector_pid, user_id})
        :ok
    end
  end

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

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
