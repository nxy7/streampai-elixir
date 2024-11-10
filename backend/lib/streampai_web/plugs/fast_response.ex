defmodule StreampaiWeb.Plugs.FastResponse do
  @behaviour Plug

  def init(opts), do: opts

  def call(conn, _opts) do
    # Ultra-fast response with minimal processing
    conn
    |> Plug.Conn.put_resp_content_type("text/plain")
    |> Plug.Conn.send_resp(200, "Test")
    |> Plug.Conn.halt()
  end
end
