defmodule Streampai.Accounts.User.Senders.SendPasswordResetEmail do
  @moduledoc """
  Sends a password reset email
  """

  use AshAuthentication.Sender

  alias Streampai.Emails

  @impl true
  def send(user, token, _) do
    Emails.send_password_reset_email(user, token)
  end
end
