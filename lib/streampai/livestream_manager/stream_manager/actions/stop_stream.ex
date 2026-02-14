defmodule Streampai.LivestreamManager.StreamManager.Actions.StopStream do
  @moduledoc """
  Executes the stop stream workflow:
  1. Mark stopping in DB
  2. Finalize livestream record
  3. Stop platforms + metrics collector
  4. Cleanup outputs
  5. Mark stopped in DB

  Note: Output disabling and state transitions are handled by the gen_statem
  caller (StreamManager), not here.
  """

  alias Streampai.LivestreamManager.BroadcastStrategy.Cloudflare, as: CloudflareStrategy
  alias Streampai.LivestreamManager.StreamManager.Cloudflare.OutputManager
  alias Streampai.LivestreamManager.StreamManager.LivestreamFinalizer
  alias Streampai.LivestreamManager.StreamManager.PlatformCoordinator
  alias Streampai.Stream.CurrentStreamData

  require Logger

  def execute(data) do
    Logger.info("[STOP_STREAM] BEGIN for user #{data.user_id}")

    {:ok, record} = write_stopping(data.user_id)

    livestream_id = data.livestream_id

    if livestream_id do
      LivestreamFinalizer.finalize_livestream(data.user_id, livestream_id)
    else
      Logger.warning("[STOP_STREAM] No active livestream_id found for user #{data.user_id}")
    end

    LivestreamFinalizer.safe_cleanup(
      fn -> PlatformCoordinator.stop_streaming(data.user_id) end,
      "stop platform streaming"
    )

    LivestreamFinalizer.safe_cleanup(
      fn -> LivestreamFinalizer.stop_metrics_collector(data.metrics_collector_pid) end,
      "stop metrics collector"
    )

    # Clean up broadcast outputs via the active strategy
    cleanup_broadcast_outputs(data)

    data = %{data | livestream_id: nil, started_at: nil, metrics_collector_pid: nil}

    write_stopped_record(record, "Stream ended")

    Logger.info("[STOP_STREAM] COMPLETE for user #{data.user_id}")
    {:ok, data}
  end

  defp write_stopping(user_id) do
    Logger.info("[STATE_WRITE] marking stopping")

    with {:ok, record} <- CurrentStreamData.get_or_create_for_user(user_id) do
      Ash.update(record, %{status: "stopping"},
        action: :update_status,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  defp cleanup_broadcast_outputs(data) do
    # Cloudflare strategy: clean up leftover Cloudflare live outputs via API
    # Membrane strategy: remove RTMP.Sink children from the pipeline
    if data.strategy_module == CloudflareStrategy do
      OutputManager.cleanup_all(data)
    else
      data.strategy_module.cleanup_all_outputs(data.strategy_state)
    end
  end

  defp write_stopped_record(record, status_message) do
    Logger.info("[STATE_WRITE] mark_stopped_record: msg=#{status_message}")

    case CurrentStreamData.mark_stopped_record(record, status_message) do
      {:ok, record} ->
        Logger.info("[STATE_WRITE] mark_stopped_record OK: status=#{record.status}")
        {:ok, record}

      {:error, reason} ->
        Logger.error("[STATE_WRITE] mark_stopped_record FAILED: #{inspect(reason)}")
        :error
    end
  end
end
