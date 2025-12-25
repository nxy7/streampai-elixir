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
    # Try to authenticate via token passed in params
    case get_user_from_token(socket, params) do
      {:ok, user} ->
        socket =
          socket
          |> assign(:current_user, user)
          |> assign(:ash_actor, user)
          |> assign(:user_id, user.id)

        {:ok, socket}

      :anonymous ->
        # Allow anonymous connections for public presence (e.g., stream viewer counts)
        {:ok, assign(socket, :current_user, nil)}
    end
  end

  defp get_user_from_token(socket, %{"token" => token}) when is_binary(token) do
    case Phoenix.Token.verify(socket, "user_socket", token, max_age: @max_age) do
      {:ok, user_id} ->
        case Ash.get(User, user_id, authorize?: false) do
          {:ok, user} -> {:ok, user}
          _ -> :anonymous
        end

      {:error, _reason} ->
        :anonymous
    end
  end

  defp get_user_from_token(_socket, _params), do: :anonymous

  @impl true
  def id(socket) do
    case socket.assigns[:user_id] do
      nil -> nil
      user_id -> "user_socket:#{user_id}"
    end
  end
end
