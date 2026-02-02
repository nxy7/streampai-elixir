defmodule StreampaiWeb.AuthController do
  use StreampaiWeb, :controller
  use AshAuthentication.Phoenix.Controller

  require Logger

  def success(conn, _activity, user, _token) do
    # Check for stored redirect URL from either password auth or OAuth
    return_to =
      get_session(conn, :return_to) ||
        get_session(conn, :oauth_redirect_to)

    # Build absolute URL to frontend
    frontend_url = Application.get_env(:streampai, :frontend_url, "http://localhost:3000")

    redirect_url =
      case return_to do
        nil -> "#{frontend_url}/dashboard"
        "/" <> _ = path -> "#{frontend_url}#{path}"
        url when is_binary(url) -> url
      end

    conn
    |> delete_session(:return_to)
    |> delete_session(:oauth_redirect_to)
    |> store_in_session(user)
    |> assign(:current_user, user)
    |> redirect(external: redirect_url)
  end

  def failure(conn, activity, reason) do
    Logger.error("Authentication failure for #{inspect(activity)}: #{inspect(reason)}")

    frontend_url = Application.get_env(:streampai, :frontend_url, "http://localhost:3000")
    redirect(conn, external: "#{frontend_url}/login?error=authentication_failed")
  end

  def sign_out(conn, _params) do
    frontend_url = Application.get_env(:streampai, :frontend_url, "http://localhost:3000")

    # Get the origin from referer header to redirect back to the frontend
    redirect_url =
      case get_req_header(conn, "referer") do
        [referer | _] ->
          case URI.parse(referer) do
            %URI{scheme: scheme, host: host, port: port} when not is_nil(host) ->
              port_part = if port in [nil, 80, 443], do: "", else: ":#{port}"
              "#{scheme}://#{host}#{port_part}/"

            _ ->
              frontend_url
          end

        [] ->
          frontend_url
      end

    conn
    |> clear_session(:streampai)
    |> redirect(external: redirect_url)
  end
end
