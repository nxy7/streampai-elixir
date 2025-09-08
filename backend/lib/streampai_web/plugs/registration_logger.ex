defmodule StreampaiWeb.Plugs.RegistrationLogger do
  @moduledoc """
  Logs user registration attempts for monitoring and security analysis.
  """
  require Logger
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    # Log registration attempts
    case conn.path_info do
      ["auth", "user", "password", "register"] ->
        log_registration_attempt(conn, :password)
      ["auth", "user", "google", "callback"] ->
        log_registration_attempt(conn, :google)
      ["auth", "user", "twitch", "callback"] ->
        log_registration_attempt(conn, :twitch)
      _ ->
        conn
    end
  end

  defp log_registration_attempt(conn, method) do
    client_ip = get_client_ip(conn)
    user_agent = get_req_header(conn, "user-agent") |> List.first() || "unknown"
    
    email = case method do
      :password -> get_email_from_params(conn.params)
      _ -> "oauth_flow"
    end

    Logger.info("Registration attempt", 
      method: method,
      email: email,
      ip: client_ip,
      user_agent: user_agent,
      timestamp: DateTime.utc_now()
    )

    conn
  end

  defp get_client_ip(conn) do
    case get_req_header(conn, "x-forwarded-for") do
      [forwarded | _] -> 
        forwarded |> String.split(",") |> List.first() |> String.trim()
      [] -> 
        conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp get_email_from_params(params) do
    params["user"]["email"] || params["email"] || "unknown"
  rescue
    _ -> "unknown"
  end
end