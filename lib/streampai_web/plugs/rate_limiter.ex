defmodule StreampaiWeb.Plugs.RateLimiter do
  @moduledoc """
  Simple rate limiting plug for authentication routes to prevent bot registrations.
  """
  import Phoenix.Controller
  import Plug.Conn
  import StreampaiWeb.Plugs.ConnHelpers, only: [get_client_ip: 1]

  def init(opts), do: opts

  def call(conn, opts) do
    limit = Keyword.get(opts, :limit, 50)
    # 1 minute in milliseconds
    window = Keyword.get(opts, :window, 60_000)

    client_ip = get_client_ip(conn)
    key = "rate_limit:auth:#{client_ip}"

    case check_rate_limit(key, limit, window) do
      :ok ->
        conn

      :rate_limited ->
        conn
        |> put_status(:too_many_requests)
        |> json(%{error: "Too many registration attempts. Please try again later."})
        |> halt()
    end
  end

  defp check_rate_limit(key, limit, window) do
    now = System.system_time(:millisecond)

    # Ensure ETS table exists
    ensure_rate_limiter_table()

    # Clean up old entries and increment counter
    case :ets.lookup(:rate_limiter, key) do
      [{^key, count, first_request}] when now - first_request < window ->
        if count >= limit do
          :rate_limited
        else
          :ets.insert(:rate_limiter, {key, count + 1, first_request})
          :ok
        end

      _ ->
        # First request in window or window expired
        :ets.insert(:rate_limiter, {key, 1, now})
        :ok
    end
  rescue
    error ->
      require Logger

      Logger.error("Rate limiter ETS error: #{inspect(error)}")
      # Fail securely - rate limit when there are ETS issues
      :rate_limited
  end

  defp ensure_rate_limiter_table do
    case :ets.whereis(:rate_limiter) do
      :undefined ->
        try do
          :ets.new(:rate_limiter, [:set, :public, :named_table])
        rescue
          ArgumentError ->
            # Table might have been created by another process in a race condition
            :ok
        end

      _ ->
        :ok
    end
  end
end
