defmodule StreampaiWeb.AuthController do
  use StreampaiWeb, :controller
  use AshAuthentication.Phoenix.Controller

  require Logger

  @frontend_url Application.compile_env(:streampai, :frontend_url, "http://localhost:3000")

  def success(conn, _activity, user, _token) do
    # Check for stored redirect URL from either password auth or OAuth
    return_to =
      get_session(conn, :return_to) ||
        get_session(conn, :oauth_redirect_to)

    redirect_url =
      case return_to do
        nil -> "#{frontend_url()}/dashboard"
        "/" <> _ = path -> "#{frontend_url()}#{path}"
        url -> url
      end

    conn
    |> delete_session(:return_to)
    |> delete_session(:oauth_redirect_to)
    |> store_in_session(user)
    |> assign(:current_user, user)
    |> redirect(external: redirect_url)
  end

  defp frontend_url do
    Application.get_env(:streampai, :frontend_url, @frontend_url)
  end

  def failure(conn, activity, reason) do
    Logger.error("Authentication failure for #{inspect(activity)}: #{inspect(reason)}")

    conn
    |> redirect(external: "#{frontend_url()}/auth/sign-in?error=authentication_failed")
  end

  def sign_out(conn, _params) do
    conn
    |> clear_session(:streampai)
    |> redirect(external: frontend_url())
  end
end
