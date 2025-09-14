#!/usr/bin/env elixir

defmodule CloudflareAPIRecorder do
  @moduledoc """
  Records Cloudflare API responses using WireMock's recording functionality.

  Prerequisites:
  - Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables
  - Start WireMock recorder: docker compose -f docker-compose.test.yml up wiremock-recorder

  Usage:
    mix run scripts/record_cloudflare_api.exs
  """

  require Logger

  @wiremock_url "http://localhost:8080"
  @wiremock_admin_url "#{@wiremock_url}/__admin"

  def run do
    Logger.info("🎬 Starting Cloudflare API recording session...")

    # Check credentials
    api_token = System.get_env("CLOUDFLARE_API_TOKEN")
    account_id = System.get_env("CLOUDFLARE_ACCOUNT_ID")

    unless api_token && account_id do
      Logger.error("❌ Missing credentials! Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID")
      System.halt(1)
    end

    # Start recording session
    start_recording("https://api.cloudflare.com", "cloudflare")

    # Execute API operations that we want to record
    record_cloudflare_operations(api_token, account_id)

    # Stop recording and save mappings
    stop_recording()

    Logger.info("✅ Cloudflare API recording completed! Check test/fixtures/wiremock/mappings/")
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
        "textSizeThreshold" => 2048,
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

  defp record_cloudflare_operations(api_token, account_id) do
    Logger.info("🔄 Recording Cloudflare API operations...")

    client = Req.new(
      base_url: @wiremock_url,
      headers: [
        {"Authorization", "Bearer #{api_token}"},
        {"Content-Type", "application/json"}
      ]
    )

    # Record various operations
    operations = [
      fn -> record_create_live_input(client, account_id) end,
      fn -> record_get_live_input(client, account_id) end,
      fn -> record_create_live_output(client, account_id) end,
      fn -> record_list_live_outputs(client, account_id) end,
      fn -> record_toggle_live_output(client, account_id) end,
      fn -> record_delete_operations(client, account_id) end,
      fn -> record_error_scenarios(client, account_id) end
    ]

    Enum.each(operations, fn operation ->
      try do
        operation.()
        Process.sleep(1000) # Allow time between operations
      rescue
        e ->
          Logger.warning("Operation failed but continuing: #{Exception.message(e)}")
      end
    end)
  end

  defp record_create_live_input(client, account_id) do
    Logger.info("  📝 Recording: Create live input")

    payload = %{
      "meta" => %{
        "user_id" => "recording-user-#{:rand.uniform(1000)}",
        "name" => "recording-session-input",
        "env" => "test"
      },
      "recording" => %{"mode" => "off"}
    }

    {:ok, response} = Req.post(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs", json: payload)

    # Store the created input ID for later operations
    input_id = get_in(response.body, ["result", "uid"])
    Process.put(:recorded_input_id, input_id)

    Logger.info("    ✓ Created input: #{input_id}")
  end

  defp record_get_live_input(client, account_id) do
    input_id = Process.get(:recorded_input_id)
    return unless input_id

    Logger.info("  📖 Recording: Get live input")
    {:ok, _response} = Req.get(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/#{input_id}")
    Logger.info("    ✓ Retrieved input: #{input_id}")
  end

  defp record_create_live_output(client, account_id) do
    input_id = Process.get(:recorded_input_id)
    return unless input_id

    Logger.info("  📤 Recording: Create live output")

    payload = %{
      "url" => "rtmp://live.twitch.tv/live",
      "streamKey" => "recording_stream_key_#{:rand.uniform(1000)}",
      "enabled" => true
    }

    {:ok, response} = Req.post(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/#{input_id}/outputs", json: payload)

    output_id = get_in(response.body, ["result", "uid"])
    Process.put(:recorded_output_id, output_id)

    Logger.info("    ✓ Created output: #{output_id}")
  end

  defp record_list_live_outputs(client, account_id) do
    input_id = Process.get(:recorded_input_id)
    return unless input_id

    Logger.info("  📋 Recording: List live outputs")
    {:ok, _response} = Req.get(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/#{input_id}/outputs")
    Logger.info("    ✓ Listed outputs for input: #{input_id}")
  end

  defp record_toggle_live_output(client, account_id) do
    input_id = Process.get(:recorded_input_id)
    output_id = Process.get(:recorded_output_id)
    return unless input_id && output_id

    Logger.info("  🔄 Recording: Toggle live output")

    payload = %{"enabled" => false}
    {:ok, _response} = Req.put(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/#{input_id}/outputs/#{output_id}", json: payload)
    Logger.info("    ✓ Toggled output: #{output_id}")
  end

  defp record_delete_operations(client, account_id) do
    input_id = Process.get(:recorded_input_id)
    output_id = Process.get(:recorded_output_id)

    if output_id do
      Logger.info("  🗑️ Recording: Delete live output")
      {:ok, _response} = Req.delete(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/#{input_id}/outputs/#{output_id}")
      Logger.info("    ✓ Deleted output: #{output_id}")
    end

    if input_id do
      Logger.info("  🗑️ Recording: Delete live input")
      {:ok, _response} = Req.delete(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/#{input_id}")
      Logger.info("    ✓ Deleted input: #{input_id}")
    end
  end

  defp record_error_scenarios(client, account_id) do
    Logger.info("  ❌ Recording: Error scenarios")

    # Try to get non-existent input
    try do
      Req.get(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/invalid-input-id")
      Logger.info("    ✓ Recorded 404 error")
    rescue
      _ -> :ok
    end

    # Try to get output for non-existent input
    try do
      Req.get(client, url: "/client/v4/accounts/#{account_id}/stream/live_inputs/invalid-input-id/outputs/invalid-output-id")
      Logger.info("    ✓ Recorded output error")
    rescue
      _ -> :ok
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
CloudflareAPIRecorder.run()