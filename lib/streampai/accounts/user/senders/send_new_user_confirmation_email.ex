defmodule Streampai.Accounts.User.Senders.SendNewUserConfirmationEmail do
  @moduledoc """
  Sends an email for a new user to confirm their email address.
  """

  use AshAuthentication.Sender

  alias Streampai.Emails

  require Logger

  @impl true
  if Mix.env() == :test do
    def send(_user, _token, _), do: :ok
  else
    def send(user, token, _) do
      Emails.send_new_user_confirmation_email(user, token)
    end
  end
end
