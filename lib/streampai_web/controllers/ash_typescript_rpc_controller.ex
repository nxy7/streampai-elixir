defmodule StreampaiWeb.AshTypescriptRpcController do
  use StreampaiWeb, :controller

  def run(conn, params) do
    conn.assigns |> dbg
    actor = conn.assigns[:current_user]
    conn = Plug.Conn.assign(conn, :actor, actor)

    result = AshTypescript.Rpc.run_action(:streampai, conn, params)
    json(conn, result)
  end

  def validate(conn, params) do
    result = AshTypescript.Rpc.validate_action(:streampai, conn, params)
    json(conn, result)
  end
end
