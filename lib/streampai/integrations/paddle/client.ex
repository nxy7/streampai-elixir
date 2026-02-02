defmodule Streampai.Integrations.Paddle.Client do
  @moduledoc """
  HTTP client for the Paddle Billing API.

  Handles Bearer token authentication and request routing for sandbox/live environments.

  ## Configuration

      config :streampai, :paddle,
        api_key: "pdl_sdbx_...",
        webhook_secret: "pdl_ntfset_...",
        environment: :sandbox  # or :live
  """

  import Streampai.HTTP.ResponseHandler, only: [handle_http_response: 2]

  require Logger

  @sandbox_base_url "https://sandbox-api.paddle.com"
  @live_base_url "https://api.paddle.com"
  @receive_timeout 30_000

  @doc "Make an authenticated GET request to the Paddle API."
  def get(path, opts \\ []) do
    request(:get, path, nil, opts)
  end

  @doc "Make an authenticated POST request to the Paddle API."
  def post(path, body, opts \\ []) do
    request(:post, path, body, opts)
  end

  @doc "Make an authenticated PATCH request to the Paddle API."
  def patch(path, body, opts \\ []) do
    request(:patch, path, body, opts)
  end

  @doc "Make an authenticated DELETE request to the Paddle API."
  def delete(path, opts \\ []) do
    request(:delete, path, nil, opts)
  end

  defp request(method, path, body, opts) do
    {params, _opts} = Keyword.pop(opts, :params, [])

    req_opts = [
      method: method,
      url: "#{base_url()}#{path}",
      headers: [
        {"Authorization", "Bearer #{api_key()}"}
      ],
      params: params,
      receive_timeout: @receive_timeout
    ]

    req_opts = if body, do: Keyword.put(req_opts, :json, body), else: req_opts

    req_opts
    |> Req.request()
    |> handle_http_response("Paddle")
  end

  defp base_url do
    case config()[:environment] do
      :live -> @live_base_url
      _ -> @sandbox_base_url
    end
  end

  defp api_key do
    config()[:api_key] || raise "Paddle API key not configured"
  end

  @doc false
  def config do
    Application.get_env(:streampai, :paddle, [])
  end
end
