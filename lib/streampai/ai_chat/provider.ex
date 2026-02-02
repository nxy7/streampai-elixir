defmodule Streampai.AiChat.Provider do
  @moduledoc """
  Behaviour for AI chat LLM provider implementations.

  Each provider wraps a LangChain ChatModel and must implement functions
  to check availability, build a chat model instance, and identify itself.

  Follows the same pattern as `Streampai.TTS.Provider`.
  """

  @doc "Returns the provider name as an atom (e.g. :openai, :anthropic, :ollama)"
  @callback name() :: atom()

  @doc "Returns true if the provider has required configuration (API keys, etc.)"
  @callback enabled?() :: boolean()

  @doc "Builds a LangChain ChatModel struct for generating chat responses."
  @callback build_response_model(opts :: keyword()) :: {:ok, struct()} | {:error, term()}

  @doc "Builds a LangChain ChatModel struct for the cheap evaluator (should-I-respond check)."
  @callback build_evaluator_model(opts :: keyword()) :: {:ok, struct()} | {:error, term()}

  @optional_callbacks [build_evaluator_model: 1]
end
