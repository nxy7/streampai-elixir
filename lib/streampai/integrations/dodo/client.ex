defmodule Streampai.Integrations.Dodo.Client do
  @moduledoc """
  HTTP client for the Dodo Payments API.

  Handles authentication, requests, and error handling for all Dodo API calls.
  Supports both test and live environments.

  ## Configuration

      config :streampai, :dodo,
        api_key: "sk_...",
        webhook_secret: "whsec_...",
        environment: :test  # or :live
  """

  import Streampai.HTTP.ResponseHandler, only: [handle_http_response: 2]

  require Logger

  @test_base_url "https://test.dodopayments.com"
  @live_base_url "https://live.dodopayments.com"
  @receive_timeout 30_000

  @doc "Make an authenticated GET request to the Dodo API."
  def get(path, opts \\ []) do
    request(:get, path, nil, opts)
  end

  @doc "Make an authenticated POST request to the Dodo API."
  def post(path, body, opts \\ []) do
    request(:post, path, body, opts)
  end

  @doc "Make an authenticated PATCH request to the Dodo API."
  def patch(path, body, opts \\ []) do
    request(:patch, path, body, opts)
  end

  @doc "Make an authenticated PUT request to the Dodo API."
  def put(path, body, opts \\ []) do
    request(:put, path, body, opts)
  end

  @doc "Make an authenticated DELETE request to the Dodo API."
  def delete(path, opts \\ []) do
    request(:delete, path, nil, opts)
  end

  defp request(method, path, body, opts) do
    {params, _opts} = Keyword.pop(opts, :params, [])

    req_opts = [
      method: method,
      url: "#{base_url()}#{path}",
      headers: [{"Authorization", "Bearer #{api_key()}"}],
      params: params,
      receive_timeout: @receive_timeout
    ]

    req_opts = if body, do: Keyword.put(req_opts, :json, body), else: req_opts

    req_opts
    |> Req.request()
    |> handle_http_response("Dodo")
  end

  defp base_url do
    case config()[:environment] do
      :live -> @live_base_url
      _ -> @test_base_url
    end
  end

  defp api_key do
    config()[:api_key] || raise "Dodo Payments API key not configured"
  end

  @doc false
  def config do
    Application.get_env(:streampai, :dodo, [])
  end
end
