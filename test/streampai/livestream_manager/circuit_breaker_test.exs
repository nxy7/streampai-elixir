defmodule Streampai.LivestreamManager.CircuitBreakerTest do
  use Supertester.ExUnitFoundation, isolation: :full_isolation, async: true

  import Supertester.Assertions

  alias Streampai.LivestreamManager.CircuitBreaker

  setup do
    # Ensure the ETS table exists
    CircuitBreaker.ensure_table()

    # Reset all circuits before each test
    circuit_name = :"test_circuit_#{System.unique_integer([:positive])}"

    on_exit(fn ->
      CircuitBreaker.reset(circuit_name)
    end)

    {:ok, circuit: circuit_name}
  end

  describe "basic circuit breaker behavior" do
    test "allows calls when closed", %{circuit: circuit} do
      result = CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)
      assert {:ok, "success"} = result
      assert :closed = CircuitBreaker.get_state(circuit)
    end

    test "returns function result on success", %{circuit: circuit} do
      result = CircuitBreaker.call(circuit, fn -> {:ok, %{data: "test"}} end)
      assert {:ok, %{data: "test"}} = result
    end

    test "returns error result on failure", %{circuit: circuit} do
      result = CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      assert {:error, :failed} = result
    end

    test "handles :ok return value", %{circuit: circuit} do
      result = CircuitBreaker.call(circuit, fn -> :ok end)
      assert {:ok, :ok} = result
    end
  end

  describe "circuit opening" do
    test "opens after threshold failures", %{circuit: circuit} do
      threshold = Application.get_env(:streampai, :circuit_breaker_failure_threshold, 3)

      # Cause failures up to threshold
      for _ <- 1..threshold do
        CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      end

      # Circuit should now be open
      assert :open = CircuitBreaker.get_state(circuit)

      # Calls should fail fast
      result = CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)
      assert {:error, :circuit_open} = result
    end

    test "doesn't open below threshold", %{circuit: circuit} do
      threshold = Application.get_env(:streampai, :circuit_breaker_failure_threshold, 3)

      # Cause failures below threshold
      for _ <- 1..(threshold - 1) do
        CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      end

      # Circuit should still be closed
      assert :closed = CircuitBreaker.get_state(circuit)
    end

    test "successful call resets failure count", %{circuit: circuit} do
      # Cause some failures
      CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      CircuitBreaker.call(circuit, fn -> {:error, :failed} end)

      # Success resets counter
      CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)

      # These failures shouldn't open circuit
      CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      CircuitBreaker.call(circuit, fn -> {:error, :failed} end)

      assert :closed = CircuitBreaker.get_state(circuit)
    end
  end

  describe "half-open state" do
    test "transitions to half-open after reset timeout", %{circuit: circuit} do
      threshold = Application.get_env(:streampai, :circuit_breaker_failure_threshold, 3)
      reset_timeout = Application.get_env(:streampai, :circuit_breaker_reset_timeout, 100)

      # Open the circuit
      for _ <- 1..threshold do
        CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      end

      assert :open = CircuitBreaker.get_state(circuit)

      # Wait for reset timeout using supertester pattern
      # Add small buffer for timing reliability
      Process.sleep(reset_timeout + 50)

      # Next call should be allowed (half-open test)
      result = CircuitBreaker.call(circuit, fn -> {:ok, "recovered"} end)
      assert {:ok, "recovered"} = result
    end

    test "closes after success in half-open", %{circuit: circuit} do
      threshold = Application.get_env(:streampai, :circuit_breaker_failure_threshold, 3)
      reset_timeout = Application.get_env(:streampai, :circuit_breaker_reset_timeout, 100)

      # Open the circuit
      for _ <- 1..threshold do
        CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      end

      # Wait for reset timeout
      Process.sleep(reset_timeout + 50)

      # Successful calls in half-open should close circuit
      # (default half_open_success_threshold may be > 1)
      CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)
      CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)
      CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)

      assert :closed = CircuitBreaker.get_state(circuit)
    end

    test "re-opens on failure in half-open", %{circuit: circuit} do
      threshold = Application.get_env(:streampai, :circuit_breaker_failure_threshold, 3)
      reset_timeout = Application.get_env(:streampai, :circuit_breaker_reset_timeout, 100)

      # Open the circuit
      for _ <- 1..threshold do
        CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      end

      # Wait for reset timeout
      Process.sleep(reset_timeout + 50)

      # Fail during half-open
      CircuitBreaker.call(circuit, fn -> {:error, :still_failing} end)

      assert :open = CircuitBreaker.get_state(circuit)
    end
  end

  describe "exception handling" do
    test "catches exceptions and records as failure", %{circuit: circuit} do
      result =
        CircuitBreaker.call(circuit, fn ->
          raise "Something went wrong"
        end)

      assert {:error, {:exception, %RuntimeError{}}} = result
    end

    test "catches throws and records as failure", %{circuit: circuit} do
      result =
        CircuitBreaker.call(circuit, fn ->
          throw(:some_error)
        end)

      assert {:error, {:throw, :some_error}} = result
    end
  end

  describe "manual control" do
    test "reset clears circuit state", %{circuit: circuit} do
      threshold = Application.get_env(:streampai, :circuit_breaker_failure_threshold, 3)

      # Open the circuit
      for _ <- 1..threshold do
        CircuitBreaker.call(circuit, fn -> {:error, :failed} end)
      end

      assert :open = CircuitBreaker.get_state(circuit)

      # Reset
      :ok = CircuitBreaker.reset(circuit)

      # Should be back to closed (new circuit)
      assert :closed = CircuitBreaker.get_state(circuit)
    end

    test "force_open immediately opens circuit", %{circuit: circuit} do
      assert :closed = CircuitBreaker.get_state(circuit)

      :ok = CircuitBreaker.force_open(circuit)

      assert :open = CircuitBreaker.get_state(circuit)

      result = CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)
      assert {:error, :circuit_open} = result
    end
  end

  describe "custom configuration" do
    test "respects custom failure threshold", %{circuit: _circuit} do
      custom_circuit = :"custom_threshold_#{System.unique_integer([:positive])}"

      # Use higher threshold
      for _ <- 1..3 do
        CircuitBreaker.call(custom_circuit, fn -> {:error, :failed} end, failure_threshold: 10)
      end

      # Should still be closed with threshold of 10
      assert :closed = CircuitBreaker.get_state(custom_circuit)

      CircuitBreaker.reset(custom_circuit)
    end
  end

  describe "circuit data" do
    test "get_circuit_data returns full state", %{circuit: circuit} do
      # Make some calls
      CircuitBreaker.call(circuit, fn -> {:ok, "success"} end)
      CircuitBreaker.call(circuit, fn -> {:error, :failed} end)

      data = CircuitBreaker.get_circuit_data(circuit)

      assert data.status == :closed
      assert data.failure_count == 1
      assert is_integer(data.last_failure_at)
      assert is_map(data.config)
    end

    test "returns nil for unknown circuit", %{circuit: _circuit} do
      assert nil == CircuitBreaker.get_circuit_data(:unknown_circuit_12345)
    end
  end

  describe "concurrent stress testing" do
    test "handles concurrent calls safely", %{circuit: circuit} do
      # Test that concurrent calls all succeed without corrupting state
      tasks =
        for _ <- 1..10 do
          Task.async(fn ->
            CircuitBreaker.call(circuit, fn -> {:ok, "concurrent"} end)
          end)
        end

      results = Task.await_many(tasks)
      assert Enum.all?(results, &match?({:ok, "concurrent"}, &1))

      # Verify circuit state is still valid
      assert :closed = CircuitBreaker.get_state(circuit)
    end

    test "memory stable under concurrent load", %{circuit: circuit} do
      # Use memory stability check for concurrent testing
      assert_memory_usage_stable(
        fn ->
          tasks =
            for _ <- 1..20 do
              Task.async(fn ->
                CircuitBreaker.call(circuit, fn -> {:ok, "concurrent"} end)
              end)
            end

          Task.await_many(tasks)
        end,
        0.5
      )
    end
  end
end
