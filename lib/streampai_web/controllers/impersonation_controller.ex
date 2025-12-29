defmodule StreampaiWeb.ImpersonationController do
  @moduledoc """
  Controller for handling user impersonation functionality.

  This controller manages the session-based impersonation system:
  - Start impersonation of another user (admin only)
  - Stop impersonation and return to original user

  Supports both browser (HTML) and API (JSON) responses via content negotiation.
  """
  use StreampaiWeb, :controller

  alias Streampai.Accounts.UserPolicy

  defp frontend_url do
    Application.get_env(:streampai, :frontend_url, "http://localhost:3000")
  end

  def start_impersonation(conn, %{"user_id" => user_id}) do
    # If impersonation is already active, use the impersonator as the real user
    real_user = conn.assigns[:impersonator] || conn.assigns.current_user

    with true <- can_impersonate?(real_user),
         {:ok, target_user} <- load_user_by_id(user_id, real_user),
         true <- UserPolicy.can_impersonate_user?(real_user, target_user) do
      conn
      |> put_session(:impersonated_user_id, user_id)
      |> put_session(:impersonator_user_id, real_user.id)
      |> respond_success("Impersonation started", %{
        impersonating: true,
        impersonated_user: %{
          id: target_user.id,
          email: target_user.email,
          name: target_user.name
        }
      })
    else
      false ->
        respond_error(conn, "You don't have permission to impersonate this user", 403)

      {:error, _error} ->
        respond_error(conn, "User not found or access denied", 404)
    end
  end

  def stop_impersonation(conn, _params) do
    conn
    |> delete_session(:impersonated_user_id)
    |> delete_session(:impersonator_user_id)
    |> respond_success("Impersonation stopped", %{impersonating: false})
  end

  defp load_user_by_id(user_id, actor) when is_binary(user_id) do
    Streampai.Accounts.User.get_by_id(%{id: user_id}, actor: actor)
  end

  defp load_user_by_id(_, _), do: {:error, :invalid_id}

  defp can_impersonate?(user) do
    UserPolicy.can_impersonate?(user)
  end

  defp respond_success(conn, message, data) do
    case get_format(conn) do
      "json" ->
        json(conn, Map.put(data, :message, message))

      _ ->
        conn
        |> put_flash(:info, message)
        |> redirect(external: redirect_url_for_response(data))
    end
  end

  defp respond_error(conn, message, status_code) do
    case get_format(conn) do
      "json" ->
        conn
        |> put_status(status_code)
        |> json(%{error: message})

      _ ->
        conn
        |> put_flash(:error, message)
        |> redirect(external: "#{frontend_url()}/dashboard/admin/users")
    end
  end

  defp redirect_url_for_response(%{impersonating: true}), do: "#{frontend_url()}/dashboard"
  defp redirect_url_for_response(_), do: "#{frontend_url()}/dashboard/admin/users"
end
