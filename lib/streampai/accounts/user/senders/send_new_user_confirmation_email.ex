defmodule Streampai.Accounts.User.Senders.SendNewUserConfirmationEmail do
  @moduledoc """
  Sends an email for a new user to confirm their email address.
  """

  use AshAuthentication.Sender

  require Logger

  @impl true
  if Mix.env() == :test do
    def send(_user, _token, _), do: :ok
  else
    def send(user, token, _) do
      # Skip confirmation email for OAuth users - they're already verified by the provider
      # and their confirmed_at is set automatically during registration
      if user.confirmed_at do
        Logger.debug("Skipping confirmation email for already-confirmed user #{user.id}")
        :ok
      else
        Streampai.Emails.send_new_user_confirmation_email(user, token)
      end
    end
  end
end
