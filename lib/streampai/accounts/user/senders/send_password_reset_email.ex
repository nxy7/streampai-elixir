defmodule Streampai.Accounts.User.Senders.SendPasswordResetEmail do
  @moduledoc """
  Sends a password reset email
  """

  use AshAuthentication.Sender
  use StreampaiWeb, :verified_routes

  @frontend_url Application.compile_env(:streampai, :frontend_url, "http://localhost:3000")

  @impl true
  def send(_user, token, _) do
    frontend_url = Application.get_env(:streampai, :frontend_url, @frontend_url)

    IO.puts("""
    Click this link to reset your password:

    #{frontend_url}/auth/reset-password?token=#{token}
    """)
  end
end
