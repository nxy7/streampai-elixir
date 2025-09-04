defmodule Streampai.External.CloudflareAPIClient do
  @moduledoc """
  Global Cloudflare API client with rate limiting and connection pooling.
  Handles all Cloudflare API requests for the livestream system.
  """
  use GenServer
  require Logger

  defstruct [
    :api_token,
    :account_id,
    :base_url,
    :rate_limit_remaining,
    :rate_limit_reset,
    :request_queue
  ]

  def start_link(opts \\ []) do
    name_opts =
      if Application.get_env(:streampai, :test_mode, false) do
        # In test mode, allow unnamed processes to avoid conflicts
        opts
      else
        # In non-test mode, use global name
        Keyword.put_new(opts, :name, __MODULE__)
      end

    GenServer.start_link(__MODULE__, :ok, name_opts)
  end

  @impl true
  def init(:ok) do
    config = load_config()

    state = %__MODULE__{
      api_token: config.api_token,
      account_id: config.account_id,
      base_url: "https://api.cloudflare.com/client/v4",
      # Cloudflare default
      rate_limit_remaining: 1200,
      rate_limit_reset: System.system_time(:second) + 300,
      request_queue: :queue.new()
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
  def handle_call({:update_live_output, output_id, config}, _from, state) do
    # TODO: Implement output update
    {:reply, {:error, :not_implemented}, state}
  end

  @impl true
  def handle_call({:toggle_live_output, output_id, enabled}, _from, state) do
    # TODO: Implement output toggle
    {:reply, {:error, :not_implemented}, state}
  end

  # Helper functions

  defp load_config do
    %{
      api_token: System.get_env("CLOUDFLARE_API_TOKEN") || "mock_token",
      account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID") || "mock_account"
    }
  end

  defp make_api_request(state, method, path, payload \\ nil) do
    if state.rate_limit_remaining > 0 or System.system_time(:second) > state.rate_limit_reset do
      # For now, return mock responses
      mock_api_response(state, method, path, payload)
    else
      Logger.warning("Cloudflare API rate limit exceeded, queueing request")
      {:error, :rate_limited, state}
    end
  end

  # Mock API responses for development
  defp mock_api_response(state, :post, path, payload) do
    cond do
      String.contains?(path, "live_inputs") and not String.contains?(path, "outputs") ->
        # Creating live input
        response = %{
          "result" => %{
            "uid" =>
              "live_input_" <> (:crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)),
            "rtmps" => %{
              "url" => "rtmps://live.cloudflare.com:443/live",
              "streamKey" => generate_stream_key()
            },
            "rtmp" => %{
              "url" => "rtmp://live.cloudflare.com/live",
              "streamKey" => generate_stream_key()
            },
            "srt" => %{
              "url" => "srt://live.cloudflare.com:778",
              "streamId" => generate_stream_key()
            },
            "webRTC" => %{
              "url" => "https://webrtc.live.cloudflare.com"
            },
            "status" => %{"current" => "connected"},
            "meta" => payload["meta"],
            "created" => DateTime.utc_now() |> DateTime.to_iso8601()
          },
          "success" => true
        }

        {:ok, response, update_rate_limits(state)}

      String.contains?(path, "outputs") ->
        # Creating live output
        response = %{
          "result" => %{
            "uid" => "output_" <> (:crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)),
            "url" => payload["url"],
            "streamKey" => payload["streamKey"],
            "enabled" => payload["enabled"],
            "created" => DateTime.utc_now() |> DateTime.to_iso8601()
          },
          "success" => true
        }

        {:ok, response, update_rate_limits(state)}

      true ->
        {:error, :unknown_endpoint, state}
    end
  end

  defp mock_api_response(state, :delete, _path, _payload) do
    response = %{"result" => nil, "success" => true}
    {:ok, response, update_rate_limits(state)}
  end

  defp update_rate_limits(state) do
    %{
      state
      | rate_limit_remaining: max(0, state.rate_limit_remaining - 1),
        rate_limit_reset:
          if(state.rate_limit_remaining <= 1,
            do: System.system_time(:second) + 300,
            else: state.rate_limit_reset
          )
    }
  end

  defp generate_stream_key do
    :crypto.strong_rand_bytes(32) |> Base.encode64() |> String.slice(0, 32)
  end
end
