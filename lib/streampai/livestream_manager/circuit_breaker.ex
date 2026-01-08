defmodule Streampai.LivestreamManager.CircuitBreaker do
  @moduledoc """
  Simple circuit breaker implementation using ETS.

  States:
  - :closed - Normal operation, requests pass through
  - :open - Too many failures, requests fail fast
  - :half_open - Testing if service recovered
  """

  require Logger

  @table_name :circuit_breaker_state
  @default_failure_threshold 5
  @default_reset_timeout_ms 30_000
  @default_half_open_success_threshold 3

  @doc """
  Ensures the ETS table exists. Called from application supervisor init.
  """
  def ensure_table do
    if :ets.whereis(@table_name) == :undefined do
      :ets.new(@table_name, [:named_table, :public, :set, read_concurrency: true])
    end

    :ok
  end

  @doc """
  Executes a function through the circuit breaker.
  """
  def call(circuit_name, fun, opts \\ []) do
    ensure_table()
    ensure_circuit_exists(circuit_name, opts)

    case get_state(circuit_name) do
      :open ->
        if should_try_half_open?(circuit_name) do
          try_half_open(circuit_name, fun)
        else
          {:error, :circuit_open}
        end

      :half_open ->
        try_half_open(circuit_name, fun)

      :closed ->
        execute_and_track(circuit_name, fun)
    end
  end

  def get_state(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] -> state.status
      [] -> :closed
    end
  rescue
    ArgumentError -> :closed
  end

  def get_circuit_data(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] -> state
      [] -> nil
    end
  rescue
    ArgumentError -> nil
  end

  def reset(circuit_name) do
    :ets.delete(@table_name, circuit_name)
    :ok
  rescue
    ArgumentError -> :ok
  end

  def force_open(circuit_name) do
    state = %{
      status: :open,
      failure_count: 0,
      success_count: 0,
      last_failure_at: System.monotonic_time(:millisecond),
      opened_at: System.monotonic_time(:millisecond),
      config: get_config(circuit_name)
    }

    :ets.insert(@table_name, {circuit_name, state})
    :ok
  end

  # Private Functions

  defp ensure_circuit_exists(circuit_name, opts) do
    case :ets.lookup(@table_name, circuit_name) do
      [] ->
        config = build_config(opts)

        state = %{
          status: :closed,
          failure_count: 0,
          success_count: 0,
          last_failure_at: nil,
          opened_at: nil,
          config: config
        }

        :ets.insert(@table_name, {circuit_name, state})

      _ ->
        :ok
    end
  end

  defp build_config(opts) do
    %{
      failure_threshold: Keyword.get(opts, :failure_threshold, get_default(:failure_threshold)),
      reset_timeout_ms: Keyword.get(opts, :reset_timeout_ms, get_default(:reset_timeout_ms)),
      half_open_success_threshold:
        Keyword.get(opts, :half_open_success_threshold, get_default(:half_open_success_threshold))
    }
  end

  defp get_default(:failure_threshold) do
    Application.get_env(
      :streampai,
      :circuit_breaker_failure_threshold,
      @default_failure_threshold
    )
  end

  defp get_default(:reset_timeout_ms) do
    Application.get_env(:streampai, :circuit_breaker_reset_timeout, @default_reset_timeout_ms)
  end

  defp get_default(:half_open_success_threshold) do
    Application.get_env(
      :streampai,
      :circuit_breaker_half_open_success_threshold,
      @default_half_open_success_threshold
    )
  end

  defp get_config(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] -> state.config
      [] -> build_config([])
    end
  end

  defp should_try_half_open?(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, %{status: :open, opened_at: opened_at, config: config}}] ->
        now = System.monotonic_time(:millisecond)
        now - opened_at >= config.reset_timeout_ms

      _ ->
        false
    end
  end

  defp try_half_open(circuit_name, fun) do
    update_status(circuit_name, :half_open)

    case execute_function(fun) do
      {:ok, _} = success ->
        record_half_open_success(circuit_name)
        success

      {:error, _} = error ->
        open_circuit(circuit_name)
        error
    end
  end

  defp execute_and_track(circuit_name, fun) do
    case execute_function(fun) do
      {:ok, _} = success ->
        record_success(circuit_name)
        success

      {:error, _} = error ->
        record_failure(circuit_name)
        error
    end
  end

  defp execute_function(fun) do
    case fun.() do
      {:ok, _} = success -> success
      {:error, _} = error -> error
      :ok -> {:ok, :ok}
      other -> {:ok, other}
    end
  rescue
    e ->
      Logger.error("Circuit breaker caught exception: #{inspect(e)}")
      {:error, {:exception, e}}
  catch
    kind, value ->
      Logger.error("Circuit breaker caught #{kind}: #{inspect(value)}")
      {:error, {kind, value}}
  end

  defp record_success(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] ->
        new_state = %{state | failure_count: 0, success_count: state.success_count + 1}
        :ets.insert(@table_name, {circuit_name, new_state})

      [] ->
        :ok
    end
  end

  defp record_failure(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] ->
        new_failure_count = state.failure_count + 1
        now = System.monotonic_time(:millisecond)

        new_state = %{state | failure_count: new_failure_count, last_failure_at: now}
        :ets.insert(@table_name, {circuit_name, new_state})

        if new_failure_count >= state.config.failure_threshold do
          open_circuit(circuit_name)
        end

      [] ->
        :ok
    end
  end

  defp record_half_open_success(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] ->
        new_success_count = state.success_count + 1

        if new_success_count >= state.config.half_open_success_threshold do
          close_circuit(circuit_name)
        else
          new_state = %{state | success_count: new_success_count}
          :ets.insert(@table_name, {circuit_name, new_state})
        end

      [] ->
        :ok
    end
  end

  defp open_circuit(circuit_name) do
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] ->
        new_state = %{state | status: :open, opened_at: now, success_count: 0}
        :ets.insert(@table_name, {circuit_name, new_state})

        Logger.warning("Circuit breaker #{circuit_name} opened after #{state.failure_count} failures")

      [] ->
        :ok
    end
  end

  defp close_circuit(circuit_name) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] ->
        new_state = %{state | status: :closed, failure_count: 0, success_count: 0, opened_at: nil}
        :ets.insert(@table_name, {circuit_name, new_state})
        Logger.info("Circuit breaker #{circuit_name} closed after recovery")

      [] ->
        :ok
    end
  end

  defp update_status(circuit_name, new_status) do
    case :ets.lookup(@table_name, circuit_name) do
      [{^circuit_name, state}] ->
        new_state = %{state | status: new_status}
        :ets.insert(@table_name, {circuit_name, new_state})

      [] ->
        :ok
    end
  end
end
