defmodule Streampai.HTTP.ResponseHandler do
  @moduledoc """
  Shared HTTP response handling utilities for API clients.

  This module provides consistent response parsing and error handling
  across all API clients (YouTube, Twitch, PayPal, Cloudflare, etc.).

  ## Usage

      # In your API client module:
      import Streampai.HTTP.ResponseHandler, only: [handle_http_response: 2]

      def some_api_call(params) do
        Req.get(url: "...", params: params)
        |> handle_http_response("SomeAPI")
      end

  ## Response Format

  All handlers return:
  - `{:ok, body}` for successful responses (2xx status codes)
  - `{:error, {:http_error, status, body}}` for HTTP errors
  - `{:error, reason}` for connection/transport errors
  """

  require Logger

  @type http_response :: {:ok, Req.Response.t()} | {:error, term()}
  @type api_name :: String.t()
  @type result :: {:ok, map() | binary()} | {:error, term()}

  @doc """
  Handles HTTP responses from Req library with consistent error handling and logging.

  ## Parameters
  - `response` - The response tuple from Req.get/post/etc
  - `api_name` - Name of the API for logging (e.g., "YouTube", "Twitch", "PayPal")

  ## Examples

      iex> handle_http_response({:ok, %{status: 200, body: %{"data" => []}}}, "YouTube")
      {:ok, %{"data" => []}}

      iex> handle_http_response({:ok, %{status: 401, body: %{"error" => "unauthorized"}}}, "Twitch")
      {:error, {:http_error, 401, %{"error" => "unauthorized"}}}

      iex> handle_http_response({:error, :timeout}, "PayPal")
      {:error, :timeout}
  """
  @spec handle_http_response(http_response(), api_name()) :: result()
  def handle_http_response({:ok, %{status: status, body: body}}, _api_name) when status in 200..299 do
    {:ok, body}
  end

  def handle_http_response({:ok, %{status: status, body: body}}, api_name) do
    Logger.warning("#{api_name} API request failed with status #{status}: #{inspect(body)}")
    {:error, {:http_error, status, body}}
  end

  def handle_http_response({:error, reason}, api_name) do
    Logger.error("#{api_name} API request failed: #{inspect(reason)}")
    {:error, reason}
  end

  @doc """
  Handles raw Req.Response structs (without the tuple wrapper).

  Useful when you've already extracted the response from the tuple.

  ## Examples

      iex> handle_raw_response(%{status: 200, body: %{"data" => []}}, "API")
      {:ok, %{"data" => []}}
  """
  @spec handle_raw_response(Req.Response.t(), api_name()) :: result()
  def handle_raw_response(%{status: status, body: body}, _api_name) when status in 200..299 do
    {:ok, body}
  end

  def handle_raw_response(%{status: status, body: body}, api_name) do
    Logger.warning("#{api_name} API error #{status}: #{inspect(body)}")
    {:error, {:http_error, status, body}}
  end
end
