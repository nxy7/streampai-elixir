defmodule StreampaiWeb.AuthController do
  require Logger
  use StreampaiWeb, :controller
  use AshAuthentication.Phoenix.Controller

  def success(conn, _activity, user, _token) do
    return_to = get_session(conn, :return_to) || ~p"/dashboard"

    conn
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
