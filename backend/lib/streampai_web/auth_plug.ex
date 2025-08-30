defmodule StreampaiWeb.AuthPlug do
  @moduledoc """
  Custom authentication plug that provides tier loading and impersonation.

  This provides load_from_session and load_from_bearer functions
  that automatically load the :tier calculation for users and handle impersonation.
  """
  use AshAuthentication.Plug, otp_app: :streampai
  import Plug.Conn

  def init(opts), do: opts

  def handle_success(conn, _activity, user, token) do
    if is_api_request?(conn) do
      conn
      |> send_resp(
        200,
        Jason.encode!(%{
          authentication: %{
            success: true,
            token: token
          }
        })
      )
    else
      conn
      |> store_in_session(user)
      |> send_resp(
        200,
        EEx.eval_string(
          """
          <h2>Welcome back <%= @user.email %></h2>
          """,
          user: user
        )
      )
    end
  end

  def handle_failure(conn, _activity, _reason) do
    if is_api_request?(conn) do
      conn
      |> send_resp(
        401,
        Jason.encode!(%{
          authentication: %{
            success: false
          }
        })
      )
    else
      conn
      |> send_resp(401, "<h2>Incorrect email or password</h2>")
    end
  end

  defp is_api_request?(conn), do: "application/json" in get_req_header(conn, "accept")
  # Plug function for loading user from session with tier
  def load_from_session(conn, opts) do
    # First load user using AshAuthentication Phoenix plug
    conn = AshAuthentication.Phoenix.Plug.load_from_session(conn, opts)

    # Then enhance the current_user with tier if present
    load_tier_for_current_user(conn)
  end

  # Plug function for loading user from bearer token with tier
  def load_from_bearer(conn, opts) do
    # First load user using AshAuthentication Phoenix plug
    conn = AshAuthentication.Phoenix.Plug.load_from_bearer(conn, opts)

    # Then enhance the current_user with tier if present
    load_tier_for_current_user(conn)
  end

  # Helper function to load tier for current user
  defp load_tier_for_current_user(conn) do
    case conn.assigns[:current_user] do
      nil ->
        conn

      user ->
        case Ash.load(user, [:tier]) do
          {:ok, user_with_tier} ->
            assign(conn, :current_user, user_with_tier)

          {:error, _error} ->
            # Keep original user if tier loading fails
            conn
        end
    end
  end
end
