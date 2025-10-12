defmodule Streampai.TTS.Generator do
  @moduledoc """
  Generates Text-to-Speech audio using OpenAI TTS API with S3 caching.

  TTS files are cached in S3 with the filename format:
  `{voice_id}_{content_hash}.mp3`

  Before generating, checks if the file already exists in S3 to avoid
  redundant API calls and reduce costs.
  """

  alias Streampai.Storage.S3
  alias Streampai.TTS.VoiceModels

  require Logger

  @doc """
  Gets or generates TTS for the given message and voice.

  Returns {:ok, s3_path} or {:error, reason}

  ## Examples

      iex> Generator.get_or_generate("Hello world", "alloy")
      {:ok, "tts/alloy_abc123def456.mp3"}

      iex> Generator.get_or_generate("", "alloy")
      {:error, :empty_message}
  """
  def get_or_generate(message, voice_id) do
    with :ok <- validate_message(message),
         {:ok, voice} <- get_voice(voice_id) do
      content_hash = generate_content_hash(message)
      s3_path = build_s3_path(voice.id, content_hash)

      case check_cache(s3_path) do
        {:ok, :cached} ->
          Logger.info("TTS cache hit", voice: voice.id, hash: content_hash)
          {:ok, s3_path}

        {:ok, :not_cached} ->
          Logger.info("TTS cache miss, generating", voice: voice.id, hash: content_hash)
          generate_and_upload(message, voice, s3_path, content_hash)
      end
    end
  end

  @doc """
  Generates a content hash for the message.

  Uses SHA-256 to create a deterministic hash based on the message content.
  The voice is not included in the hash as different voices are distinguished
  by the filename prefix.
  """
  def generate_content_hash(message) do
    :sha256
    |> :crypto.hash(message)
    |> Base.encode16(case: :lower)
  end

  defp validate_message(message) when is_binary(message) do
    if String.trim(message) == "" do
      {:error, :empty_message}
    else
      :ok
    end
  end

  defp validate_message(_), do: {:error, :invalid_message}

  defp get_voice(voice_id) do
    case VoiceModels.resolve_voice(voice_id) do
      nil -> {:error, :invalid_voice}
      voice -> {:ok, voice}
    end
  end

  defp build_s3_path(voice_id, content_hash) do
    "tts/#{voice_id}_#{content_hash}.mp3"
  end

  defp check_cache(s3_path) do
    case S3.file_exists?(s3_path) do
      {:ok, true} -> {:ok, :cached}
      {:ok, false} -> {:ok, :not_cached}
      {:error, reason} -> {:ok, :not_cached}
    end
  end

  defp generate_and_upload(message, voice, s3_path, content_hash) do
    with {:ok, audio_data} <- generate_tts(message, voice),
         {:ok, _} <- upload_to_s3(audio_data, s3_path) do
      Logger.info("TTS generated and uploaded",
        voice: voice.id,
        hash: content_hash,
        path: s3_path
      )

      {:ok, s3_path}
    else
      {:error, reason} = error ->
        Logger.error("TTS generation failed",
          voice: voice.id,
          hash: content_hash,
          reason: inspect(reason)
        )

        error
    end
  end

  defp generate_tts(message, voice) do
    Streampai.TTS.ProviderRegistry.generate(message, voice.id)
  end

  defp upload_to_s3(audio_data, s3_path) do
    S3.upload_file(audio_data, s3_path, content_type: "audio/mpeg")
  end
end
