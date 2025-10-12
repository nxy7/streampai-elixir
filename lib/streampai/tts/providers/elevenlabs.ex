defmodule Streampai.TTS.Providers.ElevenLabs do
  @moduledoc """
  ElevenLabs TTS provider implementation.

  Uses ElevenLabs' high-quality text-to-speech API with realistic voices.
  Requires ELEVENLABS_API_KEY environment variable.

  ElevenLabs offers superior voice quality with emotion and tone control.
  See: https://elevenlabs.io/docs
  """

  @behaviour Streampai.TTS.Provider

  require Logger

  @impl true
  def name, do: :elevenlabs

  @impl true
  def voices do
    [
      %{
        id: "elevenlabs_rachel",
        name: "Rachel (Calm Female)",
        provider: :elevenlabs,
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      },
      %{
        id: "elevenlabs_domi",
        name: "Domi (Strong Female)",
        provider: :elevenlabs,
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      },
      %{
        id: "elevenlabs_bella",
        name: "Bella (Soft Female)",
        provider: :elevenlabs,
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      },
      %{
        id: "elevenlabs_antoni",
        name: "Antoni (Well-rounded Male)",
        provider: :elevenlabs,
        voice_id: "ErXwobaYiN019PkySvjV",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      },
      %{
        id: "elevenlabs_elli",
        name: "Elli (Energetic Female)",
        provider: :elevenlabs,
        voice_id: "MF3mGyEYCl7XYWbV9V6O",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      },
      %{
        id: "elevenlabs_josh",
        name: "Josh (Deep Male)",
        provider: :elevenlabs,
        voice_id: "TxGEqnHWrfWFTfGW9XjX",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      },
      %{
        id: "elevenlabs_arnold",
        name: "Arnold (Crisp Male)",
        provider: :elevenlabs,
        voice_id: "VR6AewLTigWG4xSOukaG",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "middle_aged"
        }
      },
      %{
        id: "elevenlabs_adam",
        name: "Adam (Narrator Male)",
        provider: :elevenlabs,
        voice_id: "pNInz6obpgDQGcFmaJgB",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "middle_aged"
        }
      },
      %{
        id: "elevenlabs_sam",
        name: "Sam (Dynamic Male)",
        provider: :elevenlabs,
        voice_id: "yoZ06aMxZJJ28mfd3POQ",
        language: "en",
        metadata: %{
          category: "premade",
          accent: "american",
          age: "young"
        }
      }
    ]
  end

  @impl true
  def generate(message, voice) do
    api_key = get_api_key()

    if is_nil(api_key) do
      Logger.warning("ElevenLabs API key not configured, using mock audio")
      {:ok, generate_mock_audio()}
    else
      generate_with_api(message, voice, api_key)
    end
  end

  @impl true
  def enabled? do
    # Always enabled - falls back to mock audio if no API key
    true
  end

  defp generate_with_api(message, voice, api_key) do
    url = "https://api.elevenlabs.io/v1/text-to-speech/#{voice.voice_id}"

    payload = %{
      text: message,
      model_id: "eleven_multilingual_v2",
      voice_settings: %{
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    }

    Logger.info("Generating ElevenLabs TTS",
      voice: voice.id,
      voice_name: voice.name,
      message_length: String.length(message)
    )

    case Req.post(
           url,
           json: payload,
           headers: [
             {"xi-api-key", api_key},
             {"Content-Type", "application/json"}
           ],
           into: :self
         ) do
      {:ok, %{status: 200, body: audio_data}} ->
        Logger.info("ElevenLabs TTS generated successfully",
          voice: voice.id,
          audio_size: byte_size(audio_data)
        )

        {:ok, audio_data}

      {:ok, %{status: status, body: body}} ->
        Logger.error("ElevenLabs TTS API error",
          status: status,
          voice: voice.id,
          body: inspect(body)
        )

        {:error, {:api_error, status, body}}

      {:error, reason} ->
        Logger.error("ElevenLabs TTS request failed",
          reason: inspect(reason),
          voice: voice.id
        )

        {:error, {:request_failed, reason}}
    end
  end

  defp get_api_key do
    Application.get_env(:streampai, :elevenlabs_api_key)
  end

  defp generate_mock_audio do
    # Minimal valid MP3 file header for testing
    <<255, 251, 144, 0>>
  end
end
