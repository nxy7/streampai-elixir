defmodule Streampai.AiChat.ProviderRegistry do
  @moduledoc """
  Registry of all AI chat LLM providers.

  To add a new provider, create a module implementing the
  `Streampai.AiChat.Provider` behaviour and add it to `@providers`.
  """

  @providers [
    Streampai.AiChat.Providers.OpenAI
  ]

  def providers, do: @providers

  def enabled_providers do
    Enum.filter(@providers, & &1.enabled?())
  end

  @doc "Returns the first enabled provider, or nil."
  def default_provider do
    List.first(enabled_providers())
  end

  @doc "Gets a provider by name atom."
  def get_provider(name) when is_atom(name) do
    Enum.find(@providers, &(&1.name() == name))
  end

  def get_provider(name) when is_binary(name) do
    get_provider(String.to_existing_atom(name))
  rescue
    ArgumentError -> nil
  end

  @doc "Gets a provider by name, falling back to default."
  def get_provider_or_default(nil), do: default_provider()

  def get_provider_or_default(name) do
    get_provider(name) || default_provider()
  end
end
