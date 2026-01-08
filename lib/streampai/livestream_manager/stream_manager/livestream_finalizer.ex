defmodule Streampai.LivestreamManager.StreamManager.LivestreamFinalizer do
  @moduledoc """
  Handles livestream record finalization, post-stream processing,
  and metrics collector lifecycle.
  """

  alias Streampai.Accounts.User
  alias Streampai.Jobs.ProcessFinishedLivestreamJob
  alias Streampai.LivestreamManager.LivestreamMetricsCollector
  alias Streampai.Stream.Livestream

  require Logger

  def finalize_livestream(user_id, livestream_id) do
    Logger.info("Attempting to finalize livestream #{livestream_id}")
    {:ok, user} = Ash.get(User, user_id, actor: Streampai.SystemActor.system())
    {:ok, livestream} = Ash.get(Livestream, livestream_id, actor: Streampai.SystemActor.system())

    if livestream.ended_at do
      Logger.info("Livestream #{livestream_id} already ended, skipping")
      schedule_post_stream_processing(livestream_id)
    else
      case Livestream.end_livestream(livestream, actor: user) do
        {:ok, _updated} ->
          Logger.info("Successfully ended livestream #{livestream_id}")
          schedule_post_stream_processing(livestream_id)

        {:error, %Ash.Error.Invalid{errors: errors}} ->
          if Enum.any?(errors, fn e ->
               e.field == :ended_at and e.message =~ "already ended"
             end) do
            Logger.info("Livestream #{livestream_id} was already ended (concurrent end)")
            schedule_post_stream_processing(livestream_id)
          else
            Logger.error("Failed to end livestream #{livestream_id}: #{inspect(errors)}")
          end

        {:error, error} ->
          Logger.error("Unexpected error ending livestream #{livestream_id}: #{inspect(error)}")
      end
    end
  end

  def schedule_post_stream_processing(livestream_id) do
    %{livestream_id: livestream_id}
    |> ProcessFinishedLivestreamJob.new()
    |> Oban.insert()

    Logger.info("Scheduled post-stream processing for livestream #{livestream_id}")
  end

  @doc """
  Starts a metrics collector process. Returns the PID so the caller can
  store it in the gen_statem data struct.
  """
  def start_metrics_collector(user_id, stream_id) do
    case LivestreamMetricsCollector.start_link(user_id: user_id, stream_id: stream_id) do
      {:ok, pid} ->
        Logger.info("Started metrics collector for stream #{stream_id}")
        {:ok, pid}

      {:error, reason} ->
        Logger.error("Failed to start metrics collector: #{inspect(reason)}")
        :error
    end
  end

  @doc """
  Stops a metrics collector process by PID.
  """
  def stop_metrics_collector(nil), do: :ok

  def stop_metrics_collector(pid) when is_pid(pid) do
    if Process.alive?(pid), do: Process.exit(pid, :normal)
    :ok
  end

  def safe_cleanup(cleanup_fn, operation_name) do
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
end
