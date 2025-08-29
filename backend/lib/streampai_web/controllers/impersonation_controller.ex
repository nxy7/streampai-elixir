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
    # Get the real user (current authenticated user)
    real_user = conn.assigns[:current_user]

    if can_impersonate?(real_user) do
      case load_user_by_id(user_id, real_user) do
        {:ok, _target_user} ->
          conn
          |> put_session(:impersonated_user_id, user_id)
          |> put_session(:impersonator_user_id, real_user.id)
          |> put_flash(:info, "Impersonation started")
          |> redirect(to: "/dashboard")

        {:error, _} ->
          conn
          |> put_flash(:error, "User not found")
          |> redirect(to: "/dashboard/admin/users")
      end
    else
      conn
      |> put_flash(:error, "You don't have permission to impersonate users")
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
    Ash.get(Streampai.Accounts.User, user_id, actor: actor)
  rescue
    _ -> {:error, :not_found}
  end

  defp load_user_by_id(_, _), do: {:error, :invalid_id}

  defp can_impersonate?(user) do
    UserPolicy.can_impersonate?(user)
  end
end
