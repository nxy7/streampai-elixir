defmodule Streampai.WireMockHelpers do
  @moduledoc """
  Helper functions for managing WireMock server in tests.

  Provides functionality to start, stop, and reset WireMock server,
  as well as utilities for setting up dynamic stubs.
  """

  require Logger

  @wiremock_admin_url "http://localhost:8080/__admin"

  def wiremock_enabled? do
    Application.get_env(:streampai, :wiremock_enabled, false)
  end

  def ensure_wiremock_running do
    if wiremock_enabled?() do
      case health_check() do
        :ok ->
          reset_all_stubs()
          :ok

        :error ->
          start_wiremock()
          wait_for_wiremock()
          reset_all_stubs()
          :ok
      end
    else
      :skipped
    end
  end

  def start_wiremock do
    Logger.info("Starting WireMock server via Docker Compose...")

    case System.cmd("docker-compose", ["-f", "docker-compose.test.yml", "up", "-d", "wiremock"],
                    stderr_to_stdout: true) do
      {output, 0} ->
        Logger.info("WireMock started successfully: #{output}")
        :ok

      {output, exit_code} ->
        Logger.error("Failed to start WireMock (exit code #{exit_code}): #{output}")
        {:error, "Failed to start WireMock"}
    end
  end

  def stop_wiremock do
    Logger.info("Stopping WireMock server...")

    case System.cmd("docker-compose", ["-f", "docker-compose.test.yml", "down"],
                    stderr_to_stdout: true) do
      {output, 0} ->
        Logger.info("WireMock stopped successfully: #{output}")
        :ok

      {output, exit_code} ->
        Logger.warning("Failed to stop WireMock (exit code #{exit_code}): #{output}")
        :ok  # Don't fail tests if cleanup fails
    end
  end

  def health_check do
    case Req.get("#{@wiremock_admin_url}/health", receive_timeout: 2000) do
      {:ok, %{status: 200}} ->
        :ok
      _ ->
        :error
    end
  end

  def wait_for_wiremock(max_attempts \\ 30) do
    wait_for_wiremock_recursive(max_attempts)
  end

  defp wait_for_wiremock_recursive(0) do
    {:error, "WireMock failed to start after maximum attempts"}
  end

  defp wait_for_wiremock_recursive(attempts_left) do
    case health_check() do
      :ok ->
        Logger.info("WireMock is ready!")
        :ok

      :error ->
        Logger.info("Waiting for WireMock... (#{attempts_left} attempts left)")
        Process.sleep(1000)
        wait_for_wiremock_recursive(attempts_left - 1)
    end
  end

  def reset_all_stubs do
    case Req.post("#{@wiremock_admin_url}/reset") do
      {:ok, %{status: 200}} ->
        Logger.debug("WireMock stubs reset successfully")
        :ok

      error ->
        Logger.warning("Failed to reset WireMock stubs: #{inspect(error)}")
        :error
    end
  end

  def add_stub(stub_definition) do
    case Req.post("#{@wiremock_admin_url}/mappings", json: stub_definition) do
      {:ok, %{status: 201}} ->
        :ok

      {:ok, response} ->
        Logger.warning("Unexpected response when adding stub: #{inspect(response)}")
        :error

      error ->
        Logger.error("Failed to add stub: #{inspect(error)}")
        :error
    end
  end

  def create_dynamic_cloudflare_input_stub(input_uid, user_id) do
    stub = %{
      "request" => %{
        "method" => "GET",
        "url" => "/accounts/test-account/stream/live_inputs/#{input_uid}"
      },
      "response" => %{
        "status" => 200,
        "headers" => %{
          "Content-Type" => "application/json"
        },
        "jsonBody" => %{
          "result" => %{
            "uid" => input_uid,
            "meta" => %{
              "user_id" => user_id,
              "name" => "test##{user_id}",
              "env" => "test"
            },
            "recording" => %{
              "mode" => "off",
              "requireSignedURLs" => false
            },
            "rtmps" => %{
              "streamKey" => "test_stream_key_#{:rand.uniform(1000)}",
              "url" => "rtmps://live.cloudflare.com:443/live/"
            },
            "status" => nil
          },
          "success" => true
        }
      }
    }

    add_stub(stub)
  end

  def create_dynamic_youtube_broadcast_stub(broadcast_id, chat_id) do
    stub = %{
      "request" => %{
        "method" => "GET",
        "urlPathPattern" => "/liveBroadcasts.*",
        "queryParameters" => %{
          "id" => %{
            "equalTo" => broadcast_id
          }
        }
      },
      "response" => %{
        "status" => 200,
        "headers" => %{
          "Content-Type" => "application/json"
        },
        "jsonBody" => %{
          "items" => [
            %{
              "id" => broadcast_id,
              "snippet" => %{
                "title" => "Test Broadcast",
                "liveChatId" => chat_id
              }
            }
          ]
        }
      }
    }

    add_stub(stub)
  end

  # Setup helpers for test environments
  def setup_wiremock_for_test(context) do
    cond do
      not wiremock_enabled?() ->
        {:ok, Map.put(context, :wiremock_enabled, false)}

      :cloudflare in Map.get(context, :tags, []) or :youtube in Map.get(context, :tags, []) ->
        case ensure_wiremock_running() do
          :ok ->
            {:ok, Map.put(context, :wiremock_enabled, true)}
          error ->
            {:error, "Failed to start WireMock: #{inspect(error)}"}
        end

      true ->
        {:ok, Map.put(context, :wiremock_enabled, false)}
    end
  end
end