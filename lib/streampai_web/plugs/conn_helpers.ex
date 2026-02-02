defmodule StreampaiWeb.Plugs.ConnHelpers do
  @moduledoc """
  Shared connection helper functions for plugs and controllers.
  """

  @doc """
  Extracts the real client IP from the connection, checking proxy headers
  in order of preference: Cloudflare, Nginx, standard forwarded, then remote_ip.
  """
  @spec get_client_ip(Plug.Conn.t()) :: String.t()
  def get_client_ip(conn) do
    cf_connecting_ip = Plug.Conn.get_req_header(conn, "cf-connecting-ip")
    real_ip = Plug.Conn.get_req_header(conn, "x-real-ip")
    forwarded_for = Plug.Conn.get_req_header(conn, "x-forwarded-for")

    cond do
      cf_connecting_ip != [] ->
        cf_connecting_ip |> List.first() |> String.trim()

      real_ip != [] ->
        real_ip |> List.first() |> String.trim()

      forwarded_for != [] ->
        forwarded_for
        |> List.first()
        |> String.split(",")
        |> List.first()
        |> String.trim()

      true ->
        conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  @doc """
  Gets the first value for a request header, or nil if not present.
  """
  @spec get_header(Plug.Conn.t(), String.t()) :: String.t() | nil
  def get_header(conn, header_name) do
    case Plug.Conn.get_req_header(conn, header_name) do
      [value | _] -> value
      [] -> nil
    end
  end

  @doc """
  Gets the raw request body from the connection.
  Falls back to JSON-encoding params if raw body was not cached.
  """
  @spec get_raw_body(Plug.Conn.t()) :: {:ok, String.t()}
  def get_raw_body(conn) do
    case conn.assigns[:raw_body] do
      nil -> {:ok, Jason.encode!(conn.params)}
      body -> {:ok, body}
    end
  end
end
