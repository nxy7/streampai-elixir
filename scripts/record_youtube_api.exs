#!/usr/bin/env elixir

defmodule YouTubeAPIRecorder do
  @moduledoc """
  Records YouTube API responses using WireMock's recording functionality.

  Prerequisites:
  - Set YOUTUBE_API_KEY or valid OAuth token
  - Start WireMock recorder: docker compose -f docker-compose.test.yml up wiremock-recorder

  Usage:
    YOUTUBE_ACCESS_TOKEN=your_token mix run scripts/record_youtube_api.exs
  """

  require Logger

  @wiremock_url "http://localhost:8080"
  @wiremock_admin_url "#{@wiremock_url}/__admin"

  def run do
    Logger.info("🎬 Starting YouTube API recording session...")

    # Check credentials
    access_token = System.get_env("YOUTUBE_ACCESS_TOKEN")

    unless access_token do
      Logger.error("❌ Missing credentials! Set YOUTUBE_ACCESS_TOKEN")
      Logger.error("Get a token from: https://developers.google.com/oauthplayground")
      Logger.error("Scopes needed: https://www.googleapis.com/auth/youtube")
      System.halt(1)
    end

    # Start recording session
    start_recording("https://www.googleapis.com", "youtube")

    # Execute API operations that we want to record
    record_youtube_operations(access_token)

    # Stop recording and save mappings
    stop_recording()

    Logger.info("✅ YouTube API recording completed! Check test/fixtures/wiremock/mappings/")
  end

  defp start_recording(target_url, recording_name) do
    recording_spec = %{
      "targetBaseUrl" => target_url,
      "captureHeaders" => %{
        "Authorization" => %{"caseInsensitive" => true},
        "Content-Type" => %{"caseInsensitive" => true},
        "Accept" => %{"caseInsensitive" => true}
      },
      "requestBodyPattern" => %{"matcher" => "equalToJson"},
      "extractBodyCriteria" => %{
        "textSizeThreshold" => 4096,
        "binarySizeThreshold" => 10240
      },
      "persist" => true,
      "repeatsAsScenarios" => false,
      "transformers" => ["response-template"],
      "transformerParameters" => %{}
    }

    case Req.post("#{@wiremock_admin_url}/recordings/start", json: recording_spec) do
      {:ok, %{status: 200}} ->
        Logger.info("📹 Recording started for #{target_url}")

      {:ok, response} ->
        Logger.error("Failed to start recording: #{inspect(response)}")
        System.halt(1)

      {:error, error} ->
        Logger.error("Failed to connect to WireMock: #{inspect(error)}")
        Logger.error("Make sure WireMock recorder is running: docker compose -f docker-compose.test.yml up wiremock-recorder")
        System.halt(1)
    end
  end

  defp record_youtube_operations(access_token) do
    Logger.info("🔄 Recording YouTube API operations...")

    client = Req.new(
      base_url: @wiremock_url,
      headers: [
        {"Authorization", "Bearer #{access_token}"},
        {"Accept", "application/json"},
        {"Content-Type", "application/json"}
      ]
    )

    # Record various operations
    operations = [
      fn -> record_list_broadcasts(client) end,
      fn -> record_create_broadcast(client) end,
      fn -> record_list_streams(client) end,
      fn -> record_create_stream(client) end,
      fn -> record_bind_stream_to_broadcast(client) end,
      fn -> record_chat_operations(client) end,
      fn -> record_cleanup_operations(client) end
    ]

    Enum.each(operations, fn operation ->
      try do
        operation.()
        Process.sleep(1500) # YouTube has stricter rate limits
      rescue
        e ->
          Logger.warning("Operation failed but continuing: #{Exception.message(e)}")
      end
    end)
  end

  defp record_list_broadcasts(client) do
    Logger.info("  📺 Recording: List live broadcasts")

    params = %{
      "part" => "snippet,status",
      "mine" => "true",
      "maxResults" => "5"
    }

    {:ok, _response} = Req.get(client, url: "/youtube/v3/liveBroadcasts", params: params)
    Logger.info("    ✓ Listed broadcasts")
  end

  defp record_create_broadcast(client) do
    Logger.info("  📺 Recording: Create live broadcast")

    broadcast_data = %{
      "snippet" => %{
        "title" => "WireMock Recording Test Broadcast",
        "description" => "Test broadcast for API recording",
        "scheduledStartTime" => DateTime.utc_now() |> DateTime.add(3600) |> DateTime.to_iso8601()
      },
      "status" => %{
        "privacyStatus" => "unlisted"
      }
    }

    params = %{"part" => "snippet,status"}

    {:ok, response} = Req.post(client, url: "/youtube/v3/liveBroadcasts", params: params, json: broadcast_data)

    broadcast_id = get_in(response.body, ["id"])
    Process.put(:recorded_broadcast_id, broadcast_id)

    Logger.info("    ✓ Created broadcast: #{broadcast_id}")
  end

  defp record_list_streams(client) do
    Logger.info("  📡 Recording: List live streams")

    params = %{
      "part" => "snippet,cdn,status",
      "mine" => "true",
      "maxResults" => "5"
    }

    {:ok, _response} = Req.get(client, url: "/youtube/v3/liveStreams", params: params)
    Logger.info("    ✓ Listed streams")
  end

  defp record_create_stream(client) do
    Logger.info("  📡 Recording: Create live stream")

    stream_data = %{
      "snippet" => %{
        "title" => "WireMock Recording Test Stream",
        "description" => "Test stream for API recording"
      },
      "cdn" => %{
        "format" => "1080p",
        "ingestionType" => "rtmp"
      }
    }

    params = %{"part" => "snippet,cdn,status"}

    {:ok, response} = Req.post(client, url: "/youtube/v3/liveStreams", params: params, json: stream_data)

    stream_id = get_in(response.body, ["id"])
    Process.put(:recorded_stream_id, stream_id)

    Logger.info("    ✓ Created stream: #{stream_id}")
  end

  defp record_bind_stream_to_broadcast(client) do
    broadcast_id = Process.get(:recorded_broadcast_id)
    stream_id = Process.get(:recorded_stream_id)
    return unless broadcast_id && stream_id

    Logger.info("  🔗 Recording: Bind stream to broadcast")

    params = %{
      "part" => "snippet,status",
      "id" => broadcast_id,
      "streamId" => stream_id
    }

    {:ok, _response} = Req.post(client, url: "/youtube/v3/liveBroadcasts/bind", params: params)
    Logger.info("    ✓ Bound stream #{stream_id} to broadcast #{broadcast_id}")
  end

  defp record_chat_operations(client) do
    broadcast_id = Process.get(:recorded_broadcast_id)
    return unless broadcast_id

    Logger.info("  💬 Recording: Chat operations")

    # First get the broadcast to find liveChatId
    params = %{"part" => "snippet", "id" => broadcast_id}

    case Req.get(client, url: "/youtube/v3/liveBroadcasts", params: params) do
      {:ok, %{body: %{"items" => [broadcast | _]}}} ->
        live_chat_id = get_in(broadcast, ["snippet", "liveChatId"])

        if live_chat_id do
          # Record inserting a chat message
          chat_message = %{
            "snippet" => %{
              "liveChatId" => live_chat_id,
              "type" => "textMessageEvent",
              "textMessageDetails" => %{
                "messageText" => "Hello from WireMock recording!"
              }
            }
          }

          chat_params = %{"part" => "snippet"}
          {:ok, _response} = Req.post(client, url: "/youtube/v3/liveChat/messages", params: chat_params, json: chat_message)
          Logger.info("    ✓ Recorded chat message")
        end

      _ ->
        Logger.warning("    ⚠️ Could not get liveChatId for chat operations")
    end
  end

  defp record_cleanup_operations(client) do
    Logger.info("  🧹 Recording: Cleanup operations")

    stream_id = Process.get(:recorded_stream_id)
    broadcast_id = Process.get(:recorded_broadcast_id)

    # Delete stream first
    if stream_id do
      try do
        {:ok, _response} = Req.delete(client, url: "/youtube/v3/liveStreams", params: %{"id" => stream_id})
        Logger.info("    ✓ Deleted stream: #{stream_id}")
      rescue
        _ -> Logger.warning("    ⚠️ Could not delete stream #{stream_id}")
      end
    end

    # Delete broadcast
    if broadcast_id do
      try do
        {:ok, _response} = Req.delete(client, url: "/youtube/v3/liveBroadcasts", params: %{"id" => broadcast_id})
        Logger.info("    ✓ Deleted broadcast: #{broadcast_id}")
      rescue
        _ -> Logger.warning("    ⚠️ Could not delete broadcast #{broadcast_id}")
      end
    end
  end

  defp stop_recording do
    Logger.info("⏹️ Stopping recording session...")

    case Req.post("#{@wiremock_admin_url}/recordings/stop") do
      {:ok, %{status: 200, body: body}} ->
        mappings_count = length(body["mappings"] || [])
        Logger.info("✅ Recording stopped. Generated #{mappings_count} mappings.")

      {:ok, response} ->
        Logger.error("Failed to stop recording: #{inspect(response)}")

      {:error, error} ->
        Logger.error("Failed to stop recording: #{inspect(error)}")
    end
  end

  defp return, do: :ok
end

# Run the recording if this script is executed directly
YouTubeAPIRecorder.run()