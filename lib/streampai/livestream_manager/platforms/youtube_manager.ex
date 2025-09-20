defmodule Streampai.LivestreamManager.Platforms.YouTubeManager do
  @moduledoc """
  Manages YouTube platform integration for live streaming.
  Coordinates YouTube broadcast creation, Cloudflare Live Output management,
  and delegates chat/metrics monitoring to supervised child processes.
  """
  use GenServer

  alias Streampai.Cloudflare.APIClient, as: CloudflareAPI
  alias Streampai.LivestreamManager.Platforms.YouTube.ChatMonitor
  alias Streampai.LivestreamManager.Platforms.YouTube.MetricsMonitor
  alias Streampai.YouTube.ApiClient

  require Logger

  @activity_interval 30_000
  @state_debug_interval 10_000

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  def get_broadcast_id(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_broadcast_id)
  end

  def get_stream_metrics(user_id) when is_binary(user_id) do
    # Get metrics from MetricsMonitor and add is_active from YouTubeManager
    base_metrics =
      case MetricsMonitor.get_metrics(user_id) do
        {:ok, metrics} ->
          metrics

        {:error, _} ->
          %{viewer_count: 0, stream_title: nil, stream_description: nil, monitoring: false}
      end

    # Add is_active field by checking the manager's state
    try do
      is_active = GenServer.call(via_tuple(user_id), :get_is_active)
      Map.put(base_metrics, :is_active, is_active)
    catch
      :exit, _ -> Map.put(base_metrics, :is_active, false)
    end
  end

  @impl true
  def init({user_id, config}) do
    schedule_activity_log()
    schedule_state_debug()

    # Get the test registry name if we're in test mode
    registry_name =
      if Application.get_env(:streampai, :test_mode, false) and
           Map.has_key?(config, :test_registry_name) do
        config.test_registry_name
      else
        Streampai.LivestreamManager.Registry
      end

    # Store registry name in process dictionary for via_tuple access
    Process.put(:youtube_manager_registry, registry_name)

    state = %{
      user_id: user_id,
      platform: :youtube,
      config: config,
      registry_name: registry_name,
      is_active: false,
      started_at: DateTime.utc_now(),
      # YouTube broadcast state
      broadcast_id: nil,
      stream_id: nil,
      live_chat_id: nil,
      # Cloudflare integration
      live_output_id: nil,
      # Stream metadata
      stream_title: nil,
      stream_description: nil
    }

    Logger.info("[YouTubeManager:#{user_id}] Started - #{DateTime.utc_now()}")
    {:ok, state}
  end

  def start_streaming(user_id, stream_uuid) do
    GenServer.call(via_tuple(user_id), {:start_streaming, stream_uuid})
  end

  def stop_streaming(user_id) do
    GenServer.call(via_tuple(user_id), :stop_streaming)
  end

  def send_chat_message(pid, message) when is_pid(pid) do
    GenServer.call(pid, {:send_chat_message, message})
  end

  def send_chat_message(user_id, message) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:send_chat_message, message})
  end

  def update_stream_metadata(pid, metadata) when is_pid(pid) do
    GenServer.call(pid, {:update_stream_metadata, metadata})
  end

  def update_stream_metadata(user_id, metadata) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:update_stream_metadata, metadata})
  end

  # Server callbacks

  @impl true
  def handle_info(:log_activity, state) do
    if state.is_active do
      # Get metrics from the metrics monitor
      metrics = get_stream_metrics(state.user_id)

      Logger.info("[YouTubeManager:#{state.user_id}] YouTube streaming active - viewers: #{metrics.viewer_count}")
    else
      Logger.debug("[YouTubeManager:#{state.user_id}] Standby - #{DateTime.utc_now()}")
    end

    schedule_activity_log()
    {:noreply, state}
  end

  @impl true
  def handle_info(:debug_state, state) do
    state
    |> Map.put(:timestamp, DateTime.utc_now())
    |> Map.put(:process, self())
    |> dbg()

    schedule_state_debug()
    {:noreply, state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("[YouTubeManager:#{state.user_id}] Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Terminating: #{inspect(reason)}")

    # Stop monitoring processes gracefully (they might not exist)
    try do
      ChatMonitor.stop_monitoring(state.user_id)
    catch
      :exit, _ -> :ok
    end

    try do
      MetricsMonitor.stop_monitoring(state.user_id)
    catch
      :exit, _ -> :ok
    end

    cleanup_streaming_resources(state)

    :ok
  end

  @impl true
  def handle_call({:start_streaming, stream_uuid}, _from, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Starting YouTube stream: #{stream_uuid}")

    case start_youtube_streaming(state, stream_uuid) do
      {:ok, new_state} ->
        Logger.info("[YouTubeManager:#{state.user_id}] YouTube streaming started successfully")
        {:reply, :ok, new_state}

      {:error, reason} ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to start YouTube streaming: #{inspect(reason)}")

        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Stopping YouTube stream")

    {:ok, new_state} = stop_youtube_streaming(state)
    Logger.info("[YouTubeManager:#{state.user_id}] YouTube streaming stopped successfully")
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:send_chat_message, message}, _from, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Sending chat message: #{message}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:update_stream_metadata, metadata}, _from, state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Updating YouTube metadata: #{inspect(metadata)}")

    case update_youtube_metadata(state, metadata) do
      {:ok, new_state} ->
        {:reply, :ok, new_state}

      {:error, reason} ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to update metadata: #{inspect(reason)}")

        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:get_broadcast_id, _from, state) do
    {:reply, state.broadcast_id, state}
  end

  @impl true
  def handle_call(:get_is_active, _from, state) do
    {:reply, state.is_active, state}
  end

  @impl true
  def handle_call(request, _from, state) do
    Logger.debug("[YouTubeManager:#{state.user_id}] Unhandled call: #{inspect(request)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast(request, state) do
    Logger.debug("[YouTubeManager:#{state.user_id}] Unhandled cast: #{inspect(request)}")
    {:noreply, state}
  end

  # Private functions

  defp schedule_activity_log do
    Process.send_after(self(), :log_activity, @activity_interval)
  end

  defp schedule_state_debug do
    Process.send_after(self(), :debug_state, @state_debug_interval)
  end

  defp start_youtube_streaming(state, stream_uuid) do
    with {:ok, broadcast_data} <- create_youtube_broadcast(state, stream_uuid),
         {:ok, stream_data} <- create_youtube_stream(state, broadcast_data),
         {:ok, bound_broadcast} <- bind_stream_to_broadcast(state, broadcast_data, stream_data),
         {:ok, output_state} <- create_cloudflare_output(state, stream_data) do
      live_chat_id = get_in(bound_broadcast, ["snippet", "liveChatId"])

      # Start monitoring processes (non-blocking, failures don't stop the stream)
      if live_chat_id do
        ChatMonitor.start_monitoring(state.user_id, state.config.access_token, live_chat_id)
      end

      MetricsMonitor.start_monitoring(
        state.user_id,
        state.config.access_token,
        bound_broadcast["id"]
      )

      new_state = %{
        output_state
        | is_active: true,
          broadcast_id: bound_broadcast["id"],
          stream_id: stream_data["id"],
          live_chat_id: live_chat_id,
          stream_title: get_in(bound_broadcast, ["snippet", "title"]),
          stream_description: get_in(bound_broadcast, ["snippet", "description"])
      }

      {:ok, new_state}
    end
  end

  defp stop_youtube_streaming(state) do
    # Stop monitoring processes gracefully
    try do
      ChatMonitor.stop_monitoring(state.user_id)
    catch
      :exit, _ -> :ok
    end

    try do
      MetricsMonitor.stop_monitoring(state.user_id)
    catch
      :exit, _ -> :ok
    end

    # Delete Cloudflare Live Output
    if state.live_output_id do
      delete_cloudflare_output(state)
    end

    # End YouTube broadcast (this stops the stream)
    if state.broadcast_id do
      end_youtube_broadcast(state)
    end

    new_state = %{
      state
      | is_active: false,
        broadcast_id: nil,
        stream_id: nil,
        live_chat_id: nil,
        live_output_id: nil,
        stream_title: nil,
        stream_description: nil
    }

    {:ok, new_state}
  end

  defp create_youtube_broadcast(state, _stream_uuid) do
    Logger.info("[YouTubeManager:#{state.user_id}] Creating YouTube broadcast")

    # Default broadcast configuration
    scheduled_start_time = DateTime.to_iso8601(DateTime.utc_now())

    broadcast_data = %{
      snippet: %{
        title: "Streampai Live Stream - #{DateTime.to_date(DateTime.utc_now())}",
        description: "Live stream powered by Streampai",
        scheduledStartTime: scheduled_start_time
      },
      status: %{
        privacyStatus: "public",
        selfDeclaredMadeForKids: false
      },
      contentDetails: %{
        enableAutoStart: true,
        enableAutoStop: false,
        enableDvr: true,
        recordFromStart: false
      }
    }

    case ApiClient.insert_live_broadcast(
           state.config.access_token,
           "snippet,status,contentDetails",
           broadcast_data
         ) do
      {:ok, response} ->
        Logger.info("[YouTubeManager:#{state.user_id}] YouTube broadcast created: #{response["id"]}")

        {:ok, response}

      error ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to create YouTube broadcast: #{inspect(error)}")

        error
    end
  end

  defp create_youtube_stream(state, _broadcast_data) do
    Logger.info("[YouTubeManager:#{state.user_id}] Creating YouTube stream")

    stream_data = %{
      snippet: %{
        title: "Streampai Stream Input"
      },
      cdn: %{
        format: "1080p",
        ingestionType: "rtmp",
        resolution: "1080p",
        frameRate: "30fps"
      }
    }

    case ApiClient.insert_live_stream(
           state.config.access_token,
           "snippet,cdn",
           stream_data
         ) do
      {:ok, response} ->
        Logger.info("[YouTubeManager:#{state.user_id}] YouTube stream created: #{response["id"]}")
        {:ok, response}

      error ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to create YouTube stream: #{inspect(error)}")

        error
    end
  end

  defp bind_stream_to_broadcast(state, broadcast_data, stream_data) do
    Logger.info("[YouTubeManager:#{state.user_id}] Binding stream to broadcast")

    case ApiClient.bind_live_broadcast(
           state.config.access_token,
           broadcast_data["id"],
           "snippet,status",
           stream_id: stream_data["id"]
         ) do
      {:ok, response} ->
        Logger.info("[YouTubeManager:#{state.user_id}] Stream bound to broadcast successfully")
        {:ok, response}

      error ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to bind stream to broadcast: #{inspect(error)}")

        error
    end
  end

  defp create_cloudflare_output(state, stream_data) do
    Logger.info("[YouTubeManager:#{state.user_id}] Creating Cloudflare Live Output for YouTube")

    cloudflare_manager_pid = get_cloudflare_manager_pid(state)

    case get_cloudflare_input_id(cloudflare_manager_pid) do
      {:ok, input_id} ->
        # Extract YouTube RTMP details
        rtmp_url = get_in(stream_data, ["cdn", "ingestionInfo", "ingestionAddress"])
        stream_key = get_in(stream_data, ["cdn", "ingestionInfo", "streamName"])

        if rtmp_url && stream_key do
          output_config = %{
            rtmp_url: rtmp_url,
            stream_key: stream_key,
            enabled: true
          }

          case CloudflareAPI.create_live_output(input_id, output_config) do
            {:ok, output} ->
              Logger.info("[YouTubeManager:#{state.user_id}] Cloudflare Live Output created: #{output["uid"]}")

              {:ok, %{state | live_output_id: output["uid"]}}

            error ->
              Logger.error("[YouTubeManager:#{state.user_id}] Failed to create Cloudflare Live Output: #{inspect(error)}")

              error
          end
        else
          Logger.error("[YouTubeManager:#{state.user_id}] YouTube stream missing RTMP details")
          {:error, :missing_rtmp_details}
        end

      error ->
        Logger.error("[YouTubeManager:#{state.user_id}] Failed to get Cloudflare input ID: #{inspect(error)}")

        error
    end
  end

  defp delete_cloudflare_output(state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Deleting Cloudflare Live Output")

    cloudflare_manager_pid = get_cloudflare_manager_pid(state)

    case get_cloudflare_input_id(cloudflare_manager_pid) do
      {:ok, input_id} ->
        case CloudflareAPI.delete_live_output(input_id, state.live_output_id) do
          :ok ->
            Logger.info("[YouTubeManager:#{state.user_id}] Cloudflare Live Output deleted")
            :ok

          error ->
            Logger.warning("[YouTubeManager:#{state.user_id}] Failed to delete Cloudflare Live Output: #{inspect(error)}")

            # Don't fail stopping the stream if cleanup fails
            :ok
        end

      error ->
        Logger.warning(
          "[YouTubeManager:#{state.user_id}] Failed to get Cloudflare input ID for cleanup: #{inspect(error)}"
        )

        # Don't fail stopping the stream if cleanup fails
        :ok
    end
  end

  defp end_youtube_broadcast(state) do
    Logger.info("[YouTubeManager:#{state.user_id}] Ending YouTube broadcast")

    # Update broadcast status to complete
    broadcast_data = %{
      id: state.broadcast_id,
      status: %{
        lifeCycleStatus: "complete"
      }
    }

    case ApiClient.update_live_broadcast(
           state.config.access_token,
           "status",
           broadcast_data
         ) do
      {:ok, _} ->
        Logger.info("[YouTubeManager:#{state.user_id}] YouTube broadcast ended")
        :ok

      error ->
        Logger.warning("[YouTubeManager:#{state.user_id}] Failed to end YouTube broadcast: #{inspect(error)}")

        # Don't fail stopping if we can't clean up the broadcast
        :ok
    end
  end

  defp update_youtube_metadata(state, metadata) do
    if state.broadcast_id do
      broadcast_data = %{
        id: state.broadcast_id,
        snippet: %{
          title: metadata[:title] || state.stream_title,
          description: metadata[:description] || state.stream_description
        }
      }

      case ApiClient.update_live_broadcast(
             state.config.access_token,
             "snippet",
             broadcast_data
           ) do
        {:ok, response} ->
          new_state = %{
            state
            | stream_title: get_in(response, ["snippet", "title"]),
              stream_description: get_in(response, ["snippet", "description"])
          }

          {:ok, new_state}

        error ->
          error
      end
    else
      {:error, :not_streaming}
    end
  end

  defp get_cloudflare_manager_pid(state) do
    {:via, Registry, {state.registry_name, {:cloudflare_manager, state.user_id}}}
  end

  defp get_cloudflare_input_id(cloudflare_manager_pid) do
    config =
      Streampai.LivestreamManager.CloudflareManager.get_stream_config(cloudflare_manager_pid)

    if config.live_input_id do
      {:ok, config.live_input_id}
    else
      {:error, :no_input_id}
    end
  catch
    :exit, {:noproc, _} ->
      {:error, :cloudflare_manager_not_available}
  end

  defp cleanup_streaming_resources(state) do
    # Stop monitoring processes gracefully
    try do
      ChatMonitor.stop_monitoring(state.user_id)
    catch
      :exit, _ -> :ok
    end

    try do
      MetricsMonitor.stop_monitoring(state.user_id)
    catch
      :exit, _ -> :ok
    end

    if state.live_output_id do
      try do
        delete_cloudflare_output(state)
      catch
        _, _ -> :ok
      end
    end
  end

  defp via_tuple(user_id) do
    # Use the stored registry name from state when possible, fallback to global lookup
    registry_name =
      case Process.get(:youtube_manager_registry) do
        nil -> get_registry_name()
        registry -> registry
      end

    {:via, Registry, {registry_name, {:platform_manager, user_id, :youtube}}}
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
