defmodule Streampai.LivestreamManager.RetryStrategy do
  @moduledoc """
  Retry strategy with exponential backoff and jitter.

  Provides consistent retry behavior across the livestream management system.
  """

  @default_max_retries 5
  @default_base_delay_ms 1_000
  @default_max_delay_ms 30_000

  @doc """
  Calculates the delay for a retry attempt using exponential backoff with jitter.

  ## Parameters
  - `retry_count` - The current retry attempt (0-indexed)
  - `opts` - Optional configuration:
    - `:base_delay_ms` - Base delay in milliseconds (default: 1000)
    - `:max_delay_ms` - Maximum delay cap (default: 30000)

  ## Returns
  Delay in milliseconds.

  ## Example
      iex> RetryStrategy.calculate_delay(0)
      # Returns between 1000 and 2000 ms
      iex> RetryStrategy.calculate_delay(3)
      # Returns between 8000 and 9000 ms (capped at max_delay_ms)
  """
  def calculate_delay(retry_count, opts \\ []) do
    base_delay = Keyword.get(opts, :base_delay_ms, get_default(:base_delay_ms))
    max_delay = Keyword.get(opts, :max_delay_ms, get_default(:max_delay_ms))

    # Exponential: base * 2^retry_count
    delay = base_delay * :math.pow(2, retry_count)

    # Add jitter (random 0-1000ms)
    jitter = :rand.uniform(1000)

    # Cap at max delay
    min(trunc(delay) + jitter, max_delay)
  end

  @doc """
  Determines if a retry should be attempted based on retry count and error type.

  ## Parameters
  - `retry_count` - The current retry attempt (0-indexed)
  - `error` - The error that occurred
  - `opts` - Optional configuration:
    - `:max_retries` - Maximum number of retries (default: 5)

  ## Returns
  `true` if retry should be attempted, `false` otherwise.
  """
  def should_retry?(retry_count, error, opts \\ []) do
    max_retries = Keyword.get(opts, :max_retries, get_default(:max_retries))

    retry_count < max_retries and retryable_error?(error)
  end

  @doc """
  Executes a function with retry logic.

  ## Parameters
  - `fun` - Function to execute (should return `{:ok, result}` or `{:error, reason}`)
  - `opts` - Configuration options:
    - `:max_retries` - Maximum retry attempts (default: 5)
    - `:base_delay_ms` - Base delay for backoff (default: 1000)
    - `:max_delay_ms` - Maximum delay cap (default: 30000)
    - `:on_retry` - Optional callback `fn retry_count, error, delay -> :ok end`

  ## Returns
  - `{:ok, result}` on success
  - `{:error, reason}` after all retries exhausted

  ## Example
      RetryStrategy.with_retry(fn ->
        Cloudflare.APIClient.get_live_input(input_id)
      end, max_retries: 3)
  """
  def with_retry(fun, opts \\ []) do
    max_retries = Keyword.get(opts, :max_retries, get_default(:max_retries))
    on_retry = Keyword.get(opts, :on_retry)

    do_retry(fun, 0, max_retries, opts, on_retry)
  end

  # Private functions

  defp do_retry(fun, retry_count, max_retries, opts, on_retry) do
    case fun.() do
      {:ok, _} = success ->
        success

      {:error, reason} = error ->
        if retry_count < max_retries and retryable_error?(reason) do
          delay = calculate_delay(retry_count, opts)

          if on_retry do
            on_retry.(retry_count, reason, delay)
          end

          Process.sleep(delay)
          do_retry(fun, retry_count + 1, max_retries, opts, on_retry)
        else
          error
        end

      :ok ->
        {:ok, :ok}

      other ->
        {:ok, other}
    end
  rescue
    e ->
      error = {:exception, e}

      if retry_count < max_retries and retryable_error?(error) do
        delay = calculate_delay(retry_count, opts)

        if on_retry do
          on_retry.(retry_count, error, delay)
        end

        Process.sleep(delay)
        do_retry(fun, retry_count + 1, max_retries, opts, on_retry)
      else
        {:error, error}
      end
  end

  @doc """
  Checks if an error is retryable.

  Retryable errors include:
  - Timeouts
  - Service unavailable (5xx errors)
  - Connection errors
  - Transient exceptions

  Non-retryable errors include:
  - Authentication failures (401, 403)
  - Not found (404)
  - Bad request (400)
  - Rate limiting (429) - handled separately with specific backoff
  """
  def retryable_error?(error)

  # Tuple-based errors
  def retryable_error?({:error, reason}), do: retryable_error?(reason)

  # Specific error atoms
  def retryable_error?(:timeout), do: true
  def retryable_error?(:service_unavailable), do: true
  def retryable_error?(:connection_refused), do: true
  def retryable_error?(:connection_closed), do: true
  def retryable_error?(:econnrefused), do: true
  def retryable_error?(:closed), do: true
  def retryable_error?(:nxdomain), do: true

  # HTTP status-based errors
  def retryable_error?({:http_error, status, _body}) when status >= 500, do: true
  def retryable_error?({:http_error, 429, _body}), do: true
  def retryable_error?({:http_error, _status, _body}), do: false

  # Request failures (network issues)
  def retryable_error?({:request_failed, _reason}), do: true

  # Exceptions are generally retryable (could be transient)
  def retryable_error?({:exception, _}), do: true

  # Circuit breaker open is not retryable (let the circuit handle it)
  def retryable_error?(:circuit_open), do: false

  # Not found is not retryable
  def retryable_error?(:not_found), do: false

  # Auth errors are not retryable
  def retryable_error?(:unauthorized), do: false
  def retryable_error?(:forbidden), do: false

  # API errors may or may not be retryable depending on message
  def retryable_error?({:api_error, message}) when is_binary(message) do
    # Rate limit or temporary errors
    String.contains?(message, ["rate limit", "try again", "temporarily"])
  end

  # Default: not retryable
  def retryable_error?(_), do: false

  # Configuration helpers

  defp get_default(:max_retries) do
    Application.get_env(:streampai, :retry_max_retries, @default_max_retries)
  end

  defp get_default(:base_delay_ms) do
    Application.get_env(:streampai, :retry_base_delay_ms, @default_base_delay_ms)
  end

  defp get_default(:max_delay_ms) do
    Application.get_env(:streampai, :retry_max_delay_ms, @default_max_delay_ms)
  end
end
