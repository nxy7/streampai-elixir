defmodule Streampai.LivestreamManager.HookActions.DiscordMessage do
  @moduledoc """
  Executes a Discord webhook hook action.
  """

  alias Streampai.LivestreamManager.HookActions.Template

  require Logger

  @timeout 10_000

  @doc """
  Sends a message to a Discord webhook URL.

  ## action_config keys
  - `"webhook_url"` (required) — Discord webhook URL
  - `"template"` (required) — template string for the message content
  """
  @spec execute(map(), map(), map()) :: {:ok, integer()} | {:error, term()}
  def execute(hook, event, _context) do
    config = hook.action_config || %{}
    webhook_url = config["webhook_url"]
    template = config["template"]

    cond do
      !webhook_url ->
        {:error, "Missing Discord webhook URL"}

      !template ->
        {:error, "Missing message template"}

      true ->
        variables = Template.extract_variables(event)
        content = Template.interpolate(template, variables)

        start = System.monotonic_time(:millisecond)

        result =
          Req.post(webhook_url,
            json: %{content: content},
            receive_timeout: @timeout,
            connect_options: [timeout: @timeout]
          )

        duration = System.monotonic_time(:millisecond) - start

        case result do
          {:ok, %Req.Response{status: status}} when status in 200..299 ->
            {:ok, duration}

          {:ok, %Req.Response{status: status, body: body}} ->
            Logger.warning("[HookActions.DiscordMessage] HTTP #{status}: #{inspect(body)}")
            {:error, "HTTP #{status}"}

          {:error, reason} ->
            Logger.error("[HookActions.DiscordMessage] failed: #{inspect(reason)}")
            {:error, inspect(reason)}
        end
    end
  end
end
