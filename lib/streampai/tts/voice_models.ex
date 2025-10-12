defmodule Streampai.TTS.VoiceModels do
  @moduledoc """
  Facade for accessing TTS voice models from all registered providers.

  This module delegates to `Streampai.TTS.ProviderRegistry` to provide
  a unified interface for voice model access across all TTS providers.

  Voices are automatically aggregated from all registered providers.
  To add a new provider, see `Streampai.TTS.ProviderRegistry`.
  """

  alias Streampai.TTS.ProviderRegistry

  @doc """
  Returns all available voice models from all enabled providers.
  """
  def list_voices do
    ProviderRegistry.list_all_voices()
  end

  @doc """
  Gets a voice model by its ID.
  """
  def get_voice(voice_id) do
    ProviderRegistry.get_voice(voice_id)
  end

  @doc """
  Gets a voice model by ID, falling back to default if not found.
  """
  def get_voice_or_default(voice_id) do
    ProviderRegistry.get_voice_or_default(voice_id)
  end

  @doc """
  Returns the default voice model.
  """
  def default_voice do
    ProviderRegistry.default_voice()
  end

  @doc """
  Checks if a voice ID is valid.
  """
  def valid_voice?(voice_id) do
    ProviderRegistry.valid_voice?(voice_id)
  end

  @doc """
  Returns voice options formatted for select dropdowns.

  Use `grouped: true` to group voices by provider.
  """
  def voice_options(opts \\ []) do
    if Keyword.get(opts, :grouped, false) do
      ProviderRegistry.voice_options()
    else
      ProviderRegistry.flat_voice_options()
    end
  end

  @doc """
  Resolves a voice ID, handling the special "random" value.

  If voice_id is "random", returns a random voice from all available voices.
  Otherwise, returns the voice matching the ID or the default voice.
  """
  def resolve_voice(voice_id) when voice_id == "random" do
    case list_voices() do
      [] -> default_voice()
      voices -> Enum.random(voices)
    end
  end

  def resolve_voice(voice_id) do
    get_voice_or_default(voice_id)
  end
end
