defmodule Streampai.Accounts.TokenRefresher do
  @moduledoc """
  Handles refreshing OAuth tokens for streaming platforms.

  This module provides functions to refresh expired tokens using the refresh tokens
  stored in the database. Each platform may have different refresh flows.
  """

  require Logger

  @doc """
  Refresh tokens for all expired streaming accounts.
  This could be called by a background job.
  """
  def refresh_expired_tokens do
    case Ash.read(Streampai.Accounts.StreamingAccount, action: :expired_tokens) do
      {:ok, expired_accounts} ->
        Logger.info("Found #{length(expired_accounts)} expired tokens to refresh")

        Enum.each(expired_accounts, fn account ->
          case refresh_account_token(account) do
            {:ok, _updated_account} ->
              Logger.info(
                "Successfully refreshed token for user #{account.user_id} on #{account.platform}"
              )

            {:error, error} ->
              Logger.error(
                "Failed to refresh token for user #{account.user_id} on #{account.platform}: #{inspect(error)}"
              )
          end
        end)

        {:ok, length(expired_accounts)}

      {:error, error} ->
        Logger.error("Failed to fetch expired tokens: #{inspect(error)}")
        {:error, error}
    end
  end

  @doc """
  Refresh token for a specific streaming account.
  """
  def refresh_account_token(%Streampai.Accounts.StreamingAccount{platform: :google} = account) do
    refresh_google_token(account)
  end

  def refresh_account_token(%Streampai.Accounts.StreamingAccount{platform: :twitch} = account) do
    refresh_twitch_token(account)
  end

  defp refresh_google_token(account) do
    # Google OAuth2 token refresh
    # This would make an HTTP request to Google's token endpoint
    # For now, just simulate a successful refresh
    new_token = "refreshed_google_token_#{:rand.uniform(10000)}"
    new_expires_at = DateTime.add(DateTime.utc_now(), 3600, :second)

    account
    |> Ash.Changeset.for_update(:refresh_token, %{
      access_token: new_token,
      access_token_expires_at: new_expires_at
    })
    |> Ash.update()
  end

  defp refresh_twitch_token(account) do
    # Twitch OAuth2 token refresh
    # This would make an HTTP request to Twitch's token endpoint
    # For now, just simulate a successful refresh
    new_token = "refreshed_twitch_token_#{:rand.uniform(10000)}"
    new_expires_at = DateTime.add(DateTime.utc_now(), 3600, :second)

    account
    |> Ash.Changeset.for_update(:refresh_token, %{
      access_token: new_token,
      access_token_expires_at: new_expires_at
    })
    |> Ash.update()
  end

  @doc """
  Get streaming accounts for a specific user.
  """
  def get_user_accounts(user_id) do
    Ash.read(Streampai.Accounts.StreamingAccount, action: :for_user, user_id: user_id)
  end

  @doc """
  Check if a streaming account's token is expired or will expire soon.
  """
  def token_expires_soon?(
        %Streampai.Accounts.StreamingAccount{access_token_expires_at: expires_at},
        minutes \\ 10
      ) do
    threshold = DateTime.add(DateTime.utc_now(), minutes * 60, :second)
    DateTime.compare(expires_at, threshold) == :lt
  end
end
