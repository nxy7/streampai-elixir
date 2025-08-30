defmodule Streampai.Accounts.User.Senders.SendNewUserConfirmationEmail do
  @moduledoc """
  Sends an email for a new user to confirm their email address.
  """

  use AshAuthentication.Sender
  use StreampaiWeb, :verified_routes

  @impl true
  if Mix.env() == :test do
    def send(_user, _token, _), do: :ok
  else
    def send(_user, token, _) do
      # Example of how you might send this email
      # Streampai.Accounts.Emails.send_new_user_confirmation_email(
      #   user,
      #   token
      # )

      IO.puts("""
      Click this link to confirm your email:

      #{url(~p"/auth/user/confirm_new_user?#{[confirm: token]}")}
      """)
    end
  end
end
