defmodule Streampai.Integrations.PayPal.Client do
  @moduledoc """
  HTTP client for PayPal REST APIs.

  Handles authentication, requests, and error handling for PayPal API calls.
  Supports both sandbox and production environments.
  """
  import Streampai.HTTP.ResponseHandler, only: [handle_raw_response: 2]

  require Logger

  @sandbox_base_url "https://api.sandbox.paypal.com"
  @production_base_url "https://api.paypal.com"

  @doc """
  Get an access token using client credentials.
  """
  def get_access_token do
    config = get_config()

    case Req.post(
           "#{base_url()}/v1/oauth2/token",
           form: [grant_type: "client_credentials"],
           auth: {:basic, "#{config.client_id}:#{config.secret}"},
           headers: [
             accept: "application/json",
             "accept-language": "en_US"
           ]
         ) do
      {:ok, %{status: 200, body: %{"access_token" => token, "expires_in" => expires_in}}} ->
        {:ok, %{token: token, expires_in: expires_in}}

      {:ok, %{status: status, body: body}} ->
        Logger.error("PayPal auth failed with status #{status}: #{inspect(body)}")
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        Logger.error("PayPal auth request failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Make an authenticated GET request to PayPal API.
  """
  def get(path, opts \\ []) do
    request(:get, path, nil, opts)
  end

  @doc """
  Make an authenticated POST request to PayPal API.
  """
  def post(path, body, opts \\ []) do
    request(:post, path, body, opts)
  end

  @doc """
  Make an authenticated PATCH request to PayPal API.
  """
  def patch(path, body, opts \\ []) do
    request(:patch, path, body, opts)
  end

  @doc """
  Make an authenticated DELETE request to PayPal API.
  """
  def delete(path, opts \\ []) do
    request(:delete, path, nil, opts)
  end

  defp request(method, path, body, opts) do
    with {:ok, token} <- get_or_refresh_token(),
         {:ok, headers} <- build_headers(token, opts),
         {:ok, response} <- make_request(method, path, body, headers) do
      handle_raw_response(response, "PayPal")
    end
  end

  defp get_or_refresh_token do
    # TODO: Implement token caching with ETS or similar
    # For now, get a fresh token each time
    case get_access_token() do
      {:ok, %{token: token}} -> {:ok, token}
      error -> error
    end
  end

  defp build_headers(token, opts) do
    headers = [
      {"Authorization", "Bearer #{token}"},
      {"Content-Type", "application/json"},
      {"Accept", "application/json"}
    ]

    headers =
      case Keyword.get(opts, :merchant_id) do
        nil ->
          headers

        merchant_id ->
          # Add PayPal-Auth-Assertion header for partner calls
          assertion = generate_auth_assertion(merchant_id)
          [{"PayPal-Auth-Assertion", assertion} | headers]
      end

    headers =
      case Keyword.get(opts, :idempotency_key) do
        nil -> headers
        key -> [{"PayPal-Request-Id", key} | headers]
      end

    {:ok, headers}
  end

  defp make_request(method, path, body, headers) do
    url = "#{base_url()}#{path}"

    opts = [
      method: method,
      url: url,
      headers: convert_headers(headers),
      receive_timeout: 30_000
    ]

    opts = if body, do: Keyword.put(opts, :json, body), else: opts

    case Req.request(opts) do
      {:ok, response} -> {:ok, response}
      {:error, reason} -> {:error, reason}
    end
  end

  defp convert_headers(headers) do
    Enum.map(headers, fn
      {k, v} when is_binary(k) -> {String.downcase(k), v}
      {k, v} -> {k, v}
    end)
  end

  defp generate_auth_assertion(merchant_id) do
    config = get_config()

    header = %{
      "alg" => "none"
    }

    payload = %{
      "iss" => config.client_id,
      "payer_id" => merchant_id
    }

    header_json = header |> Jason.encode!() |> Base.url_encode64(padding: false)
    payload_json = payload |> Jason.encode!() |> Base.url_encode64(padding: false)

    "#{header_json}.#{payload_json}."
  end

  defp base_url do
    if sandbox_mode?(), do: @sandbox_base_url, else: @production_base_url
  end

  defp sandbox_mode? do
    get_config().mode == :sandbox
  end

  defp get_config do
    :streampai
    |> Application.get_env(:paypal, %{})
    |> Map.new()
  end
end
