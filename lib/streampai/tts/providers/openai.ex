defmodule Streampai.TTS.Providers.OpenAI do
  @moduledoc """
  OpenAI TTS provider implementation.

  Uses OpenAI's TTS-1 model with 6 available voices:
  - Alloy (neutral)
  - Echo (male)
  - Fable (warm)
  - Onyx (deep)
  - Nova (female)
  - Shimmer (soft)
  """

  @behaviour Streampai.TTS.Provider

  require Logger

  @impl true
  def name, do: :openai

  @impl true
  def voices do
    [
      %{
        id: "openai_alloy",
        name: "Alloy (Neutral)",
        provider: :openai,
        voice_id: "alloy",
        language: "en"
      },
      %{
        id: "openai_echo",
        name: "Echo (Male)",
        provider: :openai,
        voice_id: "echo",
        language: "en"
      },
      %{
        id: "openai_fable",
        name: "Fable (Warm)",
        provider: :openai,
        voice_id: "fable",
        language: "en"
      },
      %{
        id: "openai_onyx",
        name: "Onyx (Deep)",
        provider: :openai,
        voice_id: "onyx",
        language: "en"
      },
      %{
        id: "openai_nova",
        name: "Nova (Female)",
        provider: :openai,
        voice_id: "nova",
        language: "en"
      },
      %{
        id: "openai_shimmer",
        name: "Shimmer (Soft)",
        provider: :openai,
        voice_id: "shimmer",
        language: "en"
      }
    ]
  end

  @impl true
  def generate(message, voice) do
    api_key = get_api_key()

    if is_nil(api_key) do
      Logger.warning("OpenAI API key not configured, using mock TTS")
      {:ok, generate_mock_audio()}
    else
      generate_with_api(message, voice, api_key)
    end
  end

  @impl true
  def enabled? do
    # Always enabled since we have mock audio fallback
    true
  end

  defp generate_with_api(message, voice, api_key) do
    payload = %{
      model: "tts-1",
      input: message,
      voice: voice.voice_id,
      response_format: "mp3"
    }

    case Req.post(
           "https://api.openai.com/v1/audio/speech",
           json: payload,
           headers: [
             authorization: "Bearer #{api_key}",
             content_type: "application/json"
           ]
         ) do
      {:ok, %{status: 200, body: audio_data}} ->
        {:ok, audio_data}

      {:ok, %{status: status, body: body}} ->
        Logger.error("OpenAI TTS API error", status: status, body: inspect(body))
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        Logger.error("OpenAI TTS request failed", reason: inspect(reason))
        {:error, {:request_failed, reason}}
    end
  end

  defp get_api_key do
    Application.get_env(:streampai, :openai_api_key)
  end

  defp generate_mock_audio do
    # Minimal valid MP3 file header for testing
    <<255, 251, 144, 0>>
  end
end
