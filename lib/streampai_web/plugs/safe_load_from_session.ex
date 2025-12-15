defmodule StreampaiWeb.Plugs.SafeLoadFromSession do
  @moduledoc """
  Safely loads user from session, clearing session if user is not found.

  This is useful for worktree scenarios where a user session from one database
  is not valid in another database.
  """

  import Plug.Conn

  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    conn = StreampaiWeb.AuthPlug.load_from_session(conn, [])

    # Set actor for Ash using PlugHelpers if current_user is present
    case conn.assigns[:current_user] do
      nil -> conn
      user -> Ash.PlugHelpers.set_actor(conn, user)
    end
  rescue
    error ->
      # Check if this is an authentication-related error
      error_string = Exception.message(error)

      if auth_related_error?(error_string) do
        Logger.info("User session invalid in current worktree database - clearing session. Error: #{error_string}")

        conn
        |> clear_session()
        |> assign(:current_user, nil)
      else
        # Re-raise non-authentication errors
        Logger.error("Non-auth error in SafeLoadFromSession: #{inspect(error)}")
        reraise error, __STACKTRACE__
      end
  end

  defp auth_related_error?(error_string) do
    String.contains?(error_string, "ExtendUserData") or
      String.contains?(error_string, "get_by_subject") or
      String.contains?(error_string, "subject_to_user") or
      String.contains?(error_string, "no function clause matching")
  end
end
