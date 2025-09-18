defmodule StreampaiWeb.ImpersonationController do
  @moduledoc """
  Controller for handling user impersonation functionality.

  This controller manages the session-based impersonation system:
  - Start impersonation of another user (admin only)
  - Stop impersonation and return to original user
  """
  use StreampaiWeb, :controller

  alias Streampai.Accounts.UserPolicy

  def start_impersonation(conn, %{"user_id" => user_id}) do
    real_user = conn.assigns.current_user

    with true <- can_impersonate?(real_user),
         {:ok, target_user} <- load_user_by_id(user_id, real_user),
         true <- UserPolicy.can_impersonate_user?(real_user, target_user) do
      conn
      |> put_session(:impersonated_user_id, user_id)
      |> put_session(:impersonator_user_id, real_user.id)
      |> put_flash(:info, "Impersonation started")
      |> redirect(to: "/dashboard")
    else
      false ->
        conn
        |> put_flash(:error, "You don't have permission to impersonate this user")
        |> redirect(to: "/dashboard/admin/users")

      {:error, _error} ->
        conn
        |> put_flash(:error, "User not found or access denied")
        |> redirect(to: "/dashboard/admin/users")
    end
  end

  def stop_impersonation(conn, _params) do
    conn
    |> delete_session(:impersonated_user_id)
    |> delete_session(:impersonator_user_id)
    |> put_flash(:info, "Impersonation stopped")
    |> redirect(to: "/dashboard/admin/users")
  end

  defp load_user_by_id(user_id, actor) when is_binary(user_id) do
    Streampai.Accounts.User
    |> Ash.Query.for_read(:get_by_id_minimal, %{id: user_id}, actor: actor)
    |> Ash.read()
  end

  defp load_user_by_id(_, _), do: {:error, :invalid_id}

  defp can_impersonate?(user) do
    UserPolicy.can_impersonate?(user)
  end
end
