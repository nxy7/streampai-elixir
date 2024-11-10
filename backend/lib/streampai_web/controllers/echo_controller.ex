defmodule StreampaiWeb.EchoController do
  use StreampaiWeb, :controller

  def echo(conn, params) do
    # Get request details for benchmarking
    response_data = %{
      method: conn.method,
      path: conn.request_path,
      query_string: conn.query_string,
      params: params,
      headers: Enum.into(conn.req_headers, %{}),
      body: get_raw_body(conn),
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      remote_ip: get_remote_ip(conn)
    }

    json(conn, response_data)
  end

  def simple_echo(conn, _params) do
    # Minimal echo for performance testing
    text(conn, "Test")
  end

  # Ultra-minimal endpoint - no middleware, direct response
  def ultra_minimal(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "Test")
  end

  # JSON version for comparison
  def simple_json(conn, _params) do
    json(conn, %{status: "ok"})
  end

  # Static content - bypass all processing
  def static_response(conn, _params) do
    conn
    |> put_resp_content_type("text/plain")
    |> put_resp_header("cache-control", "public, max-age=3600")
    |> send_resp(200, "Test")
  end

  def echo_with_delay(conn, %{"delay" => delay_ms} = params) when is_binary(delay_ms) do
    delay = String.to_integer(delay_ms)
    Process.sleep(delay)

    json(conn, %{
      status: "ok",
      delay_ms: delay,
      method: conn.method,
      params: params,
      timestamp: System.system_time(:millisecond)
    })
  end

  def echo_with_delay(conn, params) do
    # Default 100ms delay
    Process.sleep(100)

    json(conn, %{
      status: "ok",
      delay_ms: 100,
      method: conn.method,
      params: params,
      timestamp: System.system_time(:millisecond)
    })
  end

  defp get_raw_body(conn) do
    case conn.assigns[:raw_body] do
      nil ->
        # Try to read body if not already read
        case Plug.Conn.read_body(conn, length: 1_000_000) do
          {:ok, body, _conn} -> body
          {:error, _} -> ""
        end

      body ->
        body
    end
  rescue
    _ -> ""
  end

  defp get_remote_ip(conn) do
    case Plug.Conn.get_req_header(conn, "x-forwarded-for") do
      [ip | _] ->
        ip

      [] ->
        case conn.remote_ip do
          {a, b, c, d} ->
            "#{a}.#{b}.#{c}.#{d}"

          {a, b, c, d, e, f, g, h} ->
            :inet.ntoa({a, b, c, d, e, f, g, h}) |> to_string()

          _ ->
            "unknown"
        end
    end
  end
end
