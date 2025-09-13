defmodule StreampaiWeb.AuthController do
  use StreampaiWeb, :controller
  use AshAuthentication.Phoenix.Controller

  require Logger

  def success(conn, _activity, user, _token) do
    # Check for stored redirect URL from either password auth or OAuth
    return_to =
      get_session(conn, :return_to) ||
        get_session(conn, :oauth_redirect_to) ||
        ~p"/dashboard"

    conn
    # Clean up password auth redirect
    |> delete_session(:return_to)
    # Clean up OAuth redirect
    |> delete_session(:oauth_redirect_to)
    |> store_in_session(user)
    |> assign(:current_user, user)
    |> redirect(to: return_to)
  end

  def failure(conn, _activity, reason) do
    Logger.error("Authentication failure: #{inspect(reason)}")

    conn
    |> put_flash(:error, "Authentication failed")
    |> redirect(to: ~p"/auth/sign-in")
  end

  def sign_out(conn, _params) do
    conn
    |> clear_session(:streampai)
    |> redirect(to: ~p"/")
  end
end
