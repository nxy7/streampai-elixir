defmodule StreampaiWeb.AuthController do
  require Logger
  use StreampaiWeb, :controller
  use AshAuthentication.Phoenix.Controller

  def success(conn, _activity, user, _token) do
    return_to = get_session(conn, :return_to) || ~p"/dashboard"

    user_with_tier =
      case Ash.load(user, [:tier]) do
        {:ok, loaded_user} ->
          loaded_user

        {:error, _err} ->
          user
      end

    conn
    # |> delete_session(:return_to)
    |> store_in_session(user_with_tier)
    # If your resource has a different name, update the assign name here (i.e :current_admin)
    |> assign(:current_user, user_with_tier)
    |> redirect(to: return_to)
  end

  def failure(conn, _activity, _reason) do
    conn
    |> put_flash(:error, "Incorrect email or password")
    |> redirect(to: ~p"/auth/sign-in")
  end

  def sign_out(conn, _params) do
    conn
    |> clear_session(:streampai)
    |> redirect(to: ~p"/")
  end
end
