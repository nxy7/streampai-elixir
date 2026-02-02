defmodule Streampai.AiChat.Providers.OpenAI do
  @moduledoc """
  OpenAI-based AI chat provider using LangChain's ChatOpenAI.

  Uses gpt-4o-mini for both evaluation and response generation.
  """
  @behaviour Streampai.AiChat.Provider

  alias LangChain.ChatModels.ChatOpenAI

  @impl true
  def name, do: :openai

  @impl true
  def enabled? do
    not is_nil(Application.get_env(:streampai, :openai_api_key))
  end

  @impl true
  def build_response_model(opts \\ []) do
    ChatOpenAI.new(%{
      model: Keyword.get(opts, :model, "gpt-4o-mini"),
      api_key: Application.get_env(:streampai, :openai_api_key),
      temperature: Keyword.get(opts, :temperature, 0.8),
      max_tokens: Keyword.get(opts, :max_tokens, 200),
      stream: false
    })
  end

  @impl true
  def build_evaluator_model(opts \\ []) do
    ChatOpenAI.new(%{
      model: Keyword.get(opts, :model, "gpt-4o-mini"),
      api_key: Application.get_env(:streampai, :openai_api_key),
      temperature: 0.1,
      max_tokens: 10,
      stream: false
    })
  end
end
