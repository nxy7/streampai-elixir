defmodule StreampaiWeb.AshTypescriptRpcChannel do
  @moduledoc """
  Phoenix Channel for AshTypescript RPC actions.

  This allows RPC calls to go over WebSocket instead of HTTP,
  providing lower latency and real-time capabilities.
  """
  use Phoenix.Channel

  @impl true
  def join("ash_typescript_rpc:" <> _user_id, _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("run", params, socket) do
    result = AshTypescript.Rpc.run_action(:streampai, socket, params)
    {:reply, {:ok, result}, socket}
  end

  @impl true
  def handle_in("validate", params, socket) do
    result = AshTypescript.Rpc.validate_action(:streampai, socket, params)
    {:reply, {:ok, result}, socket}
  end

  @impl true
  def handle_in(event, _payload, socket) do
    {:reply, {:error, %{reason: "Unknown event: #{event}"}}, socket}
  end
end
