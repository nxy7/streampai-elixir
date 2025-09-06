defmodule Streampai.Cloudflare.APIClient do
  @moduledoc """
  Global Cloudflare API client with rate limiting and connection pooling.
  Handles all Cloudflare API requests for the livestream system.
  """
  use GenServer
  require Logger

  defstruct [
    :api_token,
    :account_id,
    :base_url
  ]

  def start_link(opts \\ []) do
    name_opts =
      if Application.get_env(:streampai, :test_mode, false) do
        opts
      else
        opts |> Keyword.put_new(:name, __MODULE__)
      end

    GenServer.start_link(__MODULE__, :ok, name_opts)
  end

  @impl true
  def init(:ok) do
    config = load_config()

    state = %__MODULE__{
      api_token: config.api_token,
      account_id: config.account_id,
      base_url: "https://api.cloudflare.com/client/v4"
    }

    Logger.info("CloudflareAPIClient started")
    {:ok, state}
  end

  # Client API

  @doc """
  Creates a new live input for streaming.
  """
  def create_live_input(name, opts \\ %{})

  def create_live_input(name, opts) when is_binary(name) do
    create_live_input(__MODULE__, name, opts)
  end

  def create_live_input(server, name, opts) do
    GenServer.call(server, {:create_live_input, name, opts}, 10_000)
  end

  @doc """
  Gets a live input by ID.
  """
  def get_live_input(input_id) when is_binary(input_id) do
    get_live_input(__MODULE__, input_id)
  end

  def get_live_input(server, input_id) do
    GenServer.call(server, {:get_live_input, input_id}, 10_000)
  end

  @doc """
  Deletes a live input.
  """
  def delete_live_input(input_id) when is_binary(input_id) do
    delete_live_input(__MODULE__, input_id)
  end

  def delete_live_input(server, input_id) do
    GenServer.call(server, {:delete_live_input, input_id}, 10_000)
  end

  @doc """
  Creates a live output for a platform.
  """
  def create_live_output(input_id, output_config) when is_binary(input_id) do
    create_live_output(__MODULE__, input_id, output_config)
  end

  def create_live_output(server, input_id, output_config) do
    GenServer.call(server, {:create_live_output, input_id, output_config}, 10_000)
  end

  @doc """
  Updates live output configuration.
  """
  def update_live_output(output_id, config) when is_binary(output_id) do
    update_live_output(__MODULE__, output_id, config)
  end

  def update_live_output(server, output_id, config) do
    GenServer.call(server, {:update_live_output, output_id, config}, 10_000)
  end

  @doc """
  Enables/disables a live output.
  """
  def toggle_live_output(output_id, enabled) when is_binary(output_id) do
    toggle_live_output(__MODULE__, output_id, enabled)
  end

  def toggle_live_output(server, output_id, enabled) do
    GenServer.call(server, {:toggle_live_output, output_id, enabled}, 10_000)
  end

  # Server callbacks

  @impl true
  def handle_call({:create_live_input, name, opts}, _from, state) do
    payload = %{
      "meta" => Map.merge(%{"name" => name}, opts[:meta] || %{}),
      "recording" => Map.merge(%{"mode" => "off"}, opts[:recording] || %{})
    }

    case make_api_request(
           state,
           :post,
           "/accounts/#{state.account_id}/stream/live_inputs",
           payload
         ) do
      {:ok, response, new_state} ->
        {:reply, {:ok, response["result"]}, new_state}

      {:error, reason, new_state} ->
        {:reply, {:error, reason}, new_state}
    end
  end

  @impl true
  def handle_call({:get_live_input, input_id}, _from, state) do
    case make_api_request(
           state,
           :get,
           "/accounts/#{state.account_id}/stream/live_inputs/#{input_id}"
         ) do
      {:ok, response, new_state} ->
        {:reply, {:ok, response["result"]}, new_state}

      {:error, reason, new_state} ->
        {:reply, {:error, reason}, new_state}
    end
  end

  @impl true
  def handle_call({:delete_live_input, input_id}, _from, state) do
    case make_api_request(
           state,
           :delete,
           "/accounts/#{state.account_id}/stream/live_inputs/#{input_id}"
         ) do
      {:ok, _response, new_state} ->
        {:reply, :ok, new_state}

      {:error, reason, new_state} ->
        {:reply, {:error, reason}, new_state}
    end
  end

  @impl true
  def handle_call({:create_live_output, input_id, output_config}, _from, state) do
    payload = %{
      "url" => output_config.rtmp_url,
      "streamKey" => output_config.stream_key,
      "enabled" => output_config.enabled
    }

    path = "/accounts/#{state.account_id}/stream/live_inputs/#{input_id}/outputs"

    case make_api_request(state, :post, path, payload) do
      {:ok, response, new_state} ->
        {:reply, {:ok, response["result"]}, new_state}

      {:error, reason, new_state} ->
        {:reply, {:error, reason}, new_state}
    end
  end

  @impl true
  def handle_call({:update_live_output, _output_id, _config}, _from, state) do
    # TODO: Implement output update
    {:reply, {:error, :not_implemented}, state}
  end

  @impl true
  def handle_call({:toggle_live_output, _output_id, _enabled}, _from, state) do
    # TODO: Implement output toggle
    {:reply, {:error, :not_implemented}, state}
  end

  # Helper functions

  defp load_config do
    api_token = System.get_env("CLOUDFLARE_API_TOKEN")
    account_id = System.get_env("CLOUDFLARE_ACCOUNT_ID")

    if is_nil(api_token) or is_nil(account_id) do
      Logger.warning(
        "Cloudflare API credentials not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables."
      )
    end

    %{
      api_token: api_token,
      account_id: account_id
    }
  end

  defp make_api_request(state, method, path, payload \\ nil) do
    case make_http_request(state, method, path, payload) do
      {:ok, response} ->
        {:ok, response, state}

      {:error, reason} ->
        {:error, reason, state}
    end
  end

  defp make_http_request(state, method, path, payload) do
    url = state.base_url <> path

    headers = [
      {"Authorization", "Bearer #{state.api_token}"},
      {"Content-Type", "application/json"}
    ]

    req_opts = [
      method: method,
      url: url,
      headers: headers,
      retry: false
    ]

    req_opts = if payload, do: Keyword.put(req_opts, :json, payload), else: req_opts

    case Req.request(req_opts) do
      {:ok, %{status: status, body: body}} when status in 200..299 ->
        case Jason.decode(body) do
          {:ok, decoded_body} ->
            if decoded_body["success"] do
              {:ok, decoded_body}
            else
              error_msg = get_error_message(decoded_body)
              Logger.error("Cloudflare API error: #{error_msg}")
              {:error, {:api_error, error_msg}}
            end

          {:error, _} ->
            Logger.error("Failed to decode Cloudflare API response: #{inspect(body)}")
            {:error, :decode_error}
        end

      {:ok, %{status: status, body: body}} ->
        Logger.error("Cloudflare API HTTP error #{status}: #{inspect(body)}")
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        Logger.error("Cloudflare API request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp get_error_message(%{"errors" => errors}) when is_list(errors) do
    errors
    |> Enum.map(fn error -> error["message"] || "Unknown error" end)
    |> Enum.join(", ")
  end

  defp get_error_message(%{"errors" => error}) when is_map(error) do
    error["message"] || "Unknown error"
  end

  defp get_error_message(_), do: "Unknown error"
end
