defmodule StreampaiWeb.Plugs.RateLimiter do
  @moduledoc """
  Simple rate limiting plug for authentication routes to prevent bot registrations.
  """
  import Plug.Conn
  import Phoenix.Controller

  def init(opts), do: opts

  def call(conn, opts) do
    limit = Keyword.get(opts, :limit, 5)
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

  defp get_client_ip(conn) do
    case get_req_header(conn, "x-forwarded-for") do
      [forwarded | _] ->
        forwarded |> String.split(",") |> List.first() |> String.trim()

      [] ->
        conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp check_rate_limit(key, limit, window) do
    now = System.system_time(:millisecond)

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
    _ ->
      # ETS table doesn't exist yet, allow request
      :ok
  end
end
