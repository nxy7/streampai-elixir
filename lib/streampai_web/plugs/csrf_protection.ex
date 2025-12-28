defmodule StreampaiWeb.Plugs.CsrfProtection do
  @moduledoc """
  CSRF protection for SPA API endpoints using the Double Submit Cookie pattern.

  This plug implements CSRF protection for JSON API endpoints that use session-based
  authentication. It works as follows:

  1. **Token Generation**: When a session exists and no CSRF token cookie is present,
     a cryptographically random token is generated and stored in both the session
     and a cookie.

  2. **Token Validation**: For state-changing requests (POST, PUT, PATCH, DELETE),
     the plug validates that the `x-csrf-token` header matches the cookie value.

  3. **Security Properties**:
     - Cookie is HttpOnly: false (so frontend JS can read and send it as header)
     - Cookie is SameSite=Strict for additional protection
     - Cookie is Secure in production (HTTPS only)
     - Token is cryptographically random (256 bits)

  ## Why Double Submit Cookie?

  Traditional CSRF protection (like Phoenix's `protect_from_forgery`) embeds tokens
  in HTML forms. For SPAs that communicate via JSON APIs, we need a different approach:

  - The frontend reads the CSRF token from a cookie
  - The frontend sends the token in a custom header (`x-csrf-token`)
  - The server validates that the header matches the cookie

  Cross-site requests cannot read our cookies (due to SameSite policy) or set custom
  headers on fetch requests (CORS blocks this), so attackers cannot forge valid requests.

  ## Usage

  Add to your API pipeline in the router:

      pipeline :rpc do
        plug :accepts, ["json"]
        plug :fetch_session
        plug StreampaiWeb.Plugs.CsrfProtection
      end
  """

  import Phoenix.Controller, only: [json: 2]
  import Plug.Conn

  require Logger

  @token_length 32
  @cookie_name "_streampai_csrf"
  @header_name "x-csrf-token"
  @session_key :csrf_token

  # Methods that require CSRF validation
  @protected_methods ~w(POST PUT PATCH DELETE)

  def init(opts), do: opts

  def call(conn, _opts) do
    conn
    |> ensure_csrf_token()
    |> maybe_validate_csrf()
  end

  # Generate and set CSRF token if session exists and no token is present
  defp ensure_csrf_token(conn) do
    # Only set CSRF token if we have a session
    case get_session(conn, :session_id) || get_session(conn, :__ash_authentication__) do
      nil ->
        # No session - no CSRF token needed
        conn

      _session_data ->
        # Session exists - ensure CSRF token is set
        case {get_session(conn, @session_key), get_csrf_cookie(conn)} do
          {nil, _} ->
            # No session token - generate new one
            set_new_csrf_token(conn)

          {session_token, nil} ->
            # Session token exists but no cookie - set cookie
            set_csrf_cookie(conn, session_token)

          {session_token, cookie_token} when session_token != cookie_token ->
            # Mismatch - regenerate (session is source of truth)
            set_csrf_cookie(conn, session_token)

          {_session_token, _cookie_token} ->
            # Both exist and match - nothing to do
            conn
        end
    end
  end

  defp set_new_csrf_token(conn) do
    token = generate_token()

    conn
    |> put_session(@session_key, token)
    |> set_csrf_cookie(token)
  end

  defp set_csrf_cookie(conn, token) do
    # In production, use Secure flag. In dev, allow non-HTTPS.
    secure = Application.get_env(:streampai, :env) == :prod

    put_resp_cookie(conn, @cookie_name, token,
      http_only: false,
      same_site: "Strict",
      secure: secure,
      path: "/",
      # 1 year - matches session lifetime
      max_age: 365 * 24 * 60 * 60
    )
  end

  defp get_csrf_cookie(conn) do
    conn.cookies[@cookie_name]
  end

  defp get_csrf_header(conn) do
    conn
    |> get_req_header(@header_name)
    |> List.first()
  end

  defp generate_token do
    @token_length
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end

  # Validate CSRF token for protected methods
  defp maybe_validate_csrf(%{method: method} = conn) when method in @protected_methods do
    session_token = get_session(conn, @session_key)
    header_token = get_csrf_header(conn)

    cond do
      # No session - no validation needed (unauthenticated requests are okay)
      is_nil(session_token) ->
        conn

      # Missing header
      is_nil(header_token) ->
        reject_csrf(conn, "Missing CSRF token header")

      # Invalid token
      not secure_compare(session_token, header_token) ->
        reject_csrf(conn, "Invalid CSRF token")

      # Valid
      true ->
        conn
    end
  end

  # Safe methods don't need CSRF validation
  defp maybe_validate_csrf(conn), do: conn

  defp reject_csrf(conn, reason) do
    Logger.warning("CSRF validation failed: #{reason}",
      method: conn.method,
      path: conn.request_path,
      remote_ip: format_ip(conn.remote_ip)
    )

    conn
    |> put_status(:forbidden)
    |> json(%{
      error: "CSRF validation failed",
      message: "This request was blocked for security reasons. Please refresh the page and try again."
    })
    |> halt()
  end

  defp format_ip(ip) when is_tuple(ip), do: ip |> :inet.ntoa() |> to_string()
  defp format_ip(ip), do: inspect(ip)

  # Constant-time string comparison to prevent timing attacks
  defp secure_compare(left, right) when is_binary(left) and is_binary(right) do
    byte_size(left) == byte_size(right) and :crypto.hash_equals(left, right)
  end

  defp secure_compare(_, _), do: false
end
