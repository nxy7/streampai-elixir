defmodule Streampai.Secrets do
  @moduledoc """
  Handles authentication secrets and configuration retrieval for AshAuthentication.
  """
  require Logger
  use AshAuthentication.Secret

  def secret_for(
        [:authentication, :tokens, :signing_secret],
        Streampai.Accounts.User,
        _opts,
        _context
      ) do
    Application.fetch_env(:streampai, :token_signing_secret)
  end

  def secret_for(
        [:authentication, :strategies, :google, :client_id],
        Streampai.Accounts.User,
        _opts,
        _context
      ),
      do: Application.fetch_env(:streampai, :google_client_id)

  def secret_for(
        [:authentication, :strategies, :google, :client_secret],
        Streampai.Accounts.User,
        _opts,
        _context
      ),
      do: Application.fetch_env(:streampai, :google_client_secret)

  def secret_for(
        [:authentication, :strategies, :google, :redirect_uri],
        Streampai.Accounts.User,
        _opts,
        _context
      ),
      do: Application.fetch_env(:streampai, :google_redirect_uri)

  def secret_for(
        [:authentication, :strategies, :twitch, :client_id],
        Streampai.Accounts.User,
        _opts,
        _context
      ),
      do: Application.fetch_env(:streampai, :twitch_client_id)

  def secret_for(
        [:authentication, :strategies, :twitch, :client_secret],
        Streampai.Accounts.User,
        _opts,
        _context
      ),
      do: Application.fetch_env(:streampai, :twitch_client_secret) |> dbg

  def secret_for(
        [:authentication, :strategies, :twitch, :redirect_uri],
        Streampai.Accounts.User,
        _opts,
        _context
      ),
      do: Application.fetch_env(:streampai, :twitch_redirect_uri)
end
