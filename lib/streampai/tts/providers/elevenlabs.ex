defmodule Streampai.TTS.Providers.ElevenLabs do
  @moduledoc """
  ElevenLabs TTS provider implementation (stub).

  To enable this provider:
  1. Add ElevenLabs API key to config: `config :streampai, :elevenlabs_api_key, "..."`
  2. Uncomment this provider in `Streampai.TTS.ProviderRegistry`
  3. Update voice list below with actual ElevenLabs voice IDs

  ElevenLabs offers high-quality, realistic voices with emotion and tone control.
  """

  @behaviour Streampai.TTS.Provider

  require Logger

  @impl true
  def name, do: :elevenlabs

  @impl true
  def voices do
    [
      # Example voices - replace with actual ElevenLabs voice IDs
      %{
        id: "elevenlabs_rachel",
        name: "Rachel (Calm, Young Female)",
        provider: :elevenlabs,
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american"
        }
      },
      %{
        id: "elevenlabs_domi",
        name: "Domi (Strong, Confident)",
        provider: :elevenlabs,
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american"
        }
      }
      # Add more voices as needed
    ]
  end

  @impl true
  def generate(message, voice) do
    api_key = get_api_key()

    if is_nil(api_key) do
      Logger.warning("ElevenLabs API key not configured")
      {:error, :api_key_not_configured}
    else
      generate_with_api(message, voice, api_key)
    end
  end

  @impl true
  def enabled? do
    not is_nil(get_api_key())
  end

  defp generate_with_api(message, voice, api_key) do
    # ElevenLabs API endpoint
    url = "https://api.elevenlabs.io/v1/text-to-speech/#{voice.voice_id}"

    payload = %{
      text: message,
      model_id: "eleven_monolingual_v1",
      voice_settings: %{
        stability: 0.5,
        similarity_boost: 0.5
      }
    }

    case Req.post(
           url,
           json: payload,
           headers: [
             "xi-api-key": api_key,
             content_type: "application/json",
             accept: "audio/mpeg"
           ],
           into: :self
         ) do
      {:ok, %{status: 200, body: audio_data}} ->
        {:ok, audio_data}

      {:ok, %{status: status, body: body}} ->
        Logger.error("ElevenLabs TTS API error", %{status: status, body: inspect(body)})
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        Logger.error("ElevenLabs TTS request failed", %{reason: inspect(reason)})
        {:error, {:request_failed, reason}}
    end
  end

  defp get_api_key do
    Application.get_env(:streampai, :elevenlabs_api_key)
  end
end
