defmodule Streampai.TtsService do
  @moduledoc """
  Service for generating and caching Text-to-Speech audio files.

  Delegates to Streampai.TTS.Generator for actual TTS generation with S3 caching.
  This module provides backward compatibility for existing code.
  """

  alias Streampai.Storage.S3
  alias Streampai.TTS.Generator

  @doc """
  Gets existing TTS file or generates a new one for the given message and voice.

  Returns {:ok, file_path} or {:error, reason}
  """
  def get_or_generate_tts(message, voice) when is_binary(message) and is_binary(voice) do
    Generator.get_or_generate(message, voice)
  end

  def get_or_generate_tts(nil, _voice), do: {:error, :empty_message}

  @doc """
  Generates a hash for the message content.
  """
  def generate_content_hash(message) do
    Generator.generate_content_hash(message)
  end

  @doc """
  Gets the public URL for a TTS file path.
  """
  def get_tts_public_url(file_path) when is_binary(file_path) do
    S3.get_public_url(file_path)
  end

  def get_tts_public_url(nil), do: nil
end
