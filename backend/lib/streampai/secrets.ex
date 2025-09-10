defmodule Streampai.Secrets do
  @moduledoc """
  Handles authentication secrets and configuration retrieval for AshAuthentication.
  """
  use AshAuthentication.Secret

  alias Streampai.Accounts.User

  require Logger

  def secret_for([:authentication, :tokens, :signing_secret], User, _opts, _context) do
    Application.fetch_env(:streampai, :token_signing_secret)
  end

  def secret_for([:authentication, :strategies, :google, :client_id], User, _opts, _context),
    do: Application.fetch_env(:streampai, :google_client_id)

  def secret_for([:authentication, :strategies, :google, :client_secret], User, _opts, _context),
    do: Application.fetch_env(:streampai, :google_client_secret)

  def secret_for([:authentication, :strategies, :google, :redirect_uri], User, _opts, _context),
    do: Application.fetch_env(:streampai, :google_redirect_uri)

  def secret_for([:authentication, :strategies, :twitch, :client_id], User, _opts, _context),
    do: Application.fetch_env(:streampai, :twitch_client_id)

  def secret_for([:authentication, :strategies, :twitch, :client_secret], User, _opts, _context),
    do: Application.fetch_env(:streampai, :twitch_client_secret)

  def secret_for([:authentication, :strategies, :twitch, :redirect_uri], User, _opts, _context),
    do: Application.fetch_env(:streampai, :twitch_redirect_uri)
end
