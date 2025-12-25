defmodule StreampaiWeb.AshTypescriptRpcController do
  use StreampaiWeb, :controller

  def run(conn, params) do
    conn
    |> assign(:actor, conn.assigns[:current_user])
    |> then(&json(&1, AshTypescript.Rpc.run_action(:streampai, &1, params)))
  end

  def validate(conn, params) do
    json(conn, AshTypescript.Rpc.validate_action(:streampai, conn, params))
  end

  @doc """
  Generate a Phoenix.Token for WebSocket authentication.
  This allows the frontend to pass the token via socket params
  since WebSockets don't automatically send cookies cross-origin.
  """
  def socket_token(conn, _params) do
    token =
      case conn.assigns[:current_user] do
        nil -> nil
        user -> Phoenix.Token.sign(conn, "user_socket", user.id)
      end

    json(conn, %{token: token})
  end
end
