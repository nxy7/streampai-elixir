#!/usr/bin/env elixir

defmodule RecordingCleaner do
  @moduledoc """
  Post-processes WireMock recordings to clean them up for testing use.

  - Removes sensitive data (tokens, account IDs, secrets)
  - Parameterizes dynamic values
  - Organizes mappings by service
  - Adds helpful metadata
  """

  require Logger

  @mappings_dir "test/fixtures/wiremock/mappings"

  def run do
    Logger.info("🧹 Cleaning up recorded API mappings...")

    mappings_dir()
    |> File.ls!()
    |> Enum.filter(&String.ends_with?(&1, ".json"))
    |> Enum.each(&process_mapping_file/1)

    Logger.info("✅ Mapping cleanup completed!")
  end

  defp mappings_dir, do: @mappings_dir

  defp process_mapping_file(filename) do
    filepath = Path.join(mappings_dir(), filename)
    Logger.info("  Processing: #{filename}")

    case File.read(filepath) do
      {:ok, content} ->
        case Jason.decode(content) do
          {:ok, mapping} ->
            cleaned_mapping = clean_mapping(mapping, filename)
            save_cleaned_mapping(filepath, cleaned_mapping)

          {:error, error} ->
            Logger.warning("    ⚠️ Invalid JSON in #{filename}: #{inspect(error)}")
        end

      {:error, error} ->
        Logger.warning("    ⚠️ Cannot read #{filename}: #{inspect(error)}")
    end
  end

  defp clean_mapping(mapping, filename) do
    mapping
    |> sanitize_request()
    |> sanitize_response()
    |> add_metadata(filename)
    |> organize_by_service()
  end

  defp sanitize_request(mapping) do
    request = mapping["request"] || %{}

    # Remove sensitive headers but keep structure
    headers = request["headers"] || %{}
    sanitized_headers =
      headers
      |> Map.new(fn
        {"Authorization", _} -> {"Authorization", %{"matches" => "Bearer .*"}}
        {key, value} -> {key, value}
      end)

    # Clean up URL parameters
    url = request["url"]
    sanitized_url = if url do
      url
      |> String.replace(~r/accounts\/[a-f0-9-]+\//, "accounts/{{account_id}}/")
      |> String.replace(~r/\/[a-f0-9-]{36}/, "/{{resource_id}}")
    else
      url
    end

    cleaned_request = request
    |> Map.put("headers", sanitized_headers)
    |> Map.put("url", sanitized_url || request["url"])

    Map.put(mapping, "request", cleaned_request)
  end

  defp sanitize_response(mapping) do
    response = mapping["response"] || %{}
    body = response["body"]

    # Only process if body exists and is a string
    sanitized_body = if is_binary(body) do
      case Jason.decode(body) do
        {:ok, json_body} ->
          json_body
          |> sanitize_response_json()
          |> Jason.encode!()

        {:error, _} ->
          # Not JSON, sanitize as string
          body
          |> String.replace(~r/"uid":"[a-f0-9-]{36}"/, "\"uid\":\"{{uuid}}\"")
          |> String.replace(~r/"id":"[A-Za-z0-9_-]+"/, "\"id\":\"{{id}}\"")
      end
    else
      body
    end

    cleaned_response = response
    |> Map.put("body", sanitized_body)

    Map.put(mapping, "response", cleaned_response)
  end

  defp sanitize_response_json(json) when is_map(json) do
    json
    |> Map.new(fn
      {"uid", value} when is_binary(value) -> {"uid", "{{uuid}}"}
      {"id", value} when is_binary(value) -> {"id", "{{id}}"}
      {"etag", value} when is_binary(value) -> {"etag", "{{etag}}"}
      {"publishedAt", value} when is_binary(value) -> {"publishedAt", "{{now}}"}
      {"created", value} when is_binary(value) -> {"created", "{{now}}"}
      {"modified", value} when is_binary(value) -> {"modified", "{{now}}"}
      {"streamKey", value} when is_binary(value) -> {"streamKey", "{{randomValue length=32 type='ALPHANUMERIC'}}"}
      {"channelId", value} when is_binary(value) -> {"channelId", "{{randomValue length=24 type='ALPHANUMERIC'}}"}
      {"liveChatId", value} when is_binary(value) -> {"liveChatId", "{{randomValue length=28 type='ALPHANUMERIC'}}"}
      {key, value} when is_map(value) -> {key, sanitize_response_json(value)}
      {key, value} when is_list(value) -> {key, Enum.map(value, &sanitize_response_json/1)}
      {key, value} -> {key, value}
    end)
  end

  defp sanitize_response_json(json) when is_list(json) do
    Enum.map(json, &sanitize_response_json/1)
  end

  defp sanitize_response_json(json), do: json

  defp add_metadata(mapping, filename) do
    metadata = %{
      "wiremock" => %{
        "recorded_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "source_file" => filename,
        "cleaned" => true,
        "version" => "1.0"
      }
    }

    Map.put(mapping, "metadata", metadata)
  end

  defp organize_by_service(mapping) do
    # Determine service from URL
    url = get_in(mapping, ["request", "url"]) || ""

    service = cond do
      String.contains?(url, "cloudflare") || String.contains?(url, "accounts/") -> "cloudflare"
      String.contains?(url, "youtube") || String.contains?(url, "liveBroadcasts") -> "youtube"
      true -> "unknown"
    end

    metadata = mapping["metadata"] || %{}
    updated_metadata = Map.put(metadata, "service", service)

    Map.put(mapping, "metadata", updated_metadata)
  end

  defp save_cleaned_mapping(filepath, mapping) do
    # Format nicely for better readability
    content = Jason.encode!(mapping, pretty: true)

    case File.write(filepath, content) do
      :ok ->
        Logger.info("    ✅ Cleaned and saved")

      {:error, error} ->
        Logger.error("    ❌ Failed to save: #{inspect(error)}")
    end
  end
end

# Run the cleaner if this script is executed directly
RecordingCleaner.run()