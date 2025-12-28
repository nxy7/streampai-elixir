defmodule StreampaiWeb.Plugs.SafeLoadFromSession do
  @moduledoc """
  Safely loads user from session, clearing session if user is not found.

  This is useful for worktree scenarios where a user session from one database
  is not valid in another database.

  Also handles impersonation: when an admin is impersonating another user,
  the impersonated user becomes the `current_user` for all Ash operations,
  while the original admin is stored in `impersonator` assign.
  """

  import Plug.Conn

  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    conn = StreampaiWeb.AuthPlug.load_from_session(conn, [])

    # Handle impersonation if active
    conn = maybe_apply_impersonation(conn)

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

  defp maybe_apply_impersonation(conn) do
    impersonated_user_id = get_session(conn, :impersonated_user_id)
    impersonator_user_id = get_session(conn, :impersonator_user_id)
    real_user = conn.assigns[:current_user]

    cond do
      # No impersonation active
      is_nil(impersonated_user_id) or is_nil(impersonator_user_id) ->
        conn

      # Current user doesn't match the impersonator (session mismatch)
      is_nil(real_user) or real_user.id != impersonator_user_id ->
        Logger.warning(
          "Impersonation session mismatch: clearing impersonation. " <>
            "impersonator_user_id=#{impersonator_user_id}, real_user_id=#{real_user && real_user.id}"
        )

        conn
        |> delete_session(:impersonated_user_id)
        |> delete_session(:impersonator_user_id)

      # Valid impersonation - load the impersonated user
      true ->
        case load_impersonated_user(impersonated_user_id, real_user) do
          {:ok, impersonated_user} ->
            Logger.debug("Impersonation active: #{real_user.email} -> #{impersonated_user.email}")

            conn
            |> assign(:current_user, impersonated_user)
            |> assign(:impersonator, real_user)

          {:error, reason} ->
            Logger.warning("Failed to load impersonated user #{impersonated_user_id}: #{inspect(reason)}")

            conn
            |> delete_session(:impersonated_user_id)
            |> delete_session(:impersonator_user_id)
        end
    end
  end

  defp load_impersonated_user(user_id, actor) do
    Streampai.Accounts.User.get_by_id(%{id: user_id}, actor: actor)
  end

  defp auth_related_error?(error_string) do
    String.contains?(error_string, "ExtendUserData") or
      String.contains?(error_string, "get_by_subject") or
      String.contains?(error_string, "subject_to_user") or
      String.contains?(error_string, "no function clause matching")
  end
end
