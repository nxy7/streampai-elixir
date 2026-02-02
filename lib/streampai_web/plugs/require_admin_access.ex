defmodule StreampaiWeb.Plugs.RequireAdminAccess do
  @moduledoc """
  Plug that restricts access to admin routes based on IP allowlist or admin token.
  """
  @behaviour Plug

  import Plug.Conn
  import StreampaiWeb.Plugs.ConnHelpers, only: [get_client_ip: 1]

  require Logger

  @allowed_ips ["127.0.0.1", "::1", "194.9.78.14"]

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    client_ip = get_client_ip(conn)
    admin_token = conn |> get_req_header("x-admin-token") |> List.first()
    allowed_token = System.get_env("ADMIN_TOKEN")

    cond do
      client_ip in @allowed_ips ->
        conn

      allowed_token && admin_token && Plug.Crypto.secure_compare(admin_token, allowed_token) ->
        conn

      is_nil(allowed_token) ->
        Logger.warning("Admin access denied: ADMIN_TOKEN not configured, from IP: #{client_ip}")
        deny(conn)

      true ->
        Logger.warning("Denied access to admin interface from IP: #{client_ip}")
        deny(conn)
    end
  end

  defp deny(conn) do
    conn
    |> put_status(:forbidden)
    |> Phoenix.Controller.text("Access denied")
    |> halt()
  end
end
