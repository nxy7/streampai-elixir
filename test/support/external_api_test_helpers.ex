defmodule Streampai.ExternalAPITestHelpers do
  @moduledoc """
  Specialized helpers for testing external API integrations.
  Implements the external API testing patterns documented in CLAUDE.md
  with proper error handling, response validation, and credential management.
  """

  import ExUnit.Assertions

  @doc """
  Standard setup for external API integration tests.
  Handles credential checking and test skipping when credentials are unavailable.

  ## Usage

      setup do
        setup_external_api_test([
          env_vars: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
          service: "Cloudflare API",
          tags: [:integration, :cloudflare]
        ])
      end
  """
  def setup_external_api_test(opts) do
    env_vars = Keyword.get(opts, :env_vars, [])
    _service = Keyword.get(opts, :service, "External API")
    tags = Keyword.get(opts, :tags, [:integration])

    missing_vars = Enum.filter(env_vars, &(System.get_env(&1) in [nil, ""]))

    if missing_vars == [] do
      :ok
    else
      # Return :ok and let individual tests handle skipping
      ExUnit.configure(exclude: tags)
      :ok
    end
  end

  @doc """
  Pattern for testing external API responses using the documented approach.
  Uses pattern matching with pinned variables for known values and wildcards
  for dynamic values (IDs, timestamps, secrets).

  ## Example

      assert_external_api_response(response, %{
        "id" => pin_known_value(expected_id),
        "created" => wildcard(:timestamp),
        "status" => "active",
        "secret_key" => wildcard(:secret)
      })
  """
  def assert_external_api_response({:ok, actual_response}, expected_pattern) do
    # Convert our pattern DSL to actual pattern matching
    processed_pattern = process_response_pattern(expected_pattern, actual_response)

    try do
      # Use auto_assert for snapshot-style testing if available
      if function_exported?(ExUnit.Assertions, :auto_assert, 1) do
        # This would work with Mneme
        assert ^actual_response = processed_pattern
      else
        # Fallback to manual pattern matching
        validate_response_structure(actual_response, expected_pattern)
      end

      actual_response
    rescue
      e in ExUnit.AssertionError ->
        provide_helpful_api_error(actual_response, expected_pattern, e)
    end
  end

  def assert_external_api_response({:error, reason}, :error) do
    reason
  end

  def assert_external_api_response({:error, reason}, _expected) do
    flunk("Expected successful API response, got error: #{inspect(reason)}")
  end

  @doc """
  Helper for testing API error responses with expected HTTP status codes.
  """
  def assert_api_error({:error, {:http_error, status, body}}, expected_status) do
    assert status == expected_status,
           "Expected HTTP #{expected_status}, got HTTP #{status}"

    body
  end

  def assert_api_error({:error, {:http_error, status, body}}, expected_status, _expected_operation) do
    assert status == expected_status

    # Validate error body structure for common API patterns
    case body do
      %{"errors" => errors} when is_list(errors) ->
        # Standard API error format
        body

      %{"error" => _error_msg} ->
        # Simple error format
        body

      error_string when is_binary(error_string) ->
        # Plain string error
        body

      _ ->
        # Unexpected error format - might indicate API changes
        flunk("Unexpected error response format: #{inspect(body)}")
    end
  end

  @doc """
  Helper for creating test resources that need cleanup.
  Ensures external resources are properly cleaned up even if tests fail.
  """
  def with_external_resource(create_fun, cleanup_fun, test_fun) do
    resource = create_fun.()

    try do
      test_fun.(resource)
    after
      try do
        cleanup_fun.(resource)
      rescue
        e ->
          # Log cleanup failures but don't fail the test
          IO.warn("Failed to cleanup external resource: #{inspect(e)}")
      end
    end
  end

  @doc """
  Pattern for testing API rate limiting and retry behavior.
  """
  def assert_rate_limit_handling(api_fun, expected_rate_limit) do
    # Make rapid requests to trigger rate limiting
    results =
      Enum.map(1..expected_rate_limit, fn _ -> api_fun.() end)

    # Check that some requests succeed and some are rate limited
    successes = Enum.count(results, &match?({:ok, _}, &1))
    rate_limited = Enum.count(results, &match?({:error, {:http_error, 429, _}}, &1))

    assert successes > 0, "Expected some requests to succeed"
    assert rate_limited > 0, "Expected some requests to be rate limited"

    {successes, rate_limited}
  end

  @doc """
  Helper for testing API pagination patterns.
  """
  def assert_paginated_response(response, opts \\ []) do
    expected_page_size = Keyword.get(opts, :page_size, 50)
    has_next_page = Keyword.get(opts, :has_next_page, false)

    case response do
      {:ok, %{"data" => data, "pagination" => pagination}} ->
        assert is_list(data)
        assert length(data) <= expected_page_size

        if has_next_page do
          assert Map.has_key?(pagination, "next_cursor") or
                   Map.has_key?(pagination, "next_page")
        end

        {data, pagination}

      {:ok, data} when is_list(data) ->
        # Simple list response without pagination metadata
        assert length(data) <= expected_page_size
        data

      other ->
        flunk("Expected paginated response, got: #{inspect(other)}")
    end
  end

  @doc """
  Helper for testing webhook signature validation.
  """
  def validate_webhook_signature(payload, signature, secret, algorithm \\ :sha256) do
    expected_signature =
      :hmac
      |> :crypto.mac(algorithm, secret, payload)
      |> Base.encode16(case: :lower)

    # Compare signatures securely
    case signature do
      ^expected_signature -> :ok
      _ -> {:error, :invalid_signature}
    end
  end

  # Private helper functions

  defp process_response_pattern(pattern, actual_response) when is_map(pattern) do
    Map.new(pattern, fn
      {key, {:pin, value}} ->
        {key, value}

      {key, {:wildcard, _type}} ->
        {key, Map.get(actual_response, key)}

      {key, value} when is_map(value) ->
        {key, process_response_pattern(value, Map.get(actual_response, key, %{}))}

      {key, value} ->
        {key, value}
    end)
  end

  defp process_response_pattern(pattern, _actual), do: pattern

  defp validate_response_structure(actual, expected) when is_map(expected) do
    Enum.each(expected, fn
      {key, {:pin, expected_value}} ->
        actual_value = Map.get(actual, key)

        assert actual_value == expected_value,
               "Expected #{key} to be #{inspect(expected_value)}, got #{inspect(actual_value)}"

      {key, {:wildcard, type}} ->
        actual_value = Map.get(actual, key)
        validate_wildcard_type(actual_value, type, key)

      {key, expected_value} when is_map(expected_value) ->
        actual_value = Map.get(actual, key, %{})
        validate_response_structure(actual_value, expected_value)

      {key, expected_value} ->
        actual_value = Map.get(actual, key)

        assert actual_value == expected_value,
               "Expected #{key} to be #{inspect(expected_value)}, got #{inspect(actual_value)}"
    end)
  end

  defp validate_wildcard_type(value, type, key) do
    case type do
      :timestamp -> validate_timestamp(value, key)
      :uuid -> validate_uuid(value, key)
      :secret -> validate_secret(value, key)
      :url -> validate_url(value, key)
      :any -> :ok
      _ -> validate_not_nil(value, key)
    end
  end

  defp validate_timestamp(value, key) do
    assert is_binary(value) and String.match?(value, ~r/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
           "Expected #{key} to be a timestamp, got #{inspect(value)}"
  end

  defp validate_uuid(value, key) do
    # Accept both full UUIDs and shorter hex identifiers (like Cloudflare IDs)
    valid_uuid = String.match?(value, ~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    valid_hex = String.match?(value, ~r/^[0-9a-f]{24,}$/)

    assert is_binary(value) and (valid_uuid or valid_hex),
           "Expected #{key} to be a UUID or hex identifier, got #{inspect(value)}"
  end

  defp validate_secret(value, key) do
    assert is_binary(value) and String.length(value) > 10,
           "Expected #{key} to be a secret string, got #{inspect(value)}"
  end

  defp validate_url(value, key) do
    assert is_binary(value) and String.match?(value, ~r/^https?:\/\//),
           "Expected #{key} to be a URL, got #{inspect(value)}"
  end

  defp validate_not_nil(value, key) do
    assert not is_nil(value), "Expected #{key} to have a value, got nil"
  end

  defp provide_helpful_api_error(actual, expected, original_error) do
    error_details = """

    API Response Structure Mismatch:

    Expected Pattern:
    #{inspect(expected, pretty: true)}

    Actual Response:
    #{inspect(actual, pretty: true)}

    Original Error:
    #{Exception.message(original_error)}

    This could indicate:
    1. API contract changes (check API documentation)
    2. Test expectations need updating
    3. Authentication or configuration issues
    """

    flunk(error_details)
  end

  @doc """
  DSL helpers for building response patterns
  """
  def pin_known_value(value), do: {:pin, value}
  def wildcard(type \\ :any), do: {:wildcard, type}
end
