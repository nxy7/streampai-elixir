defmodule StreampaiWeb.UserSocket do
  @moduledoc """
  Socket for handling WebSocket connections.

  Supports:
  - AshTypescript RPC over channels (real-time alternative to HTTP)
  - Phoenix Presence for real-time user tracking

  Authentication is handled via Phoenix.Token passed in socket params,
  since WebSocket connections don't automatically send cookies cross-origin.
  """
  use Phoenix.Socket

  alias Streampai.Accounts.User

  # Channels
  channel "ash_typescript_rpc:*", StreampaiWeb.AshTypescriptRpcChannel
  channel "presence:*", StreampaiWeb.PresenceChannel

  # Token is valid for 1 hour
  @max_age 3600

  @impl true
  def connect(params, socket, _connect_info) do
    socket = authenticate_socket(socket, params)
    {:ok, socket}
  end

  defp authenticate_socket(socket, %{"token" => token}) when is_binary(token) do
    with {:ok, user_id} <- Phoenix.Token.verify(socket, "user_socket", token, max_age: @max_age),
         {:ok, user} <- Ash.get(User, user_id, authorize?: false) do
      socket
      |> assign(:current_user, user)
      |> assign(:ash_actor, user)
      |> assign(:user_id, user.id)
    else
      _ -> assign(socket, :current_user, nil)
    end
  end

  defp authenticate_socket(socket, _params), do: assign(socket, :current_user, nil)

  @impl true
  def id(socket) do
    case socket.assigns[:user_id] do
      nil -> nil
      user_id -> "user_socket:#{user_id}"
    end
  end
end
