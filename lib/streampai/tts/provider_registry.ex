defmodule Streampai.TTS.ProviderRegistry do
  @moduledoc """
  Registry of all TTS providers.

  Manages provider registration and provides access to all available voices
  across all providers.

  To add a new provider:
  1. Create a module implementing the `Streampai.TTS.Provider` behaviour
  2. Add it to the `@providers` list below
  3. The provider's voices will automatically be available
  """

  @providers [
    Streampai.TTS.Providers.OpenAI,
    Streampai.TTS.Providers.ElevenLabs
  ]

  @doc """
  Returns all registered provider modules.
  """
  def providers, do: @providers

  @doc """
  Returns all registered and enabled provider modules.

  Filters out providers that don't have the required configuration.
  """
  def enabled_providers do
    Enum.filter(@providers, fn provider ->
      if function_exported?(provider, :enabled?, 0) do
        provider.enabled?()
      else
        true
      end
    end)
  end

  @doc """
  Returns all available voices from all enabled providers.

  ## Examples

      iex> ProviderRegistry.list_all_voices()
      [
        %{id: "openai_alloy", name: "Alloy (Neutral)", provider: :openai, ...},
        %{id: "elevenlabs_rachel", name: "Rachel (Calm)", provider: :elevenlabs, ...}
      ]
  """
  def list_all_voices do
    enabled_providers()
    |> Enum.flat_map(fn provider -> provider.voices() end)
    |> Enum.sort_by(& &1.name)
  end

  @doc """
  Gets a specific voice by its ID from any provider.

  Returns nil if the voice is not found.

  ## Examples

      iex> ProviderRegistry.get_voice("openai_alloy")
      %{id: "openai_alloy", name: "Alloy (Neutral)", ...}

      iex> ProviderRegistry.get_voice("unknown_voice")
      nil
  """
  def get_voice(voice_id) do
    Enum.find(list_all_voices(), &(&1.id == voice_id))
  end

  @doc """
  Gets a voice by ID, falling back to default if not found.

  The default voice is the first voice from the first enabled provider.
  """
  def get_voice_or_default(voice_id) do
    get_voice(voice_id) || default_voice()
  end

  @doc """
  Returns the default voice (first voice from first enabled provider).
  """
  def default_voice do
    case enabled_providers() do
      [] -> nil
      [first_provider | _] -> List.first(first_provider.voices())
    end
  end

  @doc """
  Checks if a voice ID is valid (exists in any provider).
  """
  def valid_voice?(voice_id) do
    not is_nil(get_voice(voice_id))
  end

  @doc """
  Returns voice options formatted for select dropdowns.

  Groups voices by provider for better organization.

  ## Examples

      iex> ProviderRegistry.voice_options()
      [
        %{label: "OpenAI", options: [
          %{value: "openai_alloy", label: "Alloy (Neutral)"},
          ...
        ]},
        %{label: "ElevenLabs", options: [...]}
      ]
  """
  def voice_options do
    Enum.map(enabled_providers(), fn provider ->
      voices =
        Enum.map(provider.voices(), fn voice ->
          %{value: voice.id, label: voice.name}
        end)

      provider_name = provider.name() |> Atom.to_string() |> String.capitalize()

      %{label: provider_name, options: voices}
    end)
  end

  @doc """
  Returns flat voice options without grouping (for simpler UI).
  """
  def flat_voice_options do
    Enum.map(list_all_voices(), fn voice ->
      %{value: voice.id, label: voice.name}
    end)
  end

  @doc """
  Gets the provider module for a given voice.

  Returns nil if the voice is not found.
  """
  def provider_for_voice(voice_id) do
    case get_voice(voice_id) do
      nil -> nil
      voice -> Enum.find(enabled_providers(), &(&1.name() == voice.provider))
    end
  end

  @doc """
  Generates TTS using the appropriate provider for the given voice.

  Returns {:ok, audio_binary} or {:error, reason}
  """
  def generate(message, voice_id) do
    with {:ok, voice} <- find_voice(voice_id),
         {:ok, provider} <- find_provider(voice) do
      provider.generate(message, voice)
    end
  end

  defp find_voice(voice_id) do
    case get_voice(voice_id) do
      nil -> {:error, :voice_not_found}
      voice -> {:ok, voice}
    end
  end

  defp find_provider(voice) do
    case provider_for_voice(voice.id) do
      nil -> {:error, :provider_not_found}
      provider -> {:ok, provider}
    end
  end
end
