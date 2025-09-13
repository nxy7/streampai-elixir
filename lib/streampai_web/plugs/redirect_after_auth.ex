defmodule StreampaiWeb.Plugs.RedirectAfterAuth do
  @moduledoc """
  Plug to store the redirect_to parameter in the session for post-authentication redirect.
  Works for both password auth and OAuth flows.

  Based on community recommendations from Elixir Forum:
  https://elixirforum.com/t/setting-the-return-to-for-ash-authentication/60784
  """

  import Plug.Conn

  # Paths that should not be stored as redirect destinations (security)
  @blocked_paths [
    "/auth/sign-in",
    "/auth/register",
    "/auth/sign-out",
    "/auth/reset",
    "/auth/user/google",
    "/auth/user/google/callback"
  ]

  def init(opts), do: opts

  def call(conn, _opts) do
    case conn.params["redirect_to"] do
      redirect_to when is_binary(redirect_to) ->
        if valid_redirect_path?(redirect_to) do
          conn
          |> put_session(:return_to, redirect_to)
          |> store_oauth_redirect(redirect_to)
        else
          conn
        end

      _ ->
        conn
    end
  end

  # Validate that the redirect path is safe and allowed
  defp valid_redirect_path?(path) do
    cond do
      # Block external URLs (must be relative paths)
      String.contains?(path, "://") ->
        false

      # Block auth-related paths to prevent redirect loops
      path in @blocked_paths ->
        false

      # Block paths that don't start with /
      not String.starts_with?(path, "/") ->
        false

      # Allow dashboard and other internal paths
      String.starts_with?(path, "/dashboard") ->
        true

      String.starts_with?(path, "/widgets") ->
        true

        # Default: allow other internal paths
        true
    end
  end

  # Store redirect for OAuth flows
  defp store_oauth_redirect(conn, redirect_to) do
    case conn.request_path do
      "/auth/user/google" ->
        put_session(conn, :oauth_redirect_to, redirect_to)

      _ ->
        conn
    end
  end
end
