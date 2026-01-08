defmodule Streampai.LivestreamManager.StreamManager.Cloudflare.InputManager do
  @moduledoc """
  Manages Cloudflare live inputs (RTMP/SRT/WebRTC ingest points).

  Handles input creation, status polling, and input deletion/recreation.
  Status transitions are handled by the gen_statem state functions in StreamManager.
  """

  alias Streampai.Cloudflare.APIClient
  alias Streampai.Cloudflare.LiveInput

  require Logger

  # -- Input Creation --

  def get_live_inputs(data) do
    with {:ok, horizontal} <- fetch_input_for_orientation(data, :horizontal),
         {:ok, vertical} <- fetch_input_for_orientation(data, :vertical) do
      {:ok, %{horizontal: horizontal, vertical: vertical}}
    end
  rescue
    error ->
      Logger.error("Exception during live input creation: #{inspect(error)}")
      {:error, error}
  end

  def fetch_input_for_orientation(data, orientation) do
    case LiveInput.get_or_fetch_for_user_with_test_mode(data.user_id, orientation, actor: %{id: data.user_id}) do
      {:ok, live_input} ->
        case live_input.data do
          %{
            "uid" => input_id,
            "rtmps" => %{"url" => rtmp_url, "streamKey" => stream_key},
            "srt" => %{"url" => srt_url},
            "webRTC" => %{"url" => webrtc_url}
          } ->
            {:ok,
             %{
               input_id: input_id,
               orientation: orientation,
               rtmp_url: rtmp_url,
               rtmp_playback_url: rtmp_url,
               srt_url: srt_url,
               webrtc_url: webrtc_url,
               stream_key: stream_key
             }}

          invalid_data ->
            Logger.error("Invalid #{orientation} live input data: #{inspect(invalid_data)}")
            {:error, "Invalid #{orientation} live input data structure"}
        end

      {:error, reason} ->
        Logger.error("Failed to get/fetch #{orientation} live input: #{inspect(reason)}")
        {:error, reason}
    end
  end

  # -- Status Polling --

  def check_streaming_status(data) do
    horizontal_status = check_single_input_status(data.horizontal_input)
    vertical_status = check_single_input_status(data.vertical_input)

    case {horizontal_status, vertical_status} do
      {{:ok, :live}, _} -> {:ok, :live}
      {_, {:ok, :live}} -> {:ok, :live}
      {{:error, :input_deleted}, _} -> {:error, :input_deleted}
      {_, {:error, :input_deleted}} -> {:error, :input_deleted}
      {{:error, reason}, _} -> {:error, reason}
      {_, {:error, reason}} -> {:error, reason}
      _ -> {:ok, :offline}
    end
  end

  defp check_single_input_status(nil), do: {:ok, :offline}
  defp check_single_input_status(%{input_id: nil}), do: {:ok, :offline}

  defp check_single_input_status(%{input_id: input_id}) when is_binary(input_id) do
    case APIClient.get_live_input(input_id) do
      {:ok, input_data} ->
        streaming_status = extract_streaming_status(input_data)
        {:ok, if(streaming_status, do: :live, else: :offline)}

      {:error, :http_error, "HTTP 404 error during get_live_input"} ->
        Logger.warning("Live input #{input_id} not found (404)")
        {:error, :input_deleted}

      {:error, _error_type, message} ->
        Logger.warning("Failed to check input status: #{inspect(message)}")
        {:error, message}
    end
  end

  defp check_single_input_status(_), do: {:ok, :offline}

  defp extract_streaming_status(%{"status" => %{"current" => %{"state" => s}}}) do
    s in ["connected", "live"]
  end

  defp extract_streaming_status(_), do: false

  # -- Input Deletion --

  def handle_deletion(data) do
    for orientation <- [:horizontal, :vertical] do
      delete_stale_live_input_record(data.user_id, orientation)
    end

    data = %{
      data
      | horizontal_input: nil,
        vertical_input: nil,
        live_outputs: %{}
    }

    send(self(), :retry_initialize)
    data
  end

  defp delete_stale_live_input_record(user_id, orientation) do
    import Ash.Query

    query = filter(LiveInput, user_id == ^user_id and orientation == ^orientation)

    case Ash.read_one(query, actor: %{id: user_id}) do
      {:ok, live_input} when not is_nil(live_input) ->
        case Ash.destroy(live_input, actor: %{id: user_id}) do
          :ok -> Logger.info("Deleted stale #{orientation} live input record")
          {:error, reason} -> Logger.warning("Failed to delete stale record: #{inspect(reason)}")
        end

      _ ->
        :ok
    end
  end

  # -- Helpers --

  def get_input_id(%{horizontal_input: %{input_id: id}}) when is_binary(id), do: id
  def get_input_id(%{input_id: id}) when is_binary(id), do: id
  def get_input_id(nil), do: nil
  def get_input_id(_), do: nil

  def get_primary_input(data), do: data.horizontal_input

  def get_horizontal_stream_key(data), do: data.horizontal_input && data.horizontal_input.stream_key

  def get_vertical_stream_key(data), do: data.vertical_input && data.vertical_input.stream_key

  def build_stream_config(data, state_name) do
    input_streaming = state_name in [:ready, :streaming, :disconnected]

    %{
      horizontal_input: data.horizontal_input,
      vertical_input: data.vertical_input,
      live_outputs: data.live_outputs,
      stream_status: state_to_stream_status(state_name),
      input_streaming_status: if(input_streaming, do: :live, else: :offline),
      rtmp_url: "rtmps://live.streampai.com:443/live/",
      horizontal_stream_key: get_horizontal_stream_key(data),
      vertical_stream_key: get_vertical_stream_key(data),
      can_start_streaming: state_name == :ready
    }
  end

  defp state_to_stream_status(:initializing), do: :inactive
  defp state_to_stream_status(:offline), do: :inactive
  defp state_to_stream_status(:ready), do: :ready
  defp state_to_stream_status(:streaming), do: :streaming
  defp state_to_stream_status(:disconnected), do: :streaming
  defp state_to_stream_status(:stopping), do: :inactive
  defp state_to_stream_status(:error), do: :error
end
