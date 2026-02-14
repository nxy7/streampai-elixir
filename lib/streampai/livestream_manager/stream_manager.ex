defmodule Streampai.LivestreamManager.StreamManager do
  @moduledoc """
  State machine managing a user's livestream lifecycle.

  Uses `:gen_statem` with `:handle_event_function` and `:state_enter` callback
  modes. The process state (`:initializing`, `:offline`, `:ready`, `:streaming`,
  `:disconnected`, `:stopping`, `:error`) replaces the old `status`,
  `stream_status`, and `input_streaming_status` fields.

  Every state transition is logged automatically via the `:enter` callback.

  Delegates to extracted modules for specific concerns:
  - `Actions.StartStream` / `Actions.StopStream` — stream lifecycle
  - `BroadcastStrategy` — polymorphic RTMP relay (Cloudflare / Membrane)
  - `PlatformCoordinator` — multi-platform streaming
  - `LivestreamFinalizer` — livestream record finalization
  """

  @behaviour :gen_statem

  alias Streampai.LivestreamManager.AlertQueue
  alias Streampai.LivestreamManager.BroadcastStrategy
  alias Streampai.LivestreamManager.HookExecutor
  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.LivestreamManager.StreamManager.Actions.StartStream
  alias Streampai.LivestreamManager.StreamManager.Actions.StopStream
  alias Streampai.LivestreamManager.StreamManager.PlatformCoordinator
  alias Streampai.LivestreamManager.StreamServices
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.PlatformStatus

  require Logger

  defstruct [
    :user_id,
    :livestream_id,
    :started_at,
    :strategy_module,
    :strategy_state,
    :horizontal_input,
    :vertical_input,
    :services_pid,
    :metrics_collector_pid
  ]

  # ── gen_statem callbacks ────────────────────────────────────────

  @impl true
  def callback_mode, do: [:handle_event_function, :state_enter]

  def child_spec(user_id) do
    %{
      id: {__MODULE__, user_id},
      start: {__MODULE__, :start_link, [user_id]},
      restart: :transient
    }
  end

  # ── Client API ──────────────────────────────────────────────────

  def start_link(user_id) when is_binary(user_id) do
    :gen_statem.start_link(
      RegistryHelpers.via_tuple(:stream_manager, user_id),
      __MODULE__,
      user_id,
      []
    )
  end

  def get_state(user_id) when is_binary(user_id) do
    :gen_statem.call(via(user_id), :get_state, 15_000)
  end

  def get_stream_config(user_id) when is_binary(user_id) do
    :gen_statem.call(via(user_id), :get_stream_config, 15_000)
  end

  def get_stream_status(user_id) when is_binary(user_id) do
    :gen_statem.call(via(user_id), :get_detailed_status, 15_000)
  end

  def get_ingest_credentials(user_id, orientation) when is_binary(user_id) do
    :gen_statem.call(via(user_id), {:get_ingest_credentials, orientation}, 15_000)
  end

  def regenerate_ingest_credentials(user_id, orientation) when is_binary(user_id) do
    :gen_statem.call(via(user_id), {:regenerate_ingest_credentials, orientation}, 30_000)
  end

  def start_stream(user_id, metadata \\ %{}) when is_binary(user_id) do
    :gen_statem.call(via(user_id), {:start_stream, metadata}, 60_000)
  end

  def stop_stream(user_id) when is_binary(user_id) do
    :gen_statem.call(via(user_id), :stop_stream, 60_000)
  end

  def send_chat_message(user_id, message, platforms \\ :all, sent_event_id \\ nil) do
    StreamServices.broadcast_message(user_id, message, platforms, sent_event_id)
  end

  def update_stream_metadata(user_id, metadata, platforms \\ :all) do
    StreamServices.update_metadata(user_id, metadata, platforms)
  end

  def toggle_platform(user_id, platform, enabled) when is_binary(user_id) and is_atom(platform) and is_boolean(enabled) do
    :gen_statem.call(via(user_id), {:toggle_platform, platform, enabled}, 30_000)
  end

  def set_live_input_id(user_id, input_id) when is_binary(user_id) and is_binary(input_id) do
    :gen_statem.call(via(user_id), {:set_live_input_id, input_id}, 15_000)
  end

  def regenerate_live_input(user_id, orientation \\ :horizontal) when is_binary(user_id) do
    :gen_statem.call(via(user_id), {:regenerate_live_input, orientation}, 15_000)
  end

  def cleanup_all_outputs(server) do
    :gen_statem.call(server, :cleanup_all_outputs, 15_000)
  end

  def handle_webhook_event(user_id, event_type) when is_binary(user_id) do
    :gen_statem.cast(via(user_id), {:webhook_event, event_type})
  end

  # Alert queue delegation (no state machine interaction)
  def enqueue_alert(user_id, event) when is_binary(user_id) do
    AlertQueue.enqueue_event(RegistryHelpers.via_tuple(:alert_queue, user_id), event)
  end

  def replay_alert(user_id, event) when is_binary(user_id) do
    AlertQueue.replay_event(RegistryHelpers.via_tuple(:alert_queue, user_id), event)
  end

  def pause_alerts(user_id), do: AlertQueue.pause_queue(RegistryHelpers.via_tuple(:alert_queue, user_id))

  def resume_alerts(user_id), do: AlertQueue.resume_queue(RegistryHelpers.via_tuple(:alert_queue, user_id))

  def skip_alert(user_id), do: AlertQueue.skip_event(RegistryHelpers.via_tuple(:alert_queue, user_id))

  def clear_alert_queue(user_id), do: AlertQueue.clear_queue(RegistryHelpers.via_tuple(:alert_queue, user_id))

  def get_alert_queue_status(user_id), do: AlertQueue.get_queue_status(RegistryHelpers.via_tuple(:alert_queue, user_id))

  def update_stream_actor_viewers(user_id, platform, viewer_count)
      when is_binary(user_id) and is_atom(platform) and is_integer(viewer_count) do
    :gen_statem.cast(via(user_id), {:update_actor_viewers, platform, viewer_count})
  end

  def report_stream_error(user_id, error_message) when is_binary(user_id) and is_binary(error_message) do
    :gen_statem.cast(via(user_id), {:report_stream_error, error_message})
  end

  def report_platform_status(user_id, platform, %PlatformStatus{} = status)
      when is_binary(user_id) and is_atom(platform) do
    :gen_statem.cast(via(user_id), {:report_platform_status, platform, status})
  end

  def report_platform_stopped(user_id, platform) when is_binary(user_id) and is_atom(platform) do
    :gen_statem.cast(via(user_id), {:report_platform_stopped, platform})
  end

  # ── Init ────────────────────────────────────────────────────────

  @impl true
  def init(user_id) do
    Logger.metadata(component: :stream_manager, user_id: user_id)

    strategy_module = BroadcastStrategy.strategy_for_user(user_id)

    data = %__MODULE__{
      user_id: user_id,
      strategy_module: strategy_module
    }

    {:ok, services_pid} = StreamServices.start_link(user_id)
    data = %{data | services_pid: services_pid}

    Logger.info("[StreamManager] started for user #{user_id}")
    {:ok, :initializing, data, [{:next_event, :internal, :initialize}]}
  end

  # ══════════════════════════════════════════════════════════════════
  # State enter — logs every transition
  # ══════════════════════════════════════════════════════════════════

  @impl true
  def handle_event(:enter, old_state, new_state, _data) when old_state != new_state do
    Logger.info("[StreamManager] #{old_state} -> #{new_state}")
    :keep_state_and_data
  end

  def handle_event(:enter, same, same, _data) do
    :keep_state_and_data
  end

  # ══════════════════════════════════════════════════════════════════
  # :initializing — setting up broadcast strategy
  # ══════════════════════════════════════════════════════════════════

  def handle_event(:internal, :initialize, :initializing, data) do
    data = load_stream_actor_state(data)

    case data.strategy_module.init(data.user_id, self()) do
      {:ok, %{state: strategy_state, horizontal_input: horizontal, vertical_input: vertical}} ->
        data = %{
          data
          | strategy_state: strategy_state,
            horizontal_input: horizontal,
            vertical_input: vertical
        }

        Logger.info("[StreamManager] inputs ready: H=#{horizontal.input_id}, V=#{vertical.input_id}")

        write_cloudflare_update(data.user_id, %{live_input_uid: horizontal.input_id})

        # The strategy will send {:strategy_event, :encoder_connected/:encoder_disconnected}
        # to determine if encoder is already connected. For now, pick initial state
        # based on DB state only — the strategy's first poll/push will correct it.
        initial_state =
          if data.livestream_id == nil do
            :offline
            # DB says streaming — go to :disconnected so the strategy event
            # or auto-stop timeout can resolve it

            # Reattach platform managers (non-blocking)
          else
            Logger.info("[StreamManager] DB says streaming, entering :disconnected pending encoder check")

            maybe_reattach_platforms(data)

            if data.started_at do
              StreamServices.start_stream_timer_server(data.user_id, data.started_at)
              StreamServices.start_chat_bot_server(data.user_id, data.started_at)
            end

            :disconnected
          end

        {:next_state, initial_state, data}

      {:error, reason} ->
        Logger.error("[StreamManager] failed to initialize strategy: #{inspect(reason)}")

        write_stream_actor_error(
          data.user_id,
          "Failed to initialize broadcast strategy: #{inspect(reason)}"
        )

        Process.send_after(self(), :retry_initialize, 30_000)
        {:next_state, :error, data}
    end
  end

  # ══════════════════════════════════════════════════════════════════
  # :disconnected — auto-stop timeout
  # ══════════════════════════════════════════════════════════════════

  def handle_event(:state_timeout, :auto_stop, :disconnected, data) do
    Logger.warning("[StreamManager] AUTO-STOP: encoder disconnected for 10+ seconds")
    StreamServices.stop_stream_timer_server(data.user_id)
    StreamServices.stop_chat_bot_server(data.user_id)

    HookExecutor.trigger_lifecycle_event(data.user_id, :stream_end, %{
      livestream_id: data.livestream_id,
      stopped_at: DateTime.utc_now(),
      reason: :auto_stop
    })

    write_stream_actor_error(data.user_id, "Stream disconnected for 10+ seconds - auto-stopped")
    {:ok, data} = StopStream.execute(data)
    CurrentStreamData.clear_all_platforms(data.user_id)
    next_state = stopped_target_state(data)
    live_input_uid = data.horizontal_input && data.horizontal_input.input_id

    write_cloudflare_update(data.user_id, %{
      input_streaming: next_state == :ready,
      live_input_uid: live_input_uid
    })

    {:next_state, next_state, data}
  end

  # ══════════════════════════════════════════════════════════════════
  # Strategy events — pushed by the broadcast strategy
  # ══════════════════════════════════════════════════════════════════

  def handle_event(:info, {:strategy_event, :encoder_connected}, state, data) do
    {next_state, data, actions} = apply_input_status_change(:live, state, data)
    {:next_state, next_state, data, actions}
  end

  def handle_event(:info, {:strategy_event, :encoder_disconnected}, state, data) do
    {next_state, data, actions} = apply_input_status_change(:offline, state, data)
    {:next_state, next_state, data, actions}
  end

  def handle_event(:info, {:strategy_event, :input_deleted}, _state, data) do
    Logger.warning("[StreamManager] input deleted, reinitializing...")

    case data.strategy_module.handle_input_deletion(data.strategy_state) do
      {:reinitialize, new_strategy_state} ->
        data = %{
          data
          | strategy_state: new_strategy_state,
            horizontal_input: nil,
            vertical_input: nil
        }

        send(self(), :retry_initialize)
        {:next_state, :initializing, data}

      :ok ->
        :keep_state_and_data
    end
  end

  # Forward poll timer to the strategy (Cloudflare uses this internally)
  def handle_event(:info, :broadcast_strategy_poll, _state, data) do
    new_strategy_state = BroadcastStrategy.Cloudflare.handle_poll_message(data.strategy_state)
    {:keep_state, %{data | strategy_state: new_strategy_state}}
  end

  # Membrane RTMPServer notifies us that an encoder connected
  def handle_event(:info, {:membrane_client_connected, client_ref}, state, data) do
    case data.strategy_module do
      BroadcastStrategy.Membrane ->
        new_strategy_state =
          BroadcastStrategy.Membrane.handle_new_client(data.strategy_state, client_ref)

        data = %{data | strategy_state: new_strategy_state}

        # The pipeline is started — treat as encoder connected
        if new_strategy_state.pipeline_pid do
          {next_state, data, actions} = apply_input_status_change(:live, state, data)
          {:next_state, next_state, data, actions}
        else
          :keep_state_and_data
        end

      _ ->
        :keep_state_and_data
    end
  end

  # Membrane pipeline reports input bitrate
  def handle_event(:info, {:membrane_bitrate, bitrate_kbps}, _state, data) do
    write_cloudflare_update(data.user_id, %{input_bitrate_kbps: bitrate_kbps})
    :keep_state_and_data
  end

  # A single RTMP output sink crashed (crash group isolated it from the rest)
  def handle_event(:info, {:output_crashed, handle, platform}, _state, data) do
    Logger.warning("[StreamManager] Output #{handle} (#{platform}) crashed — removing from state")

    data =
      if data.strategy_state do
        update_in(data, [:strategy_state, :outputs], &Map.delete(&1, handle))
      else
        data
      end

    {:keep_state, data}
  end

  # Membrane pipeline process crashed — treat as encoder disconnected
  def handle_event(:info, {:DOWN, _ref, :process, pid, _reason}, state, data) do
    if data.strategy_state && data.strategy_state[:pipeline_pid] == pid do
      Logger.warning("[StreamManager] Membrane pipeline down, treating as encoder disconnect")
      data = put_in(data, [:strategy_state, :pipeline_pid], nil)
      {next_state, data, actions} = apply_input_status_change(:offline, state, data)
      {:next_state, next_state, data, actions}
    else
      :keep_state_and_data
    end
  end

  # Retry initialization from error state
  def handle_event(:info, :retry_initialize, :error, data) do
    handle_event(:internal, :initialize, :initializing, data)
  end

  # Re-initialize input if deleted (from any active state)
  def handle_event(:info, :retry_initialize, state, data) when state in [:offline, :ready, :streaming, :disconnected] do
    handle_event(:internal, :initialize, :initializing, data)
  end

  # ══════════════════════════════════════════════════════════════════
  # Calls — state-specific: start_stream
  # ══════════════════════════════════════════════════════════════════

  def handle_event({:call, from}, {:start_stream, metadata}, :ready, data) do
    # Inject broadcast strategy so platforms can create relay outputs
    metadata = Map.put(metadata, :broadcast_strategy, {data.strategy_module, data.strategy_state})

    case StartStream.execute(data, metadata) do
      {:ok, livestream_id, data} ->
        StreamServices.start_stream_timer_server(data.user_id, data.started_at)
        StreamServices.start_chat_bot_server(data.user_id, data.started_at)

        HookExecutor.trigger_lifecycle_event(data.user_id, :stream_start, %{
          livestream_id: livestream_id,
          started_at: data.started_at
        })

        {:next_state, :streaming, data, [{:reply, from, {:ok, livestream_id}}]}

      {:error, reason} ->
        Logger.error("[STREAM_MANAGER] start_stream failed: #{inspect(reason)}")
        {:keep_state_and_data, [{:reply, from, {:error, reason}}]}
    end
  end

  def handle_event({:call, from}, {:start_stream, _}, :offline, _data) do
    {:keep_state_and_data, [{:reply, from, {:error, :encoder_not_connected}}]}
  end

  def handle_event({:call, from}, {:start_stream, _}, :streaming, _data) do
    {:keep_state_and_data, [{:reply, from, {:error, :already_streaming}}]}
  end

  def handle_event({:call, from}, {:start_stream, _}, state, _data)
      when state in [:initializing, :error, :disconnected, :stopping] do
    {:keep_state_and_data, [{:reply, from, {:error, state}}]}
  end

  # ══════════════════════════════════════════════════════════════════
  # Calls — state-specific: stop_stream
  # ══════════════════════════════════════════════════════════════════

  def handle_event({:call, from}, :stop_stream, state, data) when state in [:streaming, :disconnected] do
    StreamServices.stop_stream_timer_server(data.user_id)
    StreamServices.stop_chat_bot_server(data.user_id)

    HookExecutor.trigger_lifecycle_event(data.user_id, :stream_end, %{
      livestream_id: data.livestream_id,
      stopped_at: DateTime.utc_now()
    })

    {:ok, data} = StopStream.execute(data)
    CurrentStreamData.clear_all_platforms(data.user_id)
    next_state = stopped_target_state(data)
    live_input_uid = data.horizontal_input && data.horizontal_input.input_id

    write_cloudflare_update(data.user_id, %{
      input_streaming: next_state == :ready,
      live_input_uid: live_input_uid
    })

    {:next_state, next_state, data, [{:reply, from, :ok}]}
  end

  def handle_event({:call, from}, :stop_stream, state, data) do
    Logger.warning("[StreamManager] stop_stream called in unexpected state: #{state}, forcing DB cleanup")

    # Force-clean the DB state so the frontend sees "idle" even though
    # the gen_statem wasn't in :streaming. This handles the case where
    # the gen_statem restarted (losing its state) but the DB still says "streaming".
    case CurrentStreamData.get_by_user(data.user_id, actor: Streampai.SystemActor.system()) do
      {:ok, record} when not is_nil(record) ->
        if record.status == "streaming" do
          Logger.warning("[StreamManager] DB still says 'streaming', forcing mark_stopped")
          CurrentStreamData.mark_stopped_record(record, "Stream stopped (state recovery)")
        end

      _ ->
        :ok
    end

    {:keep_state_and_data, [{:reply, from, :ok}]}
  end

  # ══════════════════════════════════════════════════════════════════
  # Calls — state-specific: toggle_platform (streaming only)
  # ══════════════════════════════════════════════════════════════════

  def handle_event({:call, from}, {:toggle_platform, platform, true}, :streaming, data) do
    Logger.info("[StreamManager] enabling platform #{platform} mid-stream")
    user_id = data.user_id
    livestream_id = data.livestream_id

    # Read current stream metadata so the new platform gets the correct title/description.
    metadata =
      case CurrentStreamData.get_by_user(user_id, actor: Streampai.SystemActor.system()) do
        {:ok, record} when not is_nil(record) ->
          sd = record.stream_data || %{}

          %{}
          |> then(fn m -> if sd["title"], do: Map.put(m, :title, sd["title"]), else: m end)
          |> then(fn m ->
            if sd["description"], do: Map.put(m, :description, sd["description"]), else: m
          end)
          |> then(fn m -> if sd["tags"], do: Map.put(m, :tags, sd["tags"]), else: m end)
          |> then(fn m ->
            if sd["thumbnail_file_id"],
              do: Map.put(m, :thumbnail_file_id, sd["thumbnail_file_id"]),
              else: m
          end)

        _ ->
          %{}
      end

    metadata = Map.put(metadata, :broadcast_strategy, {data.strategy_module, data.strategy_state})

    result =
      case PlatformCoordinator.start_streaming(user_id, livestream_id, metadata, [platform]) do
        {[{^platform, :ok}], _failed} ->
          Logger.info("[StreamManager] platform #{platform} enabled successfully")
          :ok

        {_succeeded, [{^platform, {:error, reason}}]} ->
          Logger.error("[StreamManager] failed to enable platform #{platform}: #{inspect(reason)}")

          {:error, reason}

        _ ->
          {:error, :unknown_platform_error}
      end

    {:keep_state_and_data, [{:reply, from, result}]}
  end

  def handle_event({:call, from}, {:toggle_platform, platform, false}, :streaming, data) do
    Logger.info("[StreamManager] disabling platform #{platform} mid-stream")
    PlatformCoordinator.stop_single_platform(data.user_id, platform)
    CurrentStreamData.remove_platform_status(data.user_id, platform)
    {:keep_state_and_data, [{:reply, from, :ok}]}
  end

  def handle_event({:call, from}, {:toggle_platform, _platform, _enabled}, state, _data) do
    Logger.warning("[StreamManager] toggle_platform called in unexpected state: #{state}")
    {:keep_state_and_data, [{:reply, from, {:error, :not_streaming}}]}
  end

  # ══════════════════════════════════════════════════════════════════
  # Calls — common (any state)
  # ══════════════════════════════════════════════════════════════════

  def handle_event({:call, from}, :get_state, state, data) do
    {:keep_state_and_data, [{:reply, from, build_legacy_state(state, data)}]}
  end

  def handle_event({:call, from}, :get_stream_config, state, data) do
    {:keep_state_and_data, [{:reply, from, data.strategy_module.build_stream_config(data.strategy_state, state)}]}
  end

  def handle_event({:call, from}, :get_detailed_status, state, data) do
    {:keep_state_and_data, [{:reply, from, build_detailed_status(state, data)}]}
  end

  def handle_event({:call, from}, {:get_ingest_credentials, orientation}, _state, data) do
    result = data.strategy_module.get_ingest_credentials(data.strategy_state, orientation)
    {:keep_state_and_data, [{:reply, from, result}]}
  end

  def handle_event({:call, from}, {:regenerate_ingest_credentials, orientation}, _state, data) do
    case data.strategy_module.regenerate_ingest_credentials(data.strategy_state, orientation) do
      {:ok, creds, new_strategy_state} ->
        data = %{data | strategy_state: new_strategy_state}
        {:keep_state, data, [{:reply, from, {:ok, creds}}]}

      {:error, reason} ->
        {:keep_state_and_data, [{:reply, from, {:error, reason}}]}
    end
  end

  def handle_event({:call, from}, :get_input_streaming_status, state, _data) do
    status = if state in [:ready, :streaming, :disconnected], do: :live, else: :offline
    {:keep_state_and_data, [{:reply, from, status}]}
  end

  def handle_event({:call, from}, :can_start_streaming, state, _data) do
    {:keep_state_and_data, [{:reply, from, state == :ready}]}
  end

  def handle_event({:call, from}, :cleanup_all_outputs, _state, data) do
    data.strategy_module.cleanup_all_outputs(data.strategy_state)
    {:keep_state_and_data, [{:reply, from, :ok}]}
  end

  def handle_event({:call, from}, {:set_live_input_id, input_id}, _state, data) do
    data = handle_set_live_input_id(data, input_id)
    {:keep_state, data, [{:reply, from, :ok}]}
  end

  def handle_event({:call, from}, {:regenerate_live_input, orientation}, _state, data) do
    {reply, data} = handle_regenerate_live_input(data, orientation)
    {:keep_state, data, [{:reply, from, reply}]}
  end

  def handle_event({:call, from}, _request, _state, _data) do
    {:keep_state_and_data, [{:reply, from, {:error, :unknown_request}}]}
  end

  # ══════════════════════════════════════════════════════════════════
  # Casts
  # ══════════════════════════════════════════════════════════════════

  def handle_event(:cast, {:webhook_event, event_type}, state, data) do
    case data.strategy_module.handle_event(data.strategy_state, event_type) do
      {:status_change, new_status, new_strategy_state} ->
        data = %{data | strategy_state: new_strategy_state}
        {next_state, data, actions} = apply_input_status_change(new_status, state, data)
        {:next_state, next_state, data, actions}

      :ignore ->
        :keep_state_and_data
    end
  end

  def handle_event(:cast, {:update_actor_viewers, platform, count}, _state, data) do
    case CurrentStreamData.update_viewer_count(data.user_id, platform, count) do
      {:ok, _} ->
        :ok

      {:error, reason} ->
        Logger.error("[StreamManager] failed to update viewers: #{inspect(reason)}")
    end

    :keep_state_and_data
  end

  def handle_event(:cast, {:report_stream_error, error_message}, _state, data) do
    case CurrentStreamData.mark_error(data.user_id, error_message) do
      {:ok, _} -> :ok
      {:error, reason} -> Logger.error("[StreamManager] failed to mark error: #{inspect(reason)}")
    end

    :keep_state_and_data
  end

  def handle_event(:cast, {:report_platform_status, platform, %PlatformStatus{} = status}, _state, data) do
    case CurrentStreamData.set_platform_status(data.user_id, platform, status) do
      {:ok, _} ->
        :ok

      {:error, reason} ->
        Logger.error("[StreamManager] failed to set platform status for #{platform}: #{inspect(reason)}")
    end

    :keep_state_and_data
  end

  def handle_event(:cast, {:report_platform_stopped, platform}, _state, data) do
    case CurrentStreamData.remove_platform_status(data.user_id, platform) do
      {:ok, _} ->
        :ok

      {:error, reason} ->
        Logger.error("[StreamManager] failed to remove platform #{platform}: #{inspect(reason)}")
    end

    :keep_state_and_data
  end

  def handle_event(:cast, msg, state, _data) do
    Logger.warning("[StreamManager] Unhandled cast in state #{state}: #{inspect(msg)}")
    :keep_state_and_data
  end

  # Catch-all for unhandled info messages
  def handle_event(:info, msg, state, _data) do
    Logger.warning("[StreamManager] Unhandled info in state #{state}: #{inspect(msg)}")
    :keep_state_and_data
  end

  # ══════════════════════════════════════════════════════════════════
  # Input status transitions
  # ══════════════════════════════════════════════════════════════════

  # Encoder connected
  defp apply_input_status_change(:live, :offline, data) do
    live_input_uid = data.horizontal_input && data.horizontal_input.input_id

    preview_hls_url =
      data.strategy_module.build_stream_config(data.strategy_state, :ready)[:preview_hls_url]

    write_cloudflare_update(data.user_id, %{
      input_streaming: true,
      live_input_uid: live_input_uid,
      preview_hls_url: preview_hls_url
    })

    CurrentStreamData.update_status_for_user(data.user_id, "ready")
    write_stream_data_update(data.user_id, %{status_message: "Input connected"})

    {:ready, data, []}
  end

  defp apply_input_status_change(:live, :disconnected, data) do
    write_cloudflare_update(data.user_id, %{input_streaming: true})
    write_stream_data_update(data.user_id, %{status_message: "Input reconnected"})

    {:streaming, data, []}
  end

  # Encoder disconnected
  defp apply_input_status_change(:offline, :ready, data) do
    write_cloudflare_update(data.user_id, %{input_streaming: false, preview_hls_url: nil})
    CurrentStreamData.update_status_for_user(data.user_id, "idle")
    write_stream_data_update(data.user_id, %{status_message: "Input disconnected"})

    {:offline, data, []}
  end

  defp apply_input_status_change(:offline, :streaming, data) do
    disconnect_timeout = Application.get_env(:streampai, :stream_disconnect_timeout, 10_000)

    write_cloudflare_update(data.user_id, %{input_streaming: false, preview_hls_url: nil})
    write_stream_data_update(data.user_id, %{status_message: "Input disconnected"})

    {:disconnected, data, [{:state_timeout, disconnect_timeout, :auto_stop}]}
  end

  # No change
  defp apply_input_status_change(_status, current_state, data) do
    {current_state, data, []}
  end

  # ══════════════════════════════════════════════════════════════════
  # Terminate
  # ══════════════════════════════════════════════════════════════════

  @impl true
  def terminate(reason, _state_name, data) do
    Logger.info("[StreamManager] terminating: #{inspect(reason)}")

    if data.strategy_module && data.strategy_state do
      data.strategy_module.terminate(data.strategy_state)
    end

    :ok
  end

  # ══════════════════════════════════════════════════════════════════
  # Private helpers
  # ══════════════════════════════════════════════════════════════════

  defp load_stream_actor_state(data) do
    case CurrentStreamData.get_or_create_for_user(data.user_id) do
      {:ok, record} ->
        sd = record.stream_data || %{}

        Logger.info("[STATE_LOAD] DB status=#{record.status}, livestream_id=#{sd["livestream_id"]}")

        case {record.status, sd["livestream_id"]} do
          {"streaming", lid} when is_binary(lid) ->
            Logger.info("[StreamManager] restoring streaming state from DB: livestream_id=#{lid}")

            started_at =
              case sd["started_at"] do
                nil ->
                  nil

                dt when is_binary(dt) ->
                  case DateTime.from_iso8601(dt) do
                    {:ok, parsed, _} -> parsed
                    _ -> nil
                  end

                dt ->
                  dt
              end

            %{data | livestream_id: lid, started_at: started_at}

          _ ->
            data
        end

      {:error, reason} ->
        Logger.error("[StreamManager] failed to load CurrentStreamData: #{inspect(reason)}")
        data
    end
  end

  defp maybe_reattach_platforms(data) do
    case CurrentStreamData.get_by_user(data.user_id, actor: Streampai.SystemActor.system()) do
      {:ok, record} when not is_nil(record) ->
        platform_data = %{
          twitch: record.twitch_data || %{},
          youtube: record.youtube_data || %{},
          kick: record.kick_data || %{}
        }

        has_live_platform = Enum.any?(platform_data, fn {_k, v} -> v["status"] == "live" end)

        if has_live_platform do
          user_id = data.user_id
          livestream_id = data.livestream_id

          Task.start(fn ->
            Logger.info("[StreamManager] reattaching platforms for user #{user_id}")
            PlatformCoordinator.reattach_platforms(user_id, livestream_id, platform_data)
          end)
        end

      _ ->
        :ok
    end
  end

  defp write_stream_actor_error(user_id, error_message) do
    case CurrentStreamData.mark_error(user_id, error_message) do
      {:ok, _record} ->
        :ok

      {:error, reason} ->
        Logger.error("[STATE_WRITE] mark_error FAILED: #{inspect(reason)}")
    end
  end

  defp write_cloudflare_update(user_id, updates) do
    case CurrentStreamData.update_cloudflare_data_for_user(user_id, updates) do
      {:ok, _record} ->
        :ok

      {:error, reason} ->
        Logger.error("[STATE_WRITE] cloudflare update FAILED: #{inspect(reason)}")
    end
  end

  defp write_stream_data_update(user_id, updates) do
    case CurrentStreamData.update_stream_data_for_user(user_id, updates) do
      {:ok, _record} ->
        :ok

      {:error, reason} ->
        Logger.error("[STATE_WRITE] stream_data update FAILED: #{inspect(reason)}")
    end
  end

  # After stopping a stream, check the last known encoder status to pick
  # the right target state (:ready vs :offline). The strategy's poll/push
  # will correct if this is stale.
  defp stopped_target_state(data) do
    case data.strategy_state do
      %{last_status: :live} -> :ready
      _ -> :offline
    end
  end

  defp via(user_id) do
    RegistryHelpers.via_tuple(:stream_manager, user_id)
  end

  # Build a map that looks like the old GenServer state for backwards compat
  # with callers like Monitor and StreamAction that access `.status`, `.stream_status`, etc.
  defp build_legacy_state(state_name, data) do
    {status, stream_status, input_streaming_status} = state_to_legacy_fields(state_name)

    data
    |> Map.from_struct()
    |> Map.merge(%{
      status: status,
      stream_status: stream_status,
      input_streaming_status: input_streaming_status
    })
  end

  defp state_to_legacy_fields(:initializing), do: {:offline, :inactive, :offline}
  defp state_to_legacy_fields(:offline), do: {:offline, :inactive, :offline}
  defp state_to_legacy_fields(:ready), do: {:offline, :ready, :live}
  defp state_to_legacy_fields(:streaming), do: {:streaming, :streaming, :live}
  defp state_to_legacy_fields(:disconnected), do: {:streaming, :streaming, :offline}
  defp state_to_legacy_fields(:stopping), do: {:offline, :inactive, :offline}
  defp state_to_legacy_fields(:error), do: {:offline, :error, :offline}

  defp build_detailed_status(state, data) do
    horizontal_input_id = get_input_id(data.horizontal_input)
    vertical_input_id = get_input_id(data.vertical_input)

    %{
      user_id: data.user_id,
      is_streaming: state in [:streaming, :disconnected],
      live_input_id: horizontal_input_id,
      horizontal_input_id: horizontal_input_id,
      vertical_input_id: vertical_input_id,
      last_status: data.horizontal_input
    }
  end

  defp get_input_id(%{input_id: id}) when is_binary(id), do: id
  defp get_input_id(_), do: nil

  defp handle_set_live_input_id(data, input_id) do
    Logger.info("[StreamManager] horizontal live input ID set to: #{input_id}")

    case data.horizontal_input do
      nil -> %{data | horizontal_input: %{input_id: input_id}}
      existing -> %{data | horizontal_input: Map.put(existing, :input_id, input_id)}
    end
  end

  # NOTE: regenerate_live_input is Cloudflare-specific. It delegates to the
  # Cloudflare modules directly. When Membrane is implemented, this will need
  # to be abstracted into the BroadcastStrategy behaviour.
  defp handle_regenerate_live_input(data, orientation) do
    alias Streampai.Cloudflare.APIClient
    alias Streampai.Cloudflare.LiveInput
    alias Streampai.LivestreamManager.StreamManager.Cloudflare.InputManager

    Logger.info("[StreamManager] regenerating #{orientation} live input for user #{data.user_id}")

    input = if orientation == :vertical, do: data.vertical_input, else: data.horizontal_input

    case get_input_id(input) do
      nil ->
        Logger.info("[StreamManager] no existing #{orientation} live input to delete")

      input_id ->
        case APIClient.delete_live_input(input_id) do
          :ok ->
            Logger.info("[StreamManager] deleted Cloudflare #{orientation} live input: #{input_id}")

          {:error, _error_type, message} ->
            Logger.warning("[StreamManager] failed to delete: #{message}")
        end
    end

    case Ash.get(LiveInput, %{user_id: data.user_id, orientation: orientation}, actor: Streampai.SystemActor.system()) do
      {:ok, live_input} when not is_nil(live_input) ->
        Ash.destroy(live_input, actor: Streampai.SystemActor.system())

      _ ->
        :ok
    end

    input_manager_data = %{user_id: data.user_id, account_id: nil, api_token: nil}

    case InputManager.fetch_input_for_orientation(input_manager_data, orientation) do
      {:ok, new_input} ->
        new_data =
          if orientation == :vertical,
            do: %{data | vertical_input: new_input},
            else: %{data | horizontal_input: new_input}

        # Update strategy state with new input info
        new_strategy_state =
          if orientation == :vertical,
            do: %{data.strategy_state | vertical_input: new_input},
            else: %{data.strategy_state | horizontal_input: new_input}

        new_data = %{new_data | strategy_state: new_strategy_state}

        stream_config =
          data.strategy_module.build_stream_config(new_data.strategy_state, :offline)

        {{:ok, stream_config}, new_data}

      {:error, reason} ->
        Logger.error("[StreamManager] failed to regenerate #{orientation} live input: #{inspect(reason)}")

        {{:error, reason}, data}
    end
  end
end
