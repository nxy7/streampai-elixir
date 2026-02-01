defmodule Streampai.Jobs.DonationTtsJob do
  @moduledoc """
  Oban job that processes donation events to generate TTS and broadcast alert events.

  This job:
  1. Receives donation data from the donation page
  2. Generates or retrieves cached TTS for the message + voice combination
  3. Broadcasts the complete alert event with TTS path to the alertbox widget
  """
  use Oban.Worker,
    queue: :donations,
    max_attempts: 3,
    tags: ["tts", "donation"],
    unique: [period: 60, keys: [:user_id, :donation_event]]

  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.TtsService

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt}) do
    %{
      "user_id" => user_id,
      "donation_event" => donation_event
    } = args

    Logger.info("Processing donation TTS job",
      user_id: user_id,
      donor_name: donation_event["donor_name"],
      amount: donation_event["amount"],
      attempt: attempt
    )

    try do
      {:ok, alert_event} = process_donation_with_tts(user_id, donation_event)
      broadcast_alert_event(user_id, alert_event)
      Logger.info("Successfully processed donation TTS", user_id: user_id, attempt: attempt)
      :ok
    rescue
      error ->
        Logger.error("Failed to process donation TTS",
          user_id: user_id,
          error: inspect(error),
          error_type: error.__struct__,
          stacktrace: Exception.format_stacktrace(__STACKTRACE__),
          attempt: attempt
        )

        if attempt >= 3 do
          # Final attempt failed, broadcast without TTS
          fallback_event = create_fallback_alert_event(donation_event)
          broadcast_alert_event(user_id, fallback_event)
          Logger.warning("Sent fallback donation alert without TTS", user_id: user_id)
          :ok
        else
          {:error, error}
        end
    end
  end

  @doc """
  Schedules a donation TTS job for processing.
  """
  def schedule_donation_tts(user_id, donation_event) do
    %{
      user_id: user_id,
      donation_event: donation_event
    }
    |> new()
    |> Oban.insert()
  end

  defp process_donation_with_tts(_user_id, donation_event) do
    message = donation_event["message"] || ""
    voice = donation_event["voice"] || "default"

    # Generate TTS for the message if it exists and is non-empty
    tts_path =
      if String.trim(message) == "" do
        nil
      else
        case TtsService.get_or_generate_tts(message, voice) do
          {:ok, path} -> path
          # Continue without TTS if generation fails
          {:error, _reason} -> nil
        end
      end

    alert_event = %{
      id: generate_event_id(),
      type: :donation,
      message: message,
      donor_name: donation_event["donor_name"] || "Anonymous",
      amount: donation_event["amount"],
      currency: donation_event["currency"] || "USD",
      voice: voice,
      tts_path: tts_path,
      tts_url: get_tts_public_url(tts_path),
      timestamp: parse_timestamp(donation_event["timestamp"]),
      # Default platform, could be dynamic in the future
      platform: :twitch
    }

    {:ok, alert_event}
  end

  defp broadcast_alert_event(user_id, alert_event) do
    StreamManager.enqueue_alert(user_id, alert_event)

    Logger.info("Enqueued alert event",
      user_id: user_id,
      event_type: alert_event.type,
      has_tts: !is_nil(alert_event.tts_path)
    )
  end

  defp generate_event_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode16() |> String.downcase()
  end

  defp get_tts_public_url(nil), do: nil
  defp get_tts_public_url(tts_path), do: TtsService.get_tts_public_url(tts_path)

  defp parse_timestamp(timestamp_string) when is_binary(timestamp_string) do
    case DateTime.from_iso8601(timestamp_string) do
      {:ok, datetime, _offset} -> datetime
      {:error, _} -> DateTime.utc_now()
    end
  end

  defp parse_timestamp(_), do: DateTime.utc_now()

  defp create_fallback_alert_event(donation_event) do
    %{
      id: generate_event_id(),
      type: :donation,
      message: donation_event["message"] || "",
      donor_name: donation_event["donor_name"] || "Anonymous",
      amount: donation_event["amount"],
      currency: donation_event["currency"] || "USD",
      voice: nil,
      tts_path: nil,
      tts_url: nil,
      timestamp: parse_timestamp(donation_event["timestamp"]),
      platform: :twitch
    }
  end
end
