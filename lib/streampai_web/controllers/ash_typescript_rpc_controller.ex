defmodule StreampaiWeb.AshTypescriptRpcController do
  use StreampaiWeb, :controller

  def run(conn, params) do
    actor = conn.assigns[:current_user]
    conn = Plug.Conn.assign(conn, :actor, actor)

    result = AshTypescript.Rpc.run_action(:streampai, conn, params)
    json(conn, result)
  end

  def validate(conn, params) do
    result = AshTypescript.Rpc.validate_action(:streampai, conn, params)
    json(conn, result)
  end

  @doc """
  Generate a Phoenix.Token for WebSocket authentication.
  This allows the frontend to pass the token via socket params
  since WebSockets don't automatically send cookies cross-origin.
  """
  def socket_token(conn, _params) do
    case conn.assigns[:current_user] do
      nil ->
        json(conn, %{token: nil})

      user ->
        # Token expires in 1 hour - user will need to reconnect after that
        token = Phoenix.Token.sign(conn, "user_socket", user.id)
        json(conn, %{token: token})
    end
  end
end
