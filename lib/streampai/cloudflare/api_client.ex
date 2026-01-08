defmodule Streampai.Cloudflare.APIClient do
  @moduledoc """
  Stateless Cloudflare API client for livestream system.
  Handles all Cloudflare API requests.
  """
  @behaviour Streampai.Cloudflare.APIClientBehaviour

  require Logger

  # URL builders for live inputs and outputs
  defp live_input_url, do: "/accounts/#{account_id()}/stream/live_inputs"

  defp live_input_url(input_id) when is_binary(input_id), do: "/accounts/#{account_id()}/stream/live_inputs/#{input_id}"

  defp live_output_url(input_id) when is_binary(input_id),
    do: "/accounts/#{account_id()}/stream/live_inputs/#{input_id}/outputs"

  defp live_output_url(input_id, output_id) when is_binary(input_id) and is_binary(output_id),
    do: "/accounts/#{account_id()}/stream/live_inputs/#{input_id}/outputs/#{output_id}"

  # URL builders for videos
  defp videos_url, do: "/accounts/#{account_id()}/stream"

  defp video_url(video_id) when is_binary(video_id), do: "/accounts/#{account_id()}/stream/#{video_id}"

  defp api_token, do: Application.get_env(:streampai, :cloudflare_api_token)
  defp account_id, do: Application.get_env(:streampai, :cloudflare_account_id)
  defp base_url, do: "https://api.cloudflare.com/client/v4"

  defp env, do: Application.get_env(:streampai, :env)

  @doc """
  Creates a new live input for streaming.
  """
  def create_live_input(user_id, opts \\ %{}) when is_binary(user_id) do
    payload = %{
      "meta" =>
        Map.merge(
          %{
            "user_id" => user_id,
            "name" => create_live_input_name(user_id),
            "env" => env()
          },
          opts[:meta] || %{}
        ),
      "recording" =>
        Map.merge(
          %{"mode" => "automatic", "deleteRecordingAfterDays" => 30},
          opts[:recording] || %{}
        )
    }

    path = live_input_url()

    case make_api_request(:post, path, payload) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> handle_api_error(reason, :create_live_input)
    end
  end

  @doc """
  Gets a live input by ID.
  """
  def get_live_input(input_id) when is_binary(input_id) do
    path = live_input_url(input_id)

    case make_api_request(:get, path) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> handle_api_error(reason, :get_live_input)
    end
  end

  @doc """
  Deletes a live input.
  """
  def delete_live_input(input_id) when is_binary(input_id) do
    path = live_input_url(input_id)

    case make_api_request(:delete, path) do
      {:ok, _response} -> :ok
      {:error, reason} -> handle_api_error(reason, :delete_live_input)
    end
  end

  @doc """
  Lists all live inputs for the account.

  ## Options
  - `:include_counts` - Boolean, include total count in response

  ## Returns
  - `{:ok, live_inputs, total}` - List of live input objects and total count
  - `{:error, reason}` - Error tuple

  Each live input object has a "uid" field that can be used with get_live_input/1 or delete_live_input/1.

  ## Example
      iex> list_live_inputs()
      {:ok, [%{"uid" => "abc123...", ...}], 42}

      iex> list_live_inputs(include_counts: true)
      {:ok, [%{"uid" => "...", ...}], 5}
  """
  def list_live_inputs(opts \\ []) do
    query_params =
      opts
      |> Enum.map(fn {key, value} -> {Atom.to_string(key), to_string(value)} end)
      |> URI.encode_query()

    path =
      if query_params == "", do: live_input_url(), else: "#{live_input_url()}?#{query_params}"

    case make_api_request(:get, path) do
      {:ok, response} ->
        live_inputs = response["result"] || []
        total = length(live_inputs)
        {:ok, live_inputs, total}

      {:error, reason} ->
        handle_api_error(reason, :list_live_inputs)
    end
  end

  @doc """
  Creates a live output for a platform.
  """
  def create_live_output(input_id, output_config) when is_binary(input_id) do
    payload = %{
      "url" => output_config.rtmp_url,
      "streamKey" => output_config.stream_key,
      "enabled" => output_config.enabled
    }

    path = live_output_url(input_id)

    case make_api_request(:post, path, payload) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> handle_api_error(reason, :create_live_output)
    end
  end

  @doc """
  Gets a live output by ID.
  """
  def get_live_output(input_uid, output_id) when is_binary(input_uid) and is_binary(output_id) do
    path = live_output_url(input_uid, output_id)

    case make_api_request(:get, path) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> handle_api_error(reason, :get_live_output)
    end
  end

  @doc """
  Lists all live outputs for a given input.
  """
  def list_live_outputs(input_uid) when is_binary(input_uid) do
    path = live_output_url(input_uid)

    case make_api_request(:get, path) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> handle_api_error(reason, :list_live_outputs)
    end
  end

  @doc """
  Toggles live output enabled/disabled state.
  Cloudflare API only supports updating the 'enabled' field.
  """
  def toggle_live_output(input_uid, output_id, enabled)
      when is_binary(input_uid) and is_binary(output_id) and is_boolean(enabled) do
    payload = %{"enabled" => enabled}
    path = live_output_url(input_uid, output_id)

    case make_api_request(:put, path, payload) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> handle_api_error(reason, :toggle_live_output)
    end
  end

  @doc """
  Deletes a live output.
  """
  def delete_live_output(input_uid, output_id) when is_binary(input_uid) and is_binary(output_id) do
    path = live_output_url(input_uid, output_id)

    case make_api_request(:delete, path) do
      {:ok, _response} -> :ok
      {:error, reason} -> handle_api_error(reason, :delete_live_output)
    end
  end

  @doc """
  Lists videos from Cloudflare Stream.

  ## Options
  - `:asc` - Boolean, lists videos in ascending order
  - `:creator` - String, filter by media creator (max 64 characters)
  - `:start` - DateTime, lists videos created after specified date
  - `:end` - DateTime, lists videos created before specified date
  - `:status` - String, filter by processing status
  - `:type` - String, filter by video type (vod/live)
  - `:video_name` - String, exact match on video name

  ## Returns
  - `{:ok, videos, total}` - List of video objects and total count
  - `{:error, reason}` - Error tuple

  Each video object has a "uid" field that can be used with delete_video/1.

  ## Example
      iex> list_videos()
      {:ok, [%{"uid" => "ea95132c...", ...}], 42}

      iex> list_videos(type: "live", asc: true)
      {:ok, [%{"uid" => "...", ...}], 5}
  """
  def list_videos(opts \\ []) do
    query_params =
      opts
      |> Enum.map(fn
        {:start, %DateTime{} = dt} -> {"start", DateTime.to_iso8601(dt)}
        {:end, %DateTime{} = dt} -> {"end", DateTime.to_iso8601(dt)}
        {key, value} -> {Atom.to_string(key), to_string(value)}
      end)
      |> URI.encode_query()

    path = if query_params == "", do: videos_url(), else: "#{videos_url()}?#{query_params}"

    case make_api_request(:get, path) do
      {:ok, response} ->
        videos = response["result"] || []
        total = response["total"] || 0
        {:ok, videos, total}

      {:error, reason} ->
        handle_api_error(reason, :list_videos)
    end
  end

  @doc """
  Deletes a video from Cloudflare Stream.

  ## Parameters
  - `video_id` - The Cloudflare-generated video identifier (max 32 characters)

  ## Returns
  - `:ok` - Video successfully deleted
  - `{:error, reason}` - Error tuple

  ## Example
      iex> delete_video("ea95132c15732412d22c1476fa83f27a")
      :ok
  """
  def delete_video(video_id) when is_binary(video_id) do
    path = video_url(video_id)

    case make_api_request(:delete, path) do
      {:ok, _response} -> :ok
      {:error, reason} -> handle_api_error(reason, :delete_video)
    end
  end

  @doc """
  Creates the display name for a live input based on environment and user ID.
  """
  def create_live_input_name(user_id) when is_binary(user_id) do
    "#{env()}##{user_id}"
  end

  defp make_api_request(method, path, payload \\ nil) do
    if is_nil(api_token()) or is_nil(account_id()) do
      {:error, :missing_credentials}
    else
      url = base_url() <> path

      headers = [
        {"Authorization", "Bearer #{api_token()}"},
        {"Content-Type", "application/json"}
      ]

      req_opts = [
        method: method,
        url: url,
        headers: headers,
        retry: false
      ]

      req_opts = if payload, do: Keyword.put(req_opts, :json, payload), else: req_opts
      make_request(req_opts)
    end
  end

  defp make_request(req_opts) do
    case Req.request(req_opts) do
      {:ok, %{status: status, body: body}} when status in 200..299 ->
        handle_success_response(body)

      {:ok, %{status: status, body: body}} ->
        Logger.error("Cloudflare API HTTP error #{status}: #{inspect(body)}")
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        Logger.error("Cloudflare API request failed: #{inspect(reason)}")
        {:error, {:request_failed, reason}}
    end
  end

  defp handle_success_response(body) when body == "" or body == nil, do: {:ok, %{}}

  defp handle_success_response(body) when is_map(body) do
    if body["success"] do
      {:ok, body}
    else
      error_msg = get_error_message(body)
      Logger.error("Cloudflare API error: #{error_msg}")
      {:error, {:api_error, error_msg}}
    end
  end

  defp handle_success_response(_body), do: {:ok, %{}}

  defp get_error_message(%{"errors" => errors}) when is_list(errors) do
    Enum.map_join(errors, ", ", fn error -> error["message"] || "Unknown error" end)
  end

  defp get_error_message(%{"errors" => error}) when is_map(error) do
    error["message"] || "Unknown error"
  end

  defp get_error_message(_), do: "Unknown error"

  defp handle_api_error(:missing_credentials, _operation) do
    {:error, :missing_credentials, "Cloudflare API credentials not configured"}
  end

  defp handle_api_error({:api_error, message}, operation) do
    {:error, :api_error, "Cloudflare API returned error for #{operation}: #{message}"}
  end

  defp handle_api_error({:http_error, status, _body}, operation) do
    {:error, :http_error, "HTTP #{status} error during #{operation}"}
  end

  defp handle_api_error({:request_failed, reason}, operation) do
    {:error, :request_failed, "Network request failed for #{operation}: #{inspect(reason)}"}
  end
end
