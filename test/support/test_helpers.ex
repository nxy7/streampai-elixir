defmodule Streampai.TestHelpers do
  @moduledoc """
  Comprehensive test helpers module providing common patterns and utilities
  for all test files. Consolidates frequently used testing patterns to reduce
  duplication and improve consistency across the test suite.
  """

  import ExUnit.Assertions

  @doc """
  Helper for creating unique test identifiers with random suffixes.
  Useful for avoiding conflicts in external API tests and database records.

  ## Examples

      test_id("user") => "user-123"
      test_id("delete-test") => "delete-test-456"
  """
  def test_id(prefix) do
    "#{prefix}-#{:rand.uniform(10_000)}"
  end

  @doc """
  Helper for generating unique email addresses for testing.
  """
  def test_email(prefix \\ "test") do
    "#{prefix}#{System.unique_integer([:positive])}@example.com"
  end

  @doc """
  Common pattern for external API test setup with conditional skipping.
  Returns a function that can be used in test setup to skip tests when
  credentials are not available.

  ## Example

      setup do
        skip_if_no_credentials(["CLOUDFLARE_API_TOKEN"], "Cloudflare API credentials")
      end
  """
  def skip_if_no_credentials(env_vars, service_name) do
    missing_vars = Enum.filter(env_vars, &(System.get_env(&1) in [nil, ""]))

    if missing_vars == [] do
      :ok
    else
      ExUnit.configure(exclude: [integration: true])
      {:skip, "#{service_name} credentials not available: #{Enum.join(missing_vars, ", ")}"}
    end
  end

  @doc """
  Pattern for extracting and asserting on HTML content snippets.
  Useful for testing multiple content assertions in a structured way.

  ## Example

      content_assertions = %{
        has_welcome: html =~ "Welcome",
        shows_email: html =~ user.email
      }
      assert_content_snippets(content_assertions, %{has_welcome: true, shows_email: true})
  """
  def assert_content_snippets(actual_snippets, expected_snippets) do
    Enum.each(expected_snippets, fn {key, expected_value} ->
      actual_value = Map.get(actual_snippets, key)

      assert actual_value == expected_value,
             "Expected #{key} to be #{expected_value}, got #{actual_value}"
    end)

    actual_snippets
  end

  @doc """
  Helper for testing Ash resource queries with consistent error handling.
  """
  def assert_ash_query(query, expected_count) when is_integer(expected_count) do
    case Ash.read(query) do
      {:ok, results} when is_list(results) ->
        assert length(results) == expected_count
        results

      {:error, error} ->
        flunk("Ash query failed: #{inspect(error)}")
    end
  end

  def assert_ash_query(query, :single) do
    case Ash.read(query) do
      {:ok, [result]} -> result
      {:ok, []} -> flunk("Expected single result, got empty list")
      {:ok, results} -> flunk("Expected single result, got #{length(results)} results")
      {:error, error} -> flunk("Ash query failed: #{inspect(error)}")
    end
  end

  @doc """
  Pattern for testing external API responses with proper error handling.
  Validates response structure and provides clear failure messages.
  """
  def assert_api_response({:ok, response}, pattern) when is_map(pattern) do
    case response do
      ^pattern ->
        response

      _ ->
        # Use pattern matching for better error messages
        try do
          assert ^pattern = response
        rescue
          ExUnit.AssertionError ->
            flunk("API response structure mismatch:\nExpected: #{inspect(pattern)}\nActual: #{inspect(response)}")
        end
    end
  end

  def assert_api_response({:error, reason}, :error) do
    reason
  end

  def assert_api_response({:error, reason}, _expected) do
    flunk("Expected successful API response, got error: #{inspect(reason)}")
  end

  def assert_api_response(actual, expected) do
    flunk("Unexpected API response format - Expected: #{inspect(expected)}, Got: #{inspect(actual)}")
  end

  @doc """
  Helper for testing HTTP error responses with consistent error message patterns.
  """
  def assert_http_error(response, expected_status, expected_operation \\ nil) do
    case response do
      {:error, :http_error, message} ->
        assert message =~ "HTTP #{expected_status} error"

        if expected_operation do
          assert message =~ "HTTP #{expected_status} error during #{expected_operation}"
        end

        message

      actual ->
        flunk("Expected HTTP error, got: #{inspect(actual)}")
    end
  end

  @doc """
  Pattern for testing LiveView form submissions with validation.
  """
  def submit_form_and_assert(view, form_selector, params, expected_content) do
    view
    |> Phoenix.LiveViewTest.form(form_selector, params)
    |> Phoenix.LiveViewTest.render_submit()

    html = Phoenix.LiveViewTest.render(view)

    case expected_content do
      content when is_binary(content) ->
        assert html =~ content

      patterns when is_list(patterns) ->
        Enum.each(patterns, fn pattern ->
          assert html =~ pattern
        end)
    end

    html
  end

  @doc """
  Helper for creating test data with factory-like behavior.
  Provides consistent defaults while allowing customization.
  """
  def factory(type, attrs \\ %{})

  def factory(:user, attrs) do
    base_attrs = %{
      email: test_email(),
      password: "password123",
      password_confirmation: "password123",
      confirmed: true
    }

    Map.merge(base_attrs, attrs)
  end

  def factory(:newsletter_email, attrs) do
    base_attrs = %{
      email: test_email("newsletter")
    }

    Map.merge(base_attrs, attrs)
  end

  def factory(:widget_config, attrs) do
    base_attrs = %{
      type: :chat_widget,
      config: %{
        max_messages: 50,
        show_badges: true,
        show_emotes: true
      }
    }

    Map.merge(base_attrs, attrs)
  end

  @doc """
  Pattern for testing real-time LiveView updates with PubSub.
  """
  def assert_broadcast_received(topic, event, timeout \\ 1000) do
    receive do
      %Phoenix.Socket.Broadcast{topic: ^topic, event: ^event, payload: payload} ->
        payload
    after
      timeout ->
        flunk("Expected broadcast on topic #{topic} with event #{event} within #{timeout}ms")
    end
  end

  @doc """
  Helper for testing file operations in tests safely.
  """
  def with_temp_file(content, fun) do
    path = "/tmp/test_file_#{System.unique_integer([:positive])}"
    File.write!(path, content)

    try do
      fun.(path)
    after
      File.rm(path)
    end
  end

  @doc """
  Pattern for mocking external services consistently.
  """
  defmacro mock_external_service(service_module, function_name, return_value) do
    quote do
      test_pid = self()

      :meck.new(unquote(service_module), [:passthrough])

      :meck.expect(unquote(service_module), unquote(function_name), fn _args ->
        send(test_pid, {:mock_called, unquote(function_name)})
        unquote(return_value)
      end)

      on_exit(fn -> :meck.unload(unquote(service_module)) end)
    end
  end

  @doc """
  Helper for testing background job execution.
  """
  def assert_job_performed(job_module, args, timeout \\ 5000) do
    # This would integrate with whatever job system is being used
    # For now, this is a placeholder for the pattern
    receive do
      {:job_performed, ^job_module, ^args} -> :ok
    after
      timeout ->
        flunk("Expected #{job_module} job to be performed with args #{inspect(args)} within #{timeout}ms")
    end
  end

  @doc """
  Helper for database transaction testing.
  """
  def within_transaction(fun) do
    Ecto.Multi.new()
    |> Ecto.Multi.run(:test_operation, fn _repo, _changes -> fun.() end)
    |> Streampai.Repo.transaction()
  end

  @doc """
  Pattern for testing configuration changes.
  """
  def with_config(app, key, value, fun) do
    original_value = Application.get_env(app, key)

    try do
      Application.put_env(app, key, value)
      fun.()
    after
      if original_value do
        Application.put_env(app, key, original_value)
      else
        Application.delete_env(app, key)
      end
    end
  end

  @doc """
  Helper for testing async operations with proper cleanup.
  """
  def assert_async_operation(async_fun, assertion_fun, timeout \\ 5000) do
    task = Task.async(async_fun)

    try do
      result = Task.await(task, timeout)
      assertion_fun.(result)
    catch
      :exit, {:timeout, _} ->
        Task.shutdown(task, :brutal_kill)
        flunk("Async operation timed out after #{timeout}ms")
    end
  end
end
