defmodule StreampaiWeb.AuthController do
  use StreampaiWeb, :controller
  use AshAuthentication.Phoenix.Controller

  require Logger

  def success(conn, _activity, user, _token) do
    # Check for stored redirect URL from either password auth or OAuth
    return_to =
      get_session(conn, :return_to) ||
        get_session(conn, :oauth_redirect_to)

    # Use relative paths so redirects work with any proxy/port configuration
    redirect_path =
      case return_to do
        nil -> "/dashboard"
        "/" <> _ = path -> path
        _url -> "/dashboard"
      end

    conn
    |> delete_session(:return_to)
    |> delete_session(:oauth_redirect_to)
    |> store_in_session(user)
    |> assign(:current_user, user)
    |> redirect(to: redirect_path)
  end

  def failure(conn, activity, reason) do
    Logger.error("Authentication failure for #{inspect(activity)}: #{inspect(reason)}")

    redirect(conn, to: "/login?error=authentication_failed")
  end

  def sign_out(conn, _params) do
    # Get the origin from referer header to redirect back to the frontend
    redirect_url =
      case get_req_header(conn, "referer") do
        [referer | _] ->
          case URI.parse(referer) do
            %URI{scheme: scheme, host: host, port: port} when not is_nil(host) ->
              port_part = if port in [nil, 80, 443], do: "", else: ":#{port}"
              "#{scheme}://#{host}#{port_part}/"

            _ ->
              "/"
          end

        [] ->
          "/"
      end

    conn
    |> clear_session(:streampai)
    |> redirect(external: redirect_url)
  end
end
