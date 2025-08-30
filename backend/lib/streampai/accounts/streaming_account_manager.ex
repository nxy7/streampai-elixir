defmodule Streampai.Accounts.StreamingAccountManager do
  @moduledoc """
  Context for managing streaming account connections and operations.

  Centralizes business logic for connecting, disconnecting, and managing
  streaming accounts across different platforms.
  """

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Dashboard
  require Ash.Query

  @doc """
  Disconnects a streaming account for the given user and platform.

  ## Parameters
  - user: The user whose account should be disconnected
  - platform: The platform to disconnect (atom like :twitch, :youtube)

  ## Returns
  - :ok if disconnection was successful
  - {:error, reason} if disconnection failed
  """
  def disconnect_account(user, platform) when is_atom(platform) do
    # Use the more efficient query approach from stream_live.ex
    query =
      StreamingAccount
      |> Ash.Query.for_read(:for_user, %{user_id: user.id})
      |> Ash.Query.filter(platform == ^platform)

    case Ash.read(query) do
      {:ok, [streaming_account]} ->
        # Delete the streaming account
        case Ash.destroy(streaming_account) do
          :ok -> :ok
          {:error, error} -> {:error, error}
        end

      {:ok, []} ->
        # Account not found (already disconnected?)
        :ok

      {:error, error} ->
        {:error, error}
    end
  end

  @doc """
  Refreshes platform connections for a user after account changes.

  This is commonly needed after connecting or disconnecting accounts
  to update the UI state.
  """
  def refresh_platform_connections(user) do
    Dashboard.get_platform_connections(user)
  end

  @doc """
  Connects a streaming account for a user.

  This would be used by OAuth callback handlers.
  """
  def connect_account(_user, platform, _tokens) when is_atom(platform) do
    # TODO: Implement when needed
    # This would handle creating new StreamingAccount records
    {:error, :not_implemented}
  end

  @doc """
  Gets all connected platforms for a user.
  """
  def get_connected_platforms(user) do
    query =
      StreamingAccount
      |> Ash.Query.for_read(:for_user, %{user_id: user.id})

    case Ash.read(query) do
      {:ok, accounts} ->
        platforms = Enum.map(accounts, & &1.platform)
        {:ok, platforms}

      {:error, error} ->
        {:error, error}
    end
  end
end
