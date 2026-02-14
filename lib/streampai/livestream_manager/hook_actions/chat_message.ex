defmodule Streampai.LivestreamManager.HookActions.ChatMessage do
  @moduledoc """
  Executes a chat message hook action by sending a message to the stream chat.
  """

  alias Streampai.LivestreamManager.HookActions.Template
  alias Streampai.LivestreamManager.StreamManager

  require Logger

  @doc """
  Sends a chat message to the user's active stream.

  ## action_config keys
  - `"message"` (required) — template string for the message
  """
  @spec execute(map(), map(), map()) :: {:ok, integer()} | {:error, term()}
  def execute(hook, event, %{user_id: user_id}) do
    config = hook.action_config || %{}
    template = config["message"]

    if template do
      variables = Template.extract_variables(event)
      message = Template.interpolate(template, variables)

      start = System.monotonic_time(:millisecond)

      try do
        StreamManager.send_chat_message(user_id, message)
        duration = System.monotonic_time(:millisecond) - start
        {:ok, duration}
      rescue
        e ->
          Logger.error("[HookActions.ChatMessage] failed: #{inspect(e)}")
          {:error, inspect(e)}
      end
    else
      {:error, "Missing message template"}
    end
  end
end
