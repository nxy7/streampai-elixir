defmodule Streampai.AiChat.Handler do
  @moduledoc """
  Orchestrates AI chat participation: evaluation and response generation.

  Pure-function module invoked by ChatBotServer. Handles:
  - Building system prompts from personality configuration
  - Formatting chat history for LLM context
  - Evaluating whether the bot should respond (cheap model call)
  - Generating chat responses (quality model call)
  - Parsing and sanitizing LLM output
  """

  alias LangChain.Message

  require Logger

  @default_personality """
  You are a friendly and entertaining stream chat bot. You engage naturally \
  with viewers, crack jokes, and keep the energy positive. You speak in short, \
  casual messages like a real chat participant — no paragraphs. Use emojis \
  occasionally but don't overdo it. Never be rude or inappropriate. If someone \
  asks you something you don't know, just be honest about it. Keep responses \
  under 200 characters when possible.\
  """

  @evaluation_system_prompt """
  You are a chat participation evaluator for a livestream bot.
  Given the recent chat messages, decide if the bot should participate.

  Respond with ONLY "yes" or "no".

  The bot SHOULD respond when:
  - The conversation is active and the bot can add value
  - Someone asks a general question the bot could answer
  - There's a natural opening for humor or engagement
  - The conversation topic is something the bot can contribute to

  The bot should NOT respond when:
  - People are having a private conversation
  - The chat is just emotes or spam
  - Messages are too short or meaningless
  - Messages are commands (starting with ! or /)
  """

  @max_response_length 450

  @doc """
  Evaluates whether the bot should participate in the current conversation.
  """
  @spec should_respond?(provider :: module(), messages :: list(), bot_name :: String.t()) ::
          {:ok, boolean()} | {:error, term()}
  def should_respond?(provider, messages, bot_name) do
    with {:ok, model} <- build_evaluator_model(provider) do
      formatted = format_messages_for_context(messages, bot_name)

      llm_messages = [
        Message.new_system!(@evaluation_system_prompt),
        Message.new_user!("Recent chat messages:\n#{formatted}\n\nShould the bot respond?")
      ]

      case call_model(model, llm_messages) do
        {:ok, [%Message{content: content} | _]} ->
          {:ok, parse_yes_no(content)}

        {:ok, %Message{content: content}} ->
          {:ok, parse_yes_no(content)}

        {:error, reason} ->
          Logger.warning("[AiChat.Handler] Evaluation failed: #{inspect(reason)}")
          {:error, reason}
      end
    end
  rescue
    error ->
      Logger.error("[AiChat.Handler] Evaluation crashed: #{inspect(error)}")
      {:error, error}
  end

  @doc """
  Generates a chat response given recent messages and personality config.
  """
  @spec generate_response(
          provider :: module(),
          messages :: list(),
          personality :: String.t() | nil,
          bot_name :: String.t()
        ) :: {:ok, String.t()} | {:error, term()}
  def generate_response(provider, messages, personality, bot_name) do
    with {:ok, model} <- provider.build_response_model([]) do
      system_prompt = build_system_prompt(personality, bot_name)
      formatted = format_messages_for_context(messages, bot_name)

      llm_messages = [
        Message.new_system!(system_prompt),
        Message.new_user!("Here are the recent chat messages. Respond naturally as #{bot_name}:\n\n#{formatted}")
      ]

      case call_model(model, llm_messages) do
        {:ok, [%Message{content: content} | _]} ->
          {:ok, sanitize_response(content)}

        {:ok, %Message{content: content}} ->
          {:ok, sanitize_response(content)}

        {:error, reason} ->
          Logger.error("[AiChat.Handler] Response generation failed: #{inspect(reason)}")
          {:error, reason}
      end
    end
  rescue
    error ->
      Logger.error("[AiChat.Handler] Response generation crashed: #{inspect(error)}")
      {:error, error}
  end

  @doc """
  Generates responses to multiple batched message groups in a single LLM call.
  Used when messages accumulate during a rate-limit cooldown period.
  """
  @spec generate_batched_response(
          provider :: module(),
          messages :: list(),
          personality :: String.t() | nil,
          bot_name :: String.t(),
          batch_count :: pos_integer()
        ) :: {:ok, [String.t()]} | {:error, term()}
  def generate_batched_response(provider, messages, personality, bot_name, batch_count) do
    with {:ok, model} <- provider.build_response_model([]) do
      system_prompt = build_system_prompt(personality, bot_name)
      formatted = format_messages_for_context(messages, bot_name)

      batch_instruction =
        if batch_count > 1 do
          "\n\nYou missed a few messages. Generate up to #{min(batch_count, 3)} short responses " <>
            "(each on its own line, separated by ---). Each response should be a separate chat message. " <>
            "Only generate multiple if there are genuinely multiple things worth responding to, " <>
            "otherwise just one response is fine."
        else
          ""
        end

      llm_messages = [
        Message.new_system!(system_prompt),
        Message.new_user!(
          "Here are the recent chat messages. Respond naturally as #{bot_name}:#{batch_instruction}\n\n#{formatted}"
        )
      ]

      case call_model(model, llm_messages) do
        {:ok, [%Message{content: content} | _]} ->
          {:ok, parse_batch_responses(content)}

        {:ok, %Message{content: content}} ->
          {:ok, parse_batch_responses(content)}

        {:error, reason} ->
          Logger.error("[AiChat.Handler] Batched response failed: #{inspect(reason)}")
          {:error, reason}
      end
    end
  rescue
    error ->
      Logger.error("[AiChat.Handler] Batched response crashed: #{inspect(error)}")
      {:error, error}
  end

  @doc "Checks if a message mentions the bot by name."
  @spec mentioned?(message :: String.t(), bot_name :: String.t()) :: boolean()
  def mentioned?(message, bot_name) do
    downcased = String.downcase(message)
    bot_lower = String.downcase(bot_name)

    String.contains?(downcased, "@#{bot_lower}") or
      String.contains?(downcased, bot_lower)
  end

  # -- Private --

  # Dispatch call to the correct LangChain ChatModel implementation.
  # LangChain uses `%module{} = model; module.call(model, messages, tools)`.
  defp call_model(model, messages) do
    %module{} = model
    module.call(model, messages, [])
  end

  defp build_evaluator_model(provider) do
    if function_exported?(provider, :build_evaluator_model, 1) do
      provider.build_evaluator_model([])
    else
      provider.build_response_model([])
    end
  end

  defp build_system_prompt(nil, bot_name), do: "Your name is #{bot_name}. #{@default_personality}"
  defp build_system_prompt("", bot_name), do: "Your name is #{bot_name}. #{@default_personality}"

  defp build_system_prompt(personality, bot_name) do
    "Your name is #{bot_name}. #{personality}"
  end

  defp format_messages_for_context(messages, _bot_name) do
    messages
    |> Enum.reverse()
    |> Enum.map_join("\n", fn msg ->
      "[#{msg.username}]: #{msg.message}"
    end)
  end

  defp parse_yes_no(content) when is_list(content) do
    content |> extract_text() |> parse_yes_no()
  end

  defp parse_yes_no(content) when is_binary(content) do
    content
    |> String.trim()
    |> String.downcase()
    |> String.starts_with?("yes")
  end

  defp parse_yes_no(_), do: false

  defp parse_batch_responses(content) do
    content
    |> extract_text()
    |> String.split("---")
    |> Enum.map(&sanitize_response/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.take(3)
  end

  defp sanitize_response(content) when is_list(content) do
    content |> extract_text() |> sanitize_response()
  end

  defp sanitize_response(content) when is_binary(content) do
    content
    |> String.trim()
    |> String.replace(~r/^\[.*?\]:\s*/, "")
    |> String.slice(0, @max_response_length)
  end

  defp sanitize_response(_), do: ""

  defp extract_text(content) when is_list(content) do
    Enum.map_join(content, " ", fn
      %{text: t} -> t
      %{content: c} when is_binary(c) -> c
      other when is_binary(other) -> other
      _ -> ""
    end)
  end

  defp extract_text(content) when is_binary(content), do: content
  defp extract_text(_), do: ""
end
