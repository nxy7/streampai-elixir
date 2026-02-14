defmodule Streampai.LivestreamManager.HookActions.Webhook do
  @moduledoc """
  Executes a webhook hook action by making an HTTP request.
  """

  alias Streampai.LivestreamManager.HookActions.Template

  require Logger

  @timeout 10_000

  @doc """
  Fires an HTTP request to the configured webhook URL.

  ## action_config keys
  - `"url"` (required) — target URL
  - `"method"` — HTTP method, defaults to `"POST"`
  - `"headers"` — map of extra headers
  - `"body_template"` — template string for the body (interpolated with event data)
  """
  @spec execute(map(), map(), map()) :: {:ok, integer()} | {:error, term()}
  def execute(hook, event, _context) do
    config = hook.action_config || %{}
    url = config["url"]

    if url do
      method = parse_method(config["method"])
      extra_headers = config["headers"] || %{}
      variables = Template.extract_variables(event)

      body =
        case config["body_template"] do
          nil -> default_body(hook, event, variables)
          tmpl -> Template.interpolate(tmpl, variables)
        end

      start = System.monotonic_time(:millisecond)

      result =
        Req.request(
          method: method,
          url: url,
          headers: Map.to_list(extra_headers),
          body: body,
          receive_timeout: @timeout,
          connect_options: [timeout: @timeout]
        )

      duration = System.monotonic_time(:millisecond) - start

      case result do
        {:ok, %Req.Response{status: status}} when status in 200..299 ->
          {:ok, duration}

        {:ok, %Req.Response{status: status, body: resp_body}} ->
          Logger.warning("[HookActions.Webhook] HTTP #{status} from #{url}: #{inspect(resp_body)}")

          {:error, "HTTP #{status}"}

        {:error, reason} ->
          Logger.error("[HookActions.Webhook] request failed: #{inspect(reason)}")
          {:error, inspect(reason)}
      end
    else
      {:error, "Missing webhook URL"}
    end
  end

  defp parse_method("GET"), do: :get
  defp parse_method("get"), do: :get
  defp parse_method("PUT"), do: :put
  defp parse_method("put"), do: :put
  defp parse_method("PATCH"), do: :patch
  defp parse_method("patch"), do: :patch
  defp parse_method("DELETE"), do: :delete
  defp parse_method("delete"), do: :delete
  defp parse_method(_), do: :post

  defp default_body(hook, _event, variables) do
    Jason.encode!(%{
      hook_name: hook.name,
      trigger_type: to_string(hook.trigger_type),
      username: variables["username"],
      message: variables["message"],
      amount: variables["amount"],
      currency: variables["currency"],
      platform: variables["platform"],
      timestamp: DateTime.to_iso8601(DateTime.utc_now())
    })
  end
end
