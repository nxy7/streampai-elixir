defmodule Streampai.Secrets do
  require Logger
  use AshAuthentication.Secret

  def secret_for([:authentication, :tokens, :signing_secret], Streampai.Accounts.User, _opts) do
    Application.fetch_env(:streampai, :token_signing_secret)
  end

  def secret_for(
        [:authentication, :strategies, :google, :client_id],
        Streampai.Accounts.User,
        _opts
      ),
      do: Application.fetch_env(:streampai, :google_client_id)

  def secret_for(
        [:authentication, :strategies, :google, :client_secret],
        Streampai.Accounts.User,
        _opts
      ),
      do: Application.fetch_env(:streampai, :google_client_secret)

  def secret_for(
        [:authentication, :strategies, :google, :redirect_uri],
        Streampai.Accounts.User,
        _opts
      ),
      do: Application.fetch_env(:streampai, :google_redirect_uri)
end
