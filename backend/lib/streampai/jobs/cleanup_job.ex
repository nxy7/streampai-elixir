defmodule Streampai.Jobs.CleanupJob do
  @moduledoc """
  Oban job for periodic cleanup of temporary data and memory optimization.

  This job runs periodically to clean up:
  - Old error tracking data
  - Expired cache entries
  - Temporary files
  - Stale ETS tables
  """

  use Oban.Worker,
    queue: :maintenance,
    max_attempts: 2,
    tags: ["cleanup", "maintenance"]

  alias StreampaiWeb.Plugs.ErrorTracker

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    cleanup_type = Map.get(args, "cleanup_type", "all")

    Logger.info("Starting cleanup job", %{cleanup_type: cleanup_type})

    results =
      case cleanup_type do
        "errors" -> cleanup_error_data()
        "cache" -> cleanup_cache_data()
        "all" -> cleanup_all()
        _ -> {:error, :invalid_cleanup_type}
      end

    case results do
      {:ok, cleanup_stats} ->
        Logger.info("Cleanup job completed successfully", cleanup_stats)
        :ok

      {:error, reason} ->
        Logger.error("Cleanup job failed", %{reason: reason})
        {:error, reason}
    end
  end

  @doc """
  Schedules a cleanup job to run.
  """
  def schedule_cleanup(cleanup_type \\ "all", delay_seconds \\ 0) do
    %{cleanup_type: cleanup_type}
    |> new(schedule_in: delay_seconds)
    |> Oban.insert()
  end

  @doc """
  Schedules periodic cleanup jobs via Oban cron.
  """
  def get_cron_config do
    [
      # Clean up errors every 4 hours
      {"0 */4 * * *", __MODULE__, %{"cleanup_type" => "errors"}},
      # Clean up cache data every day at 2 AM
      {"0 2 * * *", __MODULE__, %{"cleanup_type" => "cache"}},
      # Full cleanup weekly on Sunday at 3 AM
      {"0 3 * * 0", __MODULE__, %{"cleanup_type" => "all"}}
    ]
  end

  defp cleanup_all do
    Logger.info("Running full cleanup")

    with {:ok, error_stats} <- cleanup_error_data(),
         {:ok, cache_stats} <- cleanup_cache_data() do
      combined_stats = %{
        errors_cleaned: error_stats.errors_cleaned,
        cache_cleaned: cache_stats.cache_cleaned,
        total_memory_freed_mb: calculate_memory_freed(error_stats, cache_stats)
      }

      {:ok, combined_stats}
    end
  end

  defp cleanup_error_data do
    errors_cleaned = ErrorTracker.cleanup_old_errors(48)

    {:ok,
     %{
       errors_cleaned: errors_cleaned,
       cleanup_type: :errors
     }}
  rescue
    error ->
      Logger.error("Failed to cleanup error data", %{error: inspect(error)})
      {:error, :error_cleanup_failed}
  end

  defp cleanup_cache_data do
    cache_cleaned = cleanup_ets_caches()

    {:ok,
     %{
       cache_cleaned: cache_cleaned,
       cleanup_type: :cache
     }}
  rescue
    error ->
      Logger.error("Failed to cleanup cache data", %{error: inspect(error)})
      {:error, :cache_cleanup_failed}
  end

  defp cleanup_ets_caches do
    total_cleaned = 0

    # Clean up chat cache if it exists
    total_cleaned = total_cleaned + cleanup_chat_cache()

    # Clean up rate limiter cache
    total_cleaned = total_cleaned + cleanup_rate_limiter_cache()

    total_cleaned
  end

  defp cleanup_chat_cache do
    case :ets.whereis(:chat_cache) do
      :undefined ->
        0

      _ ->
        try do
          # Remove entries older than 1 hour
          cutoff_time = DateTime.add(DateTime.utc_now(), -3600, :second)

          entries_to_delete =
            :chat_cache
            |> :ets.tab2list()
            |> Enum.filter(fn
              {:messages, _messages, timestamp} ->
                DateTime.before?(timestamp, cutoff_time)

              _ ->
                false
            end)
            |> Enum.map(fn {key, _data, _timestamp} -> key end)

          Enum.each(entries_to_delete, &:ets.delete(:chat_cache, &1))
          length(entries_to_delete)
        rescue
          _ -> 0
        end
    end
  end

  defp cleanup_rate_limiter_cache do
    case :ets.whereis(:rate_limiter) do
      :undefined ->
        0

      _ ->
        try do
          # Remove entries older than 1 hour (much longer than rate limit window)
          cutoff_time = System.system_time(:millisecond) - 3_600_000

          entries_to_delete =
            :rate_limiter
            |> :ets.tab2list()
            |> Enum.filter(fn {_key, _count, timestamp} ->
              timestamp < cutoff_time
            end)
            |> Enum.map(fn {key, _count, _timestamp} -> key end)

          Enum.each(entries_to_delete, &:ets.delete(:rate_limiter, &1))
          length(entries_to_delete)
        rescue
          _ -> 0
        end
    end
  end

  defp calculate_memory_freed(error_stats, cache_stats) do
    # Rough estimation: each error record ~1KB, each cache entry ~0.5KB
    error_memory = error_stats.errors_cleaned * 1
    cache_memory = cache_stats.cache_cleaned * 0.5

    Float.round((error_memory + cache_memory) / 1024, 2)
  end
end
