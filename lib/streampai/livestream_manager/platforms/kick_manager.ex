defmodule Streampai.LivestreamManager.Platforms.KickManager do
  @moduledoc """
  Manages Kick platform integration for live streaming.
  Handles stream management, chat, and lifecycle operations.
  """
  @behaviour Streampai.LivestreamManager.Platforms.StreamPlatformManager

  use GenServer

  alias Streampai.Cloudflare.APIClient
  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.LivestreamManager.StreamEvents
  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Stream.PlatformStatus

  require Logger

  @api_base_url "https://api.kick.com/public/v1"

  defstruct [
    :user_id,
    :access_token,
    :refresh_token,
    :expires_at,
    :channel_id,
    :channel_slug,
    :livestream_id,
    :cloudflare_input_id,
    :cloudflare_output_id,
    :rtmp_url,
    :stream_key,
    :is_active,
    :started_at,
    viewer_count: 0
  ]

  def start_link(user_id, config) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @impl true
  def init({user_id, config}) do
    Logger.metadata(user_id: user_id, component: :kick_manager)

    state = %__MODULE__{
      user_id: user_id,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_at: config.expires_at,
      channel_id: config[:channel_id],
      channel_slug: config[:channel_slug],
      is_active: false,
      started_at: DateTime.utc_now()
    }

    Logger.info("Started")
    {:ok, state}
  end

  # Client API - StreamPlatformManager behaviour implementation

  @impl true
  def start_streaming(user_id, livestream_id, metadata \\ %{}) do
    GenServer.call(via_tuple(user_id), {:start_streaming, livestream_id, metadata}, 30_000)
  end

  @impl true
  def stop_streaming(user_id) when is_binary(user_id) do
    case GenServer.call(via_tuple(user_id), :stop_streaming) do
      :ok -> {:ok, %{stopped_at: DateTime.utc_now()}}
      error -> error
    end
  end

  @impl true
  def send_chat_message(user_id, message) when is_binary(user_id) and is_binary(message) do
    case GenServer.call(via_tuple(user_id), {:send_chat_message, message}, 15_000) do
      {:ok, platform_message_id} -> {:ok, platform_message_id}
      error -> error
    end
  end

  @impl true
  def update_stream_metadata(user_id, metadata) when is_binary(user_id) and is_map(metadata) do
    case GenServer.call(via_tuple(user_id), {:update_stream_metadata, metadata}) do
      :ok -> {:ok, metadata}
      error -> error
    end
  end

  @impl true
  def delete_message(_user_id, _message_id) do
    {:error, :not_supported}
  end

  @impl true
  def ban_user(user_id, target_user_id, reason \\ nil) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:ban_user, target_user_id, reason})
  end

  @impl true
  def timeout_user(user_id, target_user_id, duration_seconds, reason \\ nil)
      when is_binary(user_id) do
    GenServer.call(
      via_tuple(user_id),
      {:timeout_user, target_user_id, duration_seconds, reason}
    )
  end

  @impl true
  def unban_user(user_id, target_user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), {:unban_user, target_user_id})
  end

  @impl true
  def get_status(user_id) when is_binary(user_id) do
    GenServer.call(via_tuple(user_id), :get_status)
  end

  # Server callbacks

  @impl true
  def handle_call({:start_streaming, livestream_id}, from, state) do
    handle_call({:start_streaming, livestream_id, %{}}, from, state)
  end

  @impl true
  def handle_call({:start_streaming, livestream_id, metadata}, _from, state) do
    Logger.info("Starting stream: #{livestream_id} with metadata: #{inspect(metadata)}")
    cloudflare_input_id = metadata[:cloudflare_input_id] || metadata["cloudflare_input_id"]

    with {:get_channel, {:ok, channel_info}} <- {:get_channel, get_channel_info(state)},
         rtmp_url = "rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/",
         stream_key = generate_stream_key(),
         {:create_output, {:ok, output_id}} <-
           {:create_output, create_cloudflare_output(cloudflare_input_id, rtmp_url, stream_key)},
         {:update_metadata, :ok} <- {:update_metadata, do_update_stream_metadata(metadata, state)} do
      new_state = %{
        state
        | is_active: true,
          livestream_id: livestream_id,
          channel_id: Map.get(channel_info, "broadcaster_user_id"),
          rtmp_url: rtmp_url,
          stream_key: stream_key,
          cloudflare_input_id: cloudflare_input_id,
          cloudflare_output_id: output_id
      }

      Logger.info(
        "Stream created successfully - RTMP: #{rtmp_url}, Cloudflare Output: #{output_id}"
      )

      StreamEvents.emit_platform_started(state.user_id, livestream_id, :kick)

      StreamManager.report_platform_status(
        state.user_id,
        :kick,
        PlatformStatus.new(:live,
          started_at: DateTime.to_iso8601(DateTime.utc_now()),
          url: if(state.channel_slug, do: "https://kick.com/#{state.channel_slug}")
        )
      )

      # Store reconnection data for reattach after restart
      store_reconnection_data(new_state)

      {:reply, {:ok, %{rtmp_url: rtmp_url, stream_key: stream_key}}, new_state}
    else
      {step, {:error, reason}} ->
        Logger.error("Failed at #{step}: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:stop_streaming, _from, state) do
    Logger.info("Stopping stream")

    cleanup_cloudflare_output(state)

    if state.livestream_id do
      StreamEvents.emit_platform_stopped(state.user_id, state.livestream_id, :kick)
      StreamManager.report_platform_stopped(state.user_id, :kick)
    end

    new_state = %{
      state
      | is_active: false,
        livestream_id: nil,
        cloudflare_output_id: nil,
        rtmp_url: nil,
        stream_key: nil
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:send_chat_message, message}, from, state) do
    if state.channel_id == nil do
      {:reply, {:error, :no_active_channel}, state}
    else
      Task.start(fn ->
        result = do_send_chat_message(message, state)
        GenServer.reply(from, result)
      end)

      {:noreply, state}
    end
  end

  @impl true
  def handle_call({:update_stream_metadata, metadata}, _from, state) do
    case do_update_stream_metadata(metadata, state) do
      :ok -> {:reply, :ok, state}
      {:error, reason} -> {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    status = %{
      is_active: state.is_active,
      channel_id: state.channel_id,
      channel_slug: state.channel_slug,
      rtmp_url: state.rtmp_url,
      has_stream_key: !is_nil(state.stream_key)
    }

    {:reply, {:ok, status}, state}
  end

  @impl true
  def handle_call({:ban_user, target_user_id, reason}, _from, state) do
    do_ban_user(target_user_id, reason, state)
  end

  @impl true
  def handle_call({:timeout_user, target_user_id, duration_seconds, reason}, _from, state) do
    do_timeout_user(target_user_id, duration_seconds, reason, state)
  end

  @impl true
  def handle_call({:unban_user, target_user_id}, _from, state) do
    do_unban_user(target_user_id, state)
  end

  @impl true
  def handle_call({:reattach_streaming, livestream_id, reattach_data}, _from, state) do
    Logger.info("Reattaching to Kick stream #{livestream_id}")

    new_state = %{
      state
      | is_active: true,
        livestream_id: livestream_id,
        cloudflare_input_id: reattach_data["cloudflare_input_id"],
        cloudflare_output_id: reattach_data["cloudflare_output_id"],
        stream_key: reattach_data["stream_key"]
    }

    Logger.info("Reattached to Kick stream #{livestream_id}")
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(request, _from, state) do
    Logger.debug("Unhandled call: #{inspect(request)}")
    {:reply, :ok, state}
  end

  @impl true
  def handle_cast(request, state) do
    Logger.debug("Unhandled cast: #{inspect(request)}")
    {:noreply, state}
  end

  @impl true
  def handle_info(msg, state) do
    Logger.debug("Unknown message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("Terminating Kick manager, reason: #{inspect(reason)}")

    if state.cloudflare_output_id do
      Logger.info("Cleaning up Cloudflare output: #{state.cloudflare_output_id}")
      cleanup_cloudflare_output(state)
    end

    :ok
  end

  # ── Reattach after restart ──

  @doc """
  Reattaches to a running Kick stream after app restart.
  Restores state from stored reconnection data without creating new Cloudflare outputs.
  """
  def reattach_streaming(user_id, livestream_id, reattach_data) do
    GenServer.call(
      via_tuple(user_id),
      {:reattach_streaming, livestream_id, reattach_data},
      15_000
    )
  end

  defp store_reconnection_data(state) do
    CurrentStreamData.update_platform_data_for_user(state.user_id, :kick, %{
      "livestream_id" => state.livestream_id,
      "cloudflare_input_id" => state.cloudflare_input_id,
      "cloudflare_output_id" => state.cloudflare_output_id,
      "stream_key" => state.stream_key
    })
  end

  # Private functions

  defp get_channel_info(state) do
    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Content-Type", "application/json"}
    ]

    [
      url: "#{@api_base_url}/channels",
      headers: headers
    ]
    |> Req.get()
    |> handle_api_response()
    |> case do
      {:ok, %{"data" => [channel | _]}} -> {:ok, channel}
      {:ok, _} -> {:error, :no_channels_found}
      error -> error
    end
  end

  defp do_send_chat_message(message, state) do
    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Content-Type", "application/json"}
    ]

    body =
      Jason.encode!(%{
        broadcaster_user_id: state.channel_id,
        content: message,
        type: "bot"
      })

    [
      url: "#{@api_base_url}/chat",
      headers: headers,
      body: body
    ]
    |> Req.post()
    |> handle_api_response()
    |> case do
      {:ok, %{"data" => %{"is_sent" => true} = data}} ->
        platform_message_id = data["id"]
        Logger.info("Chat message sent: #{message}, message_id: #{inspect(platform_message_id)}")
        {:ok, platform_message_id}

      {:ok, _} ->
        Logger.error("Failed to send chat message")
        {:error, :send_failed}

      {:error, reason} ->
        Logger.error("Failed to send chat message: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp do_update_stream_metadata(_metadata, %{channel_id: nil}) do
    {:error, :no_active_channel}
  end

  defp do_update_stream_metadata(metadata, state) do
    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Content-Type", "application/json"}
    ]

    body_params =
      %{}
      |> maybe_add_field("stream_title", Map.get(metadata, :title))
      |> maybe_add_field("category_id", Map.get(metadata, :category_id))
      |> maybe_add_field("custom_tags", Map.get(metadata, :tags))

    if map_size(body_params) == 0 do
      :ok
    else
      body = Jason.encode!(body_params)

      [
        url: "#{@api_base_url}/channels",
        headers: headers,
        body: body
      ]
      |> Req.patch()
      |> case do
        {:ok, %{status: 204}} ->
          Logger.info("Stream metadata updated: #{inspect(metadata)}")
          :ok

        {:ok, %{status: status, body: error_body}} ->
          Logger.error(
            "Failed to update metadata - Status: #{status}, Body: #{inspect(error_body)}"
          )

          {:error, {:http_error, status}}

        {:error, reason} ->
          Logger.error("Failed to update metadata: #{inspect(reason)}")
          {:error, reason}
      end
    end
  end

  defp do_ban_user(target_user_id, reason, state) do
    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Content-Type", "application/json"}
    ]

    body_params = %{
      broadcaster_user_id: state.channel_id,
      user_id: target_user_id
    }

    body_params = maybe_add_field(body_params, "reason", reason)
    body = Jason.encode!(body_params)

    [
      url: "#{@api_base_url}/moderation/bans",
      headers: headers,
      body: body
    ]
    |> Req.post()
    |> case do
      {:ok, %{status: 200}} ->
        Logger.info("User banned: #{target_user_id}")
        {:reply, :ok, state}

      {:ok, %{status: status, body: error_body}} ->
        Logger.error("Failed to ban user - Status: #{status}, Body: #{inspect(error_body)}")
        {:reply, {:error, {:http_error, status}}, state}

      {:error, reason} ->
        Logger.error("Failed to ban user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_timeout_user(target_user_id, duration_seconds, reason, state) do
    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Content-Type", "application/json"}
    ]

    duration_minutes = div(duration_seconds, 60)

    body_params = %{
      broadcaster_user_id: state.channel_id,
      user_id: target_user_id,
      duration: duration_minutes
    }

    body_params = maybe_add_field(body_params, "reason", reason)
    body = Jason.encode!(body_params)

    [
      url: "#{@api_base_url}/moderation/bans",
      headers: headers,
      body: body
    ]
    |> Req.post()
    |> case do
      {:ok, %{status: 200}} ->
        Logger.info("User timed out: #{target_user_id} for #{duration_minutes} minutes")
        {:reply, :ok, state}

      {:ok, %{status: status, body: error_body}} ->
        Logger.error("Failed to timeout user - Status: #{status}, Body: #{inspect(error_body)}")
        {:reply, {:error, {:http_error, status}}, state}

      {:error, reason} ->
        Logger.error("Failed to timeout user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp do_unban_user(target_user_id, state) do
    headers = [
      {"Authorization", "Bearer #{state.access_token}"},
      {"Content-Type", "application/json"}
    ]

    params = %{
      broadcaster_user_id: state.channel_id,
      user_id: target_user_id
    }

    [
      url: "#{@api_base_url}/moderation/bans",
      headers: headers,
      params: params
    ]
    |> Req.delete()
    |> case do
      {:ok, %{status: 200}} ->
        Logger.info("User unbanned: #{target_user_id}")
        {:reply, :ok, state}

      {:ok, %{status: status, body: error_body}} ->
        Logger.error("Failed to unban user - Status: #{status}, Body: #{inspect(error_body)}")
        {:reply, {:error, {:http_error, status}}, state}

      {:error, reason} ->
        Logger.error("Failed to unban user: #{inspect(reason)}")
        {:reply, {:error, reason}, state}
    end
  end

  defp handle_api_response({:ok, %{status: status, body: body}}) when status in 200..299 do
    {:ok, body}
  end

  defp handle_api_response({:ok, %{status: status, body: body}}) do
    Logger.warning("Kick API request failed with status #{status}: #{inspect(body)}")
    {:error, {:http_error, status, body}}
  end

  defp handle_api_response({:error, reason}) do
    Logger.error("Kick API request failed: #{inspect(reason)}")
    {:error, reason}
  end

  defp maybe_add_field(map, _key, nil), do: map
  defp maybe_add_field(map, key, value), do: Map.put(map, key, value)

  defp generate_stream_key do
    32 |> :crypto.strong_rand_bytes() |> Base.encode64() |> binary_part(0, 32)
  end

  defp create_cloudflare_output(nil, _rtmp_url, _stream_key) do
    Logger.error("Cannot create Cloudflare output: no input ID")
    {:error, :no_input_id}
  end

  defp create_cloudflare_output(input_id, rtmp_url, stream_key) do
    output_config = %{rtmp_url: rtmp_url, stream_key: stream_key, enabled: true}

    case APIClient.create_live_output(input_id, output_config) do
      {:ok, %{"uid" => output_id}} ->
        Logger.info("Created Cloudflare output for kick: #{output_id}")
        {:ok, output_id}

      {:error, error_type, message} ->
        Logger.error("Failed to create Cloudflare output for kick: #{message}")
        {:error, {error_type, message}}
    end
  end

  defp cleanup_cloudflare_output(%{cloudflare_output_id: nil}), do: :ok
  defp cleanup_cloudflare_output(%{cloudflare_input_id: nil}), do: :ok

  defp cleanup_cloudflare_output(state) do
    Logger.info("Cleaning up Cloudflare output: #{state.cloudflare_output_id}")

    case APIClient.delete_live_output(state.cloudflare_input_id, state.cloudflare_output_id) do
      :ok ->
        Logger.info("Cloudflare output deleted: #{state.cloudflare_output_id}")

      {:error, _error_type, message} ->
        Logger.warning("Failed to delete Cloudflare output: #{message}")
    end
  end

  defp via_tuple(user_id) do
    RegistryHelpers.via_tuple(:platform_manager, user_id, :kick)
  end
end
