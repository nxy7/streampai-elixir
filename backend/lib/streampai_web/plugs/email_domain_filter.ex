defmodule StreampaiWeb.Plugs.EmailDomainFilter do
  @moduledoc """
  Plug to filter out suspicious email domains commonly used by bots.
  """
  import Phoenix.Controller
  import Plug.Conn

  # Common disposable email domains used by bots
  @suspicious_domains [
    # Add patterns you've seen in the bot registrations
    "tempmail.org",
    "10minutemail.com",
    "guerrillamail.com"
  ]

  def init(opts), do: opts

  def call(conn, _opts) do
    # Only check during registration attempts
    case conn.path_info do
      ["auth", "user", "password", "register"] ->
        check_email_domain(conn)

      ["auth", "user", "google", "callback"] ->
        check_oauth_email(conn)

      ["auth", "user", "twitch", "callback"] ->
        check_oauth_email(conn)

      _ ->
        conn
    end
  end

  defp check_email_domain(conn) do
    case get_email_from_params(conn.params) do
      nil -> conn
      email -> validate_email_domain(conn, email)
    end
  end

  defp check_oauth_email(conn) do
    # For OAuth, we can't check the email before callback
    # But we can log suspicious patterns for monitoring
    conn
  end

  defp get_email_from_params(params) do
    params["user"]["email"] || params["email"]
  rescue
    _ -> nil
  end

  defp validate_email_domain(conn, email) do
    domain = email |> String.split("@") |> List.last() |> String.downcase()

    if domain in @suspicious_domains do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Email domain not allowed"})
      |> halt()
    else
      conn
    end
  end
end
