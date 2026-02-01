defmodule Streampai.Donations.Pipeline do
  @moduledoc """
  Unified donation processing pipeline.

  This pipeline handles donations from any platform (PayPal, Twitch, YouTube, etc.)
  and processes them through a consistent flow:

  1. Generate TTS for donation message (if provided)
  2. Upload TTS to S3 (cached by content hash)
  3. Broadcast donation event to Phoenix PubSub

  ## Usage

      # Process a donation from any platform
      Pipeline.process_donation(%{
        user_id: "user-123",
        platform: :paypal,
        donor_name: "John Doe",
        amount: Decimal.new("10.00"),
        currency: "USD",
        message: "Great stream!",
        voice: "alloy",
        metadata: %{...}
      })

  ## Event Broadcasting

  Events are broadcast on these topics:

  - `donations:<user_id>` - All donation events for a user
  - `donations:user:<user_id>` - Alternate topic format (for compatibility)

  Event format:
      %{
        id: "abc123...",
        type: :donation,
        platform: :paypal,
        donor_name: "John Doe",
        amount: "10.00",
        currency: "USD",
        message: "Great stream!",
        voice: "alloy",
        tts_path: "tts/alloy_hash.mp3",
        tts_url: "https://cdn.../tts/alloy_hash.mp3",
        timestamp: ~U[2025-01-15 10:30:00Z],
        metadata: %{...}
      }
  """

  alias Phoenix.PubSub
  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Storage.S3
  alias Streampai.TTS.Generator

  require Logger

  @doc """
  Processes a donation through the complete pipeline.

  ## Required Fields

  - `user_id` - ID of the streamer receiving the donation
  - `platform` - Platform source (:paypal, :twitch, :youtube, etc.)
  - `amount` - Donation amount (Decimal or string)
  - `currency` - Currency code (e.g., "USD")

  ## Optional Fields

  - `donor_name` - Name of the donor (default: "Anonymous")
  - `message` - Donation message
  - `voice` - Voice model ID for TTS (default: "alloy")
  - `metadata` - Additional platform-specific data

  Returns {:ok, event} or {:error, reason}
  """
  def process_donation(params) do
    with :ok <- validate_params(params),
         {:ok, tts_data} <- maybe_generate_tts(params),
         {:ok, event} <- build_event(params, tts_data) do
      broadcast_event(params.user_id, event)
      {:ok, event}
    else
      {:error, reason} = error ->
        Logger.error("Donation pipeline failed", %{
          user_id: params[:user_id],
          platform: params[:platform],
          reason: inspect(reason)
        })

        error
    end
  end

  defp validate_params(params) do
    required = [:user_id, :platform, :amount, :currency]

    missing =
      Enum.filter(required, fn field ->
        !Map.has_key?(params, field) || is_nil(params[field])
      end)

    if Enum.empty?(missing) do
      :ok
    else
      {:error, {:missing_fields, missing}}
    end
  end

  defp maybe_generate_tts(params) do
    message = params[:message]
    voice = params[:voice] || "alloy"

    if message && String.trim(message) != "" do
      case Generator.get_or_generate(message, voice) do
        {:ok, tts_path} ->
          tts_url = S3.get_public_url(tts_path)
          {:ok, %{path: tts_path, url: tts_url}}

        {:error, reason} ->
          Logger.warning("TTS generation failed, continuing without TTS", %{
            reason: inspect(reason),
            message: message,
            voice: voice
          })

          {:ok, %{path: nil, url: nil}}
      end
    else
      {:ok, %{path: nil, url: nil}}
    end
  end

  defp build_event(params, tts_data) do
    event = %{
      id: generate_event_id(),
      type: :donation,
      platform: params.platform,
      donor_name: params[:donor_name] || "Anonymous",
      amount: format_amount(params.amount),
      currency: params.currency,
      message: params[:message],
      voice: params[:voice],
      tts_path: tts_data.path,
      tts_url: tts_data.url,
      timestamp: DateTime.utc_now(),
      metadata: params[:metadata] || %{}
    }

    {:ok, event}
  end

  defp broadcast_event(user_id, event) do
    # Broadcast on both topic formats for compatibility
    topics = [
      "donations:#{user_id}",
      "donations:user:#{user_id}"
    ]

    Enum.each(topics, fn topic ->
      PubSub.broadcast(
        Streampai.PubSub,
        topic,
        {:donation_completed, event}
      )
    end)

    # Also enqueue into AlertQueue for alertbox display
    StreamManager.enqueue_alert(user_id, event)

    Logger.info("Donation event broadcasted", %{
      user_id: user_id,
      platform: event.platform,
      amount: event.amount,
      has_tts: !is_nil(event.tts_path)
    })
  end

  defp generate_event_id do
    8
    |> :crypto.strong_rand_bytes()
    |> Base.encode16(case: :lower)
  end

  defp format_amount(%Decimal{} = amount), do: Decimal.to_string(amount)
  defp format_amount(amount) when is_binary(amount), do: amount
  defp format_amount(amount) when is_number(amount), do: to_string(amount)
end
