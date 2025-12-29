defmodule Streampai.Emails do
  @moduledoc """
  Email delivery module for Streampai.

  Emails are sent asynchronously via Oban jobs for reliability and non-blocking behavior.
  In development, emails are captured by the local adapter and viewable at /dev/mailbox.

  ## Usage

      # Send welcome email (async via Oban)
      Streampai.Emails.send_welcome_email(user)

      # Send confirmation email (async via Oban)
      Streampai.Emails.send_new_user_confirmation_email(user, token)

      # Send password reset email (async via Oban)
      Streampai.Emails.send_password_reset_email(user, token)
  """

  alias Streampai.Jobs.EmailJob

  @doc """
  Enqueues a welcome email to be sent to a new user.
  """
  def send_welcome_email(user) do
    EmailJob.enqueue(:welcome, user_id: user.id)
  end

  @doc """
  Enqueues a confirmation email for newsletter signup.
  """
  def send_newsletter_confirmation_email(email) do
    EmailJob.enqueue(:newsletter, email: email)
  end

  @doc """
  Enqueues a new user confirmation email (for email verification).
  """
  def send_new_user_confirmation_email(user, token) do
    EmailJob.enqueue(:confirmation, user_id: user.id, token: token)
  end

  @doc """
  Enqueues a password reset email.
  """
  def send_password_reset_email(user, token) do
    EmailJob.enqueue(:password_reset, user_id: user.id, token: token)
  end
end
