defmodule Streampai.LivestreamManager.RetryStrategyTest do
  use ExUnit.Case, async: true

  alias Streampai.LivestreamManager.RetryStrategy

  describe "calculate_delay/2" do
    test "returns delay with exponential backoff" do
      # First retry: 1000 * 2^0 = 1000 + jitter (0-1000)
      delay0 = RetryStrategy.calculate_delay(0, base_delay_ms: 1000, max_delay_ms: 30_000)
      assert delay0 >= 1000 and delay0 <= 2000

      # Second retry: 1000 * 2^1 = 2000 + jitter
      delay1 = RetryStrategy.calculate_delay(1, base_delay_ms: 1000, max_delay_ms: 30_000)
      assert delay1 >= 2000 and delay1 <= 3000

      # Third retry: 1000 * 2^2 = 4000 + jitter
      delay2 = RetryStrategy.calculate_delay(2, base_delay_ms: 1000, max_delay_ms: 30_000)
      assert delay2 >= 4000 and delay2 <= 5000
    end

    test "caps delay at max_delay_ms" do
      # Very high retry count should be capped
      delay = RetryStrategy.calculate_delay(10, base_delay_ms: 1000, max_delay_ms: 5000)
      assert delay <= 5000
    end

    test "adds jitter to delays" do
      # Run multiple times and check for variance (use larger base to make jitter more likely to show)
      delays =
        for _ <- 1..100,
            do: RetryStrategy.calculate_delay(0, base_delay_ms: 1000, max_delay_ms: 30_000)

      # Should have some variance due to jitter (at least 2 different values out of 100)
      assert length(Enum.uniq(delays)) >= 2
    end
  end

  describe "should_retry?/3" do
    test "returns true for retryable errors within limit" do
      # Explicitly pass max_retries to override test config (which has max_retries: 2)
      assert RetryStrategy.should_retry?(0, :timeout, max_retries: 5)
      assert RetryStrategy.should_retry?(1, :service_unavailable, max_retries: 5)
      assert RetryStrategy.should_retry?(2, {:http_error, 500, ""}, max_retries: 5)
      assert RetryStrategy.should_retry?(0, {:request_failed, :econnrefused}, max_retries: 5)
    end

    test "returns false when max retries exceeded" do
      refute RetryStrategy.should_retry?(5, :timeout, max_retries: 5)
      refute RetryStrategy.should_retry?(10, :timeout, max_retries: 5)
    end

    test "returns false for non-retryable errors" do
      refute RetryStrategy.should_retry?(0, :not_found)
      refute RetryStrategy.should_retry?(0, :unauthorized)
      refute RetryStrategy.should_retry?(0, :forbidden)
      refute RetryStrategy.should_retry?(0, {:http_error, 400, ""})
      refute RetryStrategy.should_retry?(0, {:http_error, 401, ""})
      refute RetryStrategy.should_retry?(0, {:http_error, 404, ""})
    end

    test "handles wrapped errors" do
      assert RetryStrategy.should_retry?(0, {:error, :timeout})
      refute RetryStrategy.should_retry?(0, {:error, :not_found})
    end
  end

  describe "retryable_error?/1" do
    test "timeout errors are retryable" do
      assert RetryStrategy.retryable_error?(:timeout)
    end

    test "service unavailable is retryable" do
      assert RetryStrategy.retryable_error?(:service_unavailable)
    end

    test "connection errors are retryable" do
      assert RetryStrategy.retryable_error?(:connection_refused)
      assert RetryStrategy.retryable_error?(:connection_closed)
      assert RetryStrategy.retryable_error?(:econnrefused)
      assert RetryStrategy.retryable_error?(:closed)
      assert RetryStrategy.retryable_error?(:nxdomain)
    end

    test "5xx HTTP errors are retryable" do
      assert RetryStrategy.retryable_error?({:http_error, 500, ""})
      assert RetryStrategy.retryable_error?({:http_error, 502, ""})
      assert RetryStrategy.retryable_error?({:http_error, 503, ""})
      assert RetryStrategy.retryable_error?({:http_error, 504, ""})
    end

    test "429 rate limit is retryable" do
      assert RetryStrategy.retryable_error?({:http_error, 429, ""})
    end

    test "request failures are retryable" do
      assert RetryStrategy.retryable_error?({:request_failed, :timeout})
      assert RetryStrategy.retryable_error?({:request_failed, %{reason: :closed}})
    end

    test "exceptions are retryable" do
      assert RetryStrategy.retryable_error?({:exception, %RuntimeError{}})
    end

    test "circuit open is not retryable" do
      refute RetryStrategy.retryable_error?(:circuit_open)
    end

    test "4xx client errors are not retryable" do
      refute RetryStrategy.retryable_error?({:http_error, 400, ""})
      refute RetryStrategy.retryable_error?({:http_error, 401, ""})
      refute RetryStrategy.retryable_error?({:http_error, 403, ""})
      refute RetryStrategy.retryable_error?({:http_error, 404, ""})
    end

    test "auth errors are not retryable" do
      refute RetryStrategy.retryable_error?(:unauthorized)
      refute RetryStrategy.retryable_error?(:forbidden)
    end

    test "api errors depend on message" do
      assert RetryStrategy.retryable_error?({:api_error, "rate limit exceeded"})
      assert RetryStrategy.retryable_error?({:api_error, "please try again later"})
      assert RetryStrategy.retryable_error?({:api_error, "temporarily unavailable"})
      refute RetryStrategy.retryable_error?({:api_error, "invalid input"})
    end
  end

  describe "with_retry/2" do
    test "returns success on first try" do
      result = RetryStrategy.with_retry(fn -> {:ok, "success"} end)
      assert {:ok, "success"} = result
    end

    test "retries on retryable errors" do
      # Track call count
      {:ok, counter} = Agent.start_link(fn -> 0 end)

      result =
        RetryStrategy.with_retry(
          fn ->
            count = Agent.get_and_update(counter, fn c -> {c, c + 1} end)

            if count < 2 do
              {:error, :timeout}
            else
              {:ok, "eventually succeeded"}
            end
          end,
          max_retries: 5,
          base_delay_ms: 1,
          max_delay_ms: 10
        )

      assert {:ok, "eventually succeeded"} = result
      assert Agent.get(counter, & &1) == 3

      Agent.stop(counter)
    end

    test "gives up after max retries" do
      {:ok, counter} = Agent.start_link(fn -> 0 end)

      result =
        RetryStrategy.with_retry(
          fn ->
            Agent.update(counter, &(&1 + 1))
            {:error, :timeout}
          end,
          max_retries: 2,
          base_delay_ms: 1,
          max_delay_ms: 10
        )

      assert {:error, :timeout} = result
      # Initial + 2 retries = 3 attempts
      assert Agent.get(counter, & &1) == 3

      Agent.stop(counter)
    end

    test "doesn't retry non-retryable errors" do
      {:ok, counter} = Agent.start_link(fn -> 0 end)

      result =
        RetryStrategy.with_retry(
          fn ->
            Agent.update(counter, &(&1 + 1))
            {:error, :not_found}
          end,
          max_retries: 5,
          base_delay_ms: 1
        )

      assert {:error, :not_found} = result
      # Only one attempt
      assert Agent.get(counter, & &1) == 1

      Agent.stop(counter)
    end

    test "calls on_retry callback" do
      {:ok, retries} = Agent.start_link(fn -> [] end)

      RetryStrategy.with_retry(
        fn -> {:error, :timeout} end,
        max_retries: 2,
        base_delay_ms: 1,
        max_delay_ms: 10,
        on_retry: fn retry_count, error, delay ->
          Agent.update(retries, &[{retry_count, error, delay} | &1])
        end
      )

      recorded = Agent.get(retries, &Enum.reverse(&1))
      assert length(recorded) == 2

      [{count0, error0, _delay0}, {count1, error1, _delay1}] = recorded
      assert count0 == 0
      assert count1 == 1
      assert error0 == :timeout
      assert error1 == :timeout

      Agent.stop(retries)
    end

    test "handles exceptions with retry" do
      {:ok, counter} = Agent.start_link(fn -> 0 end)

      result =
        RetryStrategy.with_retry(
          fn ->
            count = Agent.get_and_update(counter, fn c -> {c, c + 1} end)

            if count < 1 do
              raise "temporary error"
            else
              {:ok, "recovered"}
            end
          end,
          max_retries: 3,
          base_delay_ms: 1,
          max_delay_ms: 10
        )

      assert {:ok, "recovered"} = result
      assert Agent.get(counter, & &1) == 2

      Agent.stop(counter)
    end
  end
end
