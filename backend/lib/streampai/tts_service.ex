defmodule Streampai.TtsService do
  @moduledoc """
  Service for generating and caching Text-to-Speech audio files.

  Uses content hashing to avoid regenerating TTS for the same message + voice combination.
  This saves on TTS provider costs and improves response times.
  """

  require Logger

  @doc """
  Gets existing TTS file or generates a new one for the given message and voice.

  Returns {:ok, file_path} or {:error, reason}
  """
  def get_or_generate_tts(message, voice) when is_binary(message) and is_binary(voice) do
    if String.trim(message) == "" do
      {:error, :empty_message}
    else
      content_hash = generate_content_hash(message, voice)

      Logger.info("Mock TTS generation", %{message: message, voice: voice, hash: content_hash})

      # Return mock TTS path without creating any files
      mock_tts_path = generate_mock_tts_path(content_hash)
      {:ok, mock_tts_path}
    end
  end

  def get_or_generate_tts(nil, _voice), do: {:error, :empty_message}

  @doc """
  Generates a hash for the message + voice combination.
  """
  def generate_content_hash(message, voice) do
    content = "#{message}|#{voice}"
    :sha256 |> :crypto.hash(content) |> Base.encode16() |> String.downcase()
  end

  defp generate_mock_tts_path(content_hash) do
    # Generate a mock path that looks like a real TTS file would be served from
    # In production, this would be the actual path to the generated MP3 file
    "/tts/#{content_hash}.mp3"
  end

  @doc """
  Gets the public URL for a TTS file path.
  For mock implementation, the path already contains the public URL.
  """
  def get_tts_public_url(file_path) when is_binary(file_path) do
    # For mock implementation, the path is already the public URL
    file_path
  end

  def get_tts_public_url(nil), do: nil
end
