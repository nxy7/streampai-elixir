defmodule Streampai.Cloudflare.APIClient do
  @moduledoc """
  Stateless Cloudflare API client for livestream system.
  Handles all Cloudflare API requests.
  """
  require Logger

  # URL builders for live inputs and outputs
  defp live_input_url(), do: "/accounts/#{account_id()}/stream/live_inputs"

  defp live_input_url(input_id) when is_binary(input_id),
    do: "/accounts/#{account_id()}/stream/live_inputs/#{input_id}"

  defp live_output_url(input_id) when is_binary(input_id),
    do: "/accounts/#{account_id()}/stream/live_inputs/#{input_id}/outputs"

  defp live_output_url(input_id, output_id) when is_binary(input_id) and is_binary(output_id),
    do: "/accounts/#{account_id()}/stream/live_inputs/#{input_id}/outputs/#{output_id}"

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
      "recording" => Map.merge(%{"mode" => "off"}, opts[:recording] || %{})
    }

    path = live_input_url()

    case make_api_request(:post, path, payload) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Gets a live input by ID.
  """
  def get_live_input(input_id) when is_binary(input_id) do
    path = live_input_url(input_id)

    case make_api_request(:get, path) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Deletes a live input.
  """
  def delete_live_input(input_id) when is_binary(input_id) do
    path = live_input_url(input_id)

    case make_api_request(:delete, path) do
      {:ok, _response} -> :ok
      {:error, reason} -> {:error, reason}
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
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Gets a live output by ID.
  """
  def get_live_output(input_uid, output_id) when is_binary(input_uid) and is_binary(output_id) do
    path = live_output_url(input_uid, output_id)

    case make_api_request(:get, path) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Lists all live outputs for a given input.
  """
  def list_live_outputs(input_uid) when is_binary(input_uid) do
    path = live_output_url(input_uid)

    case make_api_request(:get, path) do
      {:ok, response} -> {:ok, response["result"]}
      {:error, reason} -> {:error, reason}
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
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Deletes a live output.
  """
  def delete_live_output(input_uid, output_id)
      when is_binary(input_uid) and is_binary(output_id) do
    path = live_output_url(input_uid, output_id)

    case make_api_request(:delete, path) do
      {:ok, _response} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Creates the display name for a live input based on environment and user ID.
  """
  def create_live_input_name(user_id) do
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
        if body["success"] do
          {:ok, body}
        else
          error_msg = get_error_message(body)
          Logger.error("Cloudflare API error: #{error_msg}")
          {:error, {:api_error, error_msg}}
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
