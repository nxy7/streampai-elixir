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
  alias Streampai.Stream.StreamActor

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

    params =
      metadata
      |> Map.take([
        :title,
        :description,
        :thumbnail_file_id,
        :category,
        :subcategory,
        :language,
        :tags
      ])
      |> Map.put_new(:tags, [])

    {:ok, livestream} = Livestream.start_livestream(user_id, params, actor: user)

    livestream_id = livestream.id

    # Update StreamActor state to streaming
    update_stream_actor_state(user_id, :streaming, livestream_id, "Starting stream...")

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

    # Update StreamActor with platforms info
    active_platforms = get_active_platforms(user_id)

    platforms_status =
      Map.new(active_platforms, fn platform -> {to_string(platform), "connecting"} end)

    update_stream_actor_platforms(
      user_id,
      platforms_status,
      "Streaming to #{length(active_platforms)} platform(s)"
    )

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, %{user_id: user_id, status: :streaming, livestream_id: livestream_id}}
    )

    {:ok, livestream_id}
  end

  @doc """
  Stops streaming for all connected platforms.
  Updates the livestream record's ended_at timestamp FIRST (most important),
  then cleans up platform processes and updates stream state.
  """
  def stop_stream(user_id) when is_binary(user_id) do
    Logger.info("stop_stream called for user #{user_id}")

    # Update StreamActor state to stopping
    update_stream_actor_status(user_id, :stopping, "Stopping stream...")

    # Get current livestream ID before stopping
    stream_state = get_state(user_id)
    livestream_id = stream_state.livestream_id

    Logger.info("Current livestream_id from state: #{inspect(livestream_id)}")

    # CRITICAL: Update livestream record with ended_at timestamp FIRST
    # This ensures the stream is marked as ended in the database even if cleanup fails
    if livestream_id do
      finalize_livestream(user_id, livestream_id)
    else
      Logger.warning("No active livestream_id found in state for user #{user_id}")
    end

    # Now perform cleanup operations (these can fail without preventing DB update)
    # Stop platform streaming processes
    safe_cleanup(fn -> stop_platform_streaming(user_id) end, "stop platform streaming")

    # Stop metrics collector
    safe_cleanup(fn -> stop_metrics_collector(user_id) end, "stop metrics collector")

    # Stop CloudflareManager streaming (disables live outputs and sets status to :inactive)
    cloudflare_server = {:via, Registry, {get_registry_name(), {:cloudflare_manager, user_id}}}

    safe_cleanup(
      fn -> CloudflareManager.stop_streaming(cloudflare_server) end,
      "stop cloudflare streaming"
    )

    # Clean up all outputs to ensure they're deleted from Cloudflare
    safe_cleanup(
      fn -> CloudflareManager.cleanup_all_outputs(cloudflare_server) end,
      "cleanup cloudflare outputs"
    )

    # Update stream state
    safe_cleanup(
      fn ->
        StreamStateServer.stop_stream({:via, Registry, {get_registry_name(), {:stream_state, user_id}}})
      end,
      "update stream state"
    )

    # Update StreamActor state to idle
    update_stream_actor_stopped(user_id, "Stream ended")

    # Broadcast stream status change
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_status:#{user_id}",
      {:stream_status_changed, %{user_id: user_id, status: :inactive}}
    )

    :ok
  end

  # Helper functions

  defp safe_cleanup(cleanup_fn, operation_name) do
    cleanup_fn.()
  rescue
    error ->
      Logger.error("Error during cleanup (#{operation_name}): #{inspect(error)}")
      :ok
  catch
    :exit, reason ->
      Logger.error("Exit during cleanup (#{operation_name}): #{inspect(reason)}")
      :ok

    kind, value ->
      Logger.error("Caught #{kind} during cleanup (#{operation_name}): #{inspect(value)}")
      :ok
  end

  defp finalize_livestream(user_id, livestream_id) do
    Logger.info("Attempting to finalize livestream #{livestream_id}")
    {:ok, user} = Ash.get(User, user_id, authorize?: false)
    {:ok, livestream} = Ash.get(Livestream, livestream_id, authorize?: false)

    Logger.info("Livestream #{livestream_id} current ended_at: #{inspect(livestream.ended_at)}")

    # Check if already ended before attempting to end it
    if livestream.ended_at do
      Logger.info(
        "Livestream #{livestream_id} is already ended at #{inspect(livestream.ended_at)}, skipping duplicate end"
      )

      # Still schedule post-processing if it hasn't been done yet
      schedule_post_stream_processing(livestream_id)
    else
      # Reload livestream just before ending to catch any race conditions
      Logger.info("Reloading livestream #{livestream_id} just before ending to ensure fresh data...")

      {:ok, fresh_livestream} = Ash.get(Livestream, livestream_id, authorize?: false)

      Logger.info("Fresh livestream #{livestream_id} ended_at: #{inspect(fresh_livestream.ended_at)}")

      if fresh_livestream.ended_at do
        Logger.info(
          "Livestream #{livestream_id} was ended by another process (ended_at: #{inspect(fresh_livestream.ended_at)}), skipping"
        )

        schedule_post_stream_processing(livestream_id)
      else
        case Livestream.end_livestream(fresh_livestream, actor: user) do
          {:ok, updated_livestream} ->
            Logger.info(
              "Successfully ended livestream #{livestream_id}, ended_at: #{inspect(updated_livestream.ended_at)}"
            )

            schedule_post_stream_processing(livestream_id)

          {:error, %Ash.Error.Invalid{errors: errors}} ->
            handle_livestream_end_error(livestream_id, errors)

          {:error, error} ->
            Logger.error("Unexpected error ending livestream #{livestream_id}: #{inspect(error)}")
        end
      end
    end
  end

  defp schedule_post_stream_processing(livestream_id) do
    Logger.info("Updated livestream #{livestream_id} with end time")

    %{livestream_id: livestream_id}
    |> ProcessFinishedLivestreamJob.new()
    |> Oban.insert()

    Logger.info("Scheduled post-stream processing job for livestream #{livestream_id}")
  end

  defp handle_livestream_end_error(livestream_id, errors) do
    # Log ALL error details for debugging
    Logger.error("Failed to end livestream #{livestream_id}. Full error details:")

    Enum.each(errors, fn error ->
      Logger.error(
        "  - Field: #{inspect(error.field)}, Message: #{inspect(error.message)}, Full error: #{inspect(error)}"
      )
    end)

    if stream_already_ended?(errors) do
      Logger.info(
        "Livestream #{livestream_id} was already ended (likely by auto-stop on disconnect), skipping duplicate end"
      )
    else
      Logger.error("Failed to end livestream #{livestream_id} with unexpected error: #{inspect(errors)}")
    end
  end

  defp stream_already_ended?(errors) do
    Enum.any?(errors, fn error ->
      error.field == :ended_at and error.message =~ "already ended"
    end)
  end

  defp start_platform_streaming(user_id, livestream_id, metadata) do
    active_platforms = get_active_platforms(user_id)
    Logger.info("Starting streaming on platforms: #{inspect(active_platforms)}")

    # Start all platforms concurrently
    tasks =
      Enum.map(active_platforms, fn platform ->
        Task.async(fn ->
          try do
            ensure_platform_manager_started(user_id, platform)
            start_platform(platform, user_id, livestream_id, metadata)
            {platform, :ok}
          rescue
            error ->
              Logger.error("Failed to start platform #{platform}: #{inspect(error)}")
              {platform, {:error, error}}
          catch
            kind, value ->
              Logger.error("Caught #{kind} while starting platform #{platform}: #{inspect(value)}")

              {platform, {:error, {kind, value}}}
          end
        end)
      end)

    # Wait for all platforms to start (with 30 second timeout per platform)
    results = Task.await_many(tasks, 30_000)

    # Log results
    Enum.each(results, fn {platform, result} ->
      Logger.info("Platform #{platform} start result: #{inspect(result)}")
    end)
  end

  defp start_platform(:twitch, user_id, livestream_id, metadata) do
    TwitchManager.start_streaming(user_id, livestream_id, metadata)
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

    # Stop all platforms concurrently
    tasks =
      Enum.map(active_platforms, fn platform ->
        Task.async(fn ->
          try do
            stop_platform(platform, user_id)
            {platform, :ok}
          rescue
            error ->
              Logger.error("Failed to stop platform #{platform}: #{inspect(error)}")
              {platform, {:error, error}}
          catch
            kind, value ->
              Logger.error("Caught #{kind} while stopping platform #{platform}: #{inspect(value)}")

              {platform, {:error, {kind, value}}}
          end
        end)
      end)

    # Wait for all platforms to stop (with 30 second timeout per platform)
    results = Task.await_many(tasks, 30_000)

    # Log results
    Enum.each(results, fn {platform, result} ->
      Logger.info("Platform #{platform} stop result: #{inspect(result)}")
    end)
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

  # StreamActor helper functions

  defp update_stream_actor_state(user_id, status, livestream_id, status_message) do
    Task.start(fn ->
      case StreamActor.mark_streaming(user_id, livestream_id, status_message) do
        {:ok, _actor} ->
          Logger.debug("Updated StreamActor to #{status} for user #{user_id}")

        {:error, reason} ->
          Logger.warning("Failed to update StreamActor: #{inspect(reason)}")
      end
    end)
  end

  defp update_stream_actor_status(user_id, status, status_message) do
    Task.start(fn ->
      case StreamActor.update_for_user(user_id, %{status: status, status_message: status_message}) do
        {:ok, _actor} ->
          Logger.debug("Updated StreamActor status to #{status} for user #{user_id}")

        {:error, reason} ->
          Logger.warning("Failed to update StreamActor status: #{inspect(reason)}")
      end
    end)
  end

  defp update_stream_actor_platforms(user_id, platforms_status, status_message) do
    Task.start(fn ->
      case StreamActor.update_for_user(user_id, %{
             platforms: platforms_status,
             status_message: status_message
           }) do
        {:ok, _actor} ->
          Logger.debug("Updated StreamActor platforms for user #{user_id}")

        {:error, reason} ->
          Logger.warning("Failed to update StreamActor platforms: #{inspect(reason)}")
      end
    end)
  end

  defp update_stream_actor_stopped(user_id, status_message) do
    Task.start(fn ->
      case StreamActor.mark_stopped(user_id, status_message) do
        {:ok, _actor} ->
          Logger.debug("Updated StreamActor to stopped for user #{user_id}")

        {:error, reason} ->
          Logger.warning("Failed to update StreamActor stopped: #{inspect(reason)}")
      end
    end)
  end

  @doc """
  Updates the StreamActor viewer count for a specific platform.
  Called by platform managers when they receive viewer count updates.
  """
  def update_stream_actor_viewers(user_id, platform, viewer_count)
      when is_binary(user_id) and is_atom(platform) and is_integer(viewer_count) do
    Task.start(fn ->
      case StreamActor.update_viewer_count(user_id, platform, viewer_count) do
        {:ok, _actor} ->
          Logger.debug("Updated StreamActor #{platform} viewers to #{viewer_count} for user #{user_id}")

        {:error, reason} ->
          Logger.warning("Failed to update StreamActor viewers: #{inspect(reason)}")
      end
    end)
  end

  @doc """
  Reports an error to the StreamActor.
  Called when the stream encounters an error condition.
  """
  def report_stream_error(user_id, error_message) when is_binary(user_id) and is_binary(error_message) do
    Task.start(fn ->
      case StreamActor.mark_error(user_id, error_message) do
        {:ok, _actor} ->
          Logger.info("Reported error to StreamActor for user #{user_id}: #{error_message}")

        {:error, reason} ->
          Logger.warning("Failed to report error to StreamActor: #{inspect(reason)}")
      end
    end)
  end
end
