defmodule StreampaiWeb.Plugs.RequireAdminUser do
  @moduledoc """
  Plug that requires the current user to have admin privileges.
  """
  @behaviour Plug

  import Plug.Conn

  alias Streampai.Accounts.UserPolicy

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "Authentication required"})
        |> halt()

      user ->
        if UserPolicy.admin?(user) do
          conn
        else
          conn
          |> put_status(:forbidden)
          |> Phoenix.Controller.json(%{error: "Admin access required"})
          |> halt()
        end
    end
  end
end
