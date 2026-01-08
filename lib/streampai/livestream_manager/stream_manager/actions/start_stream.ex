defmodule Streampai.LivestreamManager.StreamManager.Actions.StartStream do
  @moduledoc """
  Executes the start stream workflow:
  1. Create livestream record
  2. Mark streaming in DB
  3. Clean up stale outputs
  4. Start metrics collector + platform streaming
  5. Write platform status to DB

  Note: Output enabling and state transitions are handled by the gen_statem
  caller (StreamManager), not here.
  """

  alias Streampai.Accounts.User
  alias Streampai.LivestreamManager.StreamManager.Cloudflare.OutputManager
  alias Streampai.LivestreamManager.StreamManager.LivestreamFinalizer
  alias Streampai.LivestreamManager.StreamManager.PlatformCoordinator
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.Livestream

  require Logger

  def execute(data, metadata) do
    Logger.info("[START_STREAM] BEGIN for user #{data.user_id}")

    allowed_keys = ~w(title description thumbnail_file_id category subcategory language tags)

    params =
      metadata
      |> Enum.reduce(%{}, fn {k, v}, acc ->
        key = to_string(k)
        if key in allowed_keys, do: Map.put(acc, String.to_existing_atom(key), v), else: acc
      end)
      |> Map.put_new(:tags, [])

    with {:ok, user} <- Ash.get(User, data.user_id, actor: Streampai.SystemActor.system()),
         {:ok, livestream} <- Livestream.start_livestream(data.user_id, params, actor: user),
         livestream_id = livestream.id,
         {:ok, record} <-
           write_streaming(data.user_id, livestream_id,
             status_message: "Starting stream...",
             title: params[:title],
             description: params[:description],
             tags: params[:tags],
             thumbnail_file_id: params[:thumbnail_file_id]
           ) do
      data = %{
        data
        | livestream_id: livestream_id,
          started_at: DateTime.utc_now()
      }

      OutputManager.cleanup_all(data)

      selected_platforms = metadata[:platforms] || metadata["platforms"]

      data =
        case LivestreamFinalizer.start_metrics_collector(data.user_id, livestream_id) do
          {:ok, pid} -> %{data | metrics_collector_pid: pid}
          :error -> data
        end

      {succeeded, failed} =
        PlatformCoordinator.start_streaming(
          data.user_id,
          livestream_id,
          metadata,
          selected_platforms
        )

      succeeded_count = length(succeeded)
      failed_count = length(failed)

      cond do
        succeeded_count == 0 && failed_count > 0 ->
          Logger.error("[START_STREAM] ALL platforms failed for user #{data.user_id}: #{inspect(failed)}")

          write_stream_data_update(record, %{
            status_message: "All platforms failed to start"
          })

          {:error, :all_platforms_failed}

        failed_count > 0 ->
          Logger.warning("[START_STREAM] #{failed_count} platform(s) failed for user #{data.user_id}: #{inspect(failed)}")

          write_stream_data_update(record, %{
            status_message: "Streaming to #{succeeded_count} platform(s), #{failed_count} failed"
          })

          Logger.info("[START_STREAM] COMPLETE (partial) for user #{data.user_id}, livestream #{livestream_id}")

          {:ok, livestream_id, data}

        true ->
          write_stream_data_update(record, %{
            status_message: "Streaming to #{succeeded_count} platform(s)"
          })

          Logger.info("[START_STREAM] COMPLETE for user #{data.user_id}, livestream #{livestream_id}")

          {:ok, livestream_id, data}
      end
    else
      {:error, reason} ->
        Logger.error("[START_STREAM] failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp write_streaming(user_id, livestream_id, opts) do
    Logger.info("[STATE_WRITE] mark_streaming: livestream_id=#{livestream_id}, msg=#{Keyword.get(opts, :status_message)}")

    case CurrentStreamData.mark_streaming(user_id, livestream_id, opts) do
      {:ok, record} ->
        Logger.info("[STATE_WRITE] mark_streaming OK: status=#{record.status}")
        {:ok, record}

      {:error, reason} ->
        Logger.error("[STATE_WRITE] mark_streaming FAILED: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp write_stream_data_update(record, updates) do
    Logger.info("[STATE_WRITE] stream_data update: #{inspect(updates)}")

    case Ash.update(record, %{stream_data: updates},
           action: :update_stream_data,
           actor: Streampai.SystemActor.system()
         ) do
      {:ok, record} ->
        Logger.info("[STATE_WRITE] stream_data update OK: status=#{record.status}")
        {:ok, record}

      {:error, reason} ->
        Logger.error("[STATE_WRITE] stream_data update FAILED: #{inspect(reason)}")
        :error
    end
  end
end
