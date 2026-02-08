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

  @doc """
  Returns the full session status: current user data and impersonation state.
  Replaces both the Ash RPC `getCurrentUser` call and the old `impersonation-status` endpoint.
  """
  def session_status(conn, _params) do
    user_data =
      case conn.assigns[:current_user] do
        nil ->
          nil

        actor ->
          case Streampai.Accounts.User
               |> Ash.Query.for_read(:current_user, %{}, actor: actor)
               |> Ash.read_one() do
            {:ok, user} -> serialize_user(user)
            _ -> nil
          end
      end

    impersonator = conn.assigns[:impersonator]

    json(conn, %{
      user: user_data,
      impersonation: %{
        active: impersonator != nil,
        impersonator:
          if(impersonator,
            do: %{id: impersonator.id, email: impersonator.email, name: impersonator.name}
          )
      }
    })
  end

  defp serialize_user(nil), do: nil

  defp serialize_user(user) do
    %{
      id: user.id,
      email: user.email,
      name: user.name,
      displayAvatar: user.display_avatar,
      hoursStreamedLast30Days: user.hours_streamed_last30_days,
      extraData: user.extra_data,
      isModerator: user.is_moderator,
      storageQuota: user.storage_quota,
      storageUsedPercent: user.storage_used_percent,
      avatarFileId: user.avatar_file_id,
      role: user.role,
      tier: user.tier
    }
  end
end
