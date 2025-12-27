defmodule Streampai.Emails do
  @moduledoc """
  Email delivery module for Streampai.

  Uses Swoosh for composing and sending emails with HTML templates.
  In development, emails are captured by the local adapter and viewable at /dev/mailbox.
  """

  import Swoosh.Email

  alias Streampai.Mailer

  @from_name "Streampai"
  @from_email "noreply@streampai.com"

  @doc """
  Sends a welcome email to a new user.
  """
  def send_welcome_email(user) do
    new()
    |> to({user.display_name || user.email, user.email})
    |> from({@from_name, @from_email})
    |> subject("Welcome to Streampai!")
    |> html_body(welcome_html(user))
    |> text_body(welcome_text(user))
    |> Mailer.deliver()
  end

  @doc """
  Sends a confirmation email for newsletter signup.
  """
  def send_newsletter_confirmation_email(email) do
    new()
    |> to(email)
    |> from({@from_name, @from_email})
    |> subject("You're subscribed to Streampai updates!")
    |> html_body(newsletter_confirmation_html(email))
    |> text_body(newsletter_confirmation_text(email))
    |> Mailer.deliver()
  end

  @doc """
  Sends a new user confirmation email (for email verification).
  """
  def send_new_user_confirmation_email(user, token) do
    confirm_url = build_confirm_url(token)

    new()
    |> to({user.display_name || user.email, user.email})
    |> from({@from_name, @from_email})
    |> subject("Confirm your Streampai account")
    |> html_body(confirm_email_html(user, confirm_url))
    |> text_body(confirm_email_text(user, confirm_url))
    |> Mailer.deliver()
  end

  @doc """
  Sends a password reset email.
  """
  def send_password_reset_email(user, token) do
    reset_url = build_password_reset_url(token)

    new()
    |> to({user.display_name || user.email, user.email})
    |> from({@from_name, @from_email})
    |> subject("Reset your Streampai password")
    |> html_body(password_reset_html(user, reset_url))
    |> text_body(password_reset_text(user, reset_url))
    |> Mailer.deliver()
  end

  # Private functions

  defp build_confirm_url(token) do
    backend_url = Application.get_env(:streampai, :backend_url, "http://localhost:4000")
    "#{backend_url}/api/auth/user/confirm_new_user?confirm=#{token}"
  end

  defp build_password_reset_url(token) do
    frontend_url = Application.get_env(:streampai, :frontend_url, "http://localhost:3000")
    "#{frontend_url}/auth/reset-password?token=#{token}"
  end

  # Email Templates

  defp welcome_html(user) do
    name = user.display_name || "there"

    layout_html("""
    <h1 style="color: #1a1a2e; margin-bottom: 24px;">Welcome to Streampai!</h1>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hey #{name},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      We're thrilled to have you on board! Streampai is your all-in-one platform for
      managing your live streams, engaging with your audience, and growing your channel.
    </p>

    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h2 style="color: white; margin: 0 0 16px 0; font-size: 18px;">Here's what you can do:</h2>
      <ul style="color: white; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Set up beautiful stream widgets</li>
        <li>Manage donations and alerts</li>
        <li>Engage with your chat in real-time</li>
        <li>Track your stream analytics</li>
      </ul>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Ready to get started? Head over to your dashboard and set up your first widget!
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{frontend_url()}/dashboard"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; text-decoration: none; padding: 14px 32px;
                border-radius: 8px; font-weight: 600; font-size: 16px;
                display: inline-block;">
        Go to Dashboard
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 32px;">
      If you have any questions, feel free to reach out. We're here to help!
    </p>
    """)
  end

  defp welcome_text(user) do
    name = user.display_name || "there"

    """
    Welcome to Streampai!

    Hey #{name},

    We're thrilled to have you on board! Streampai is your all-in-one platform for
    managing your live streams, engaging with your audience, and growing your channel.

    Here's what you can do:
    - Set up beautiful stream widgets
    - Manage donations and alerts
    - Engage with your chat in real-time
    - Track your stream analytics

    Ready to get started? Head over to your dashboard:
    #{frontend_url()}/dashboard

    If you have any questions, feel free to reach out. We're here to help!

    - The Streampai Team
    """
  end

  defp newsletter_confirmation_html(email) do
    layout_html("""
    <h1 style="color: #1a1a2e; margin-bottom: 24px;">You're on the list!</h1>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Thanks for subscribing to the Streampai newsletter!
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      You'll now receive updates about:
    </p>

    <ul style="font-size: 16px; line-height: 1.8; color: #333; padding-left: 20px;">
      <li>New features and improvements</li>
      <li>Tips for growing your stream</li>
      <li>Community highlights and success stories</li>
      <li>Exclusive offers for subscribers</li>
    </ul>

    <div style="background: #f4f4f8; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        Subscribed email: <strong style="color: #333;">#{email}</strong>
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 32px;">
      If you didn't sign up for this newsletter, you can safely ignore this email.
    </p>
    """)
  end

  defp newsletter_confirmation_text(email) do
    """
    You're on the list!

    Thanks for subscribing to the Streampai newsletter!

    You'll now receive updates about:
    - New features and improvements
    - Tips for growing your stream
    - Community highlights and success stories
    - Exclusive offers for subscribers

    Subscribed email: #{email}

    If you didn't sign up for this newsletter, you can safely ignore this email.

    - The Streampai Team
    """
  end

  defp confirm_email_html(user, confirm_url) do
    name = user.display_name || "there"

    layout_html("""
    <h1 style="color: #1a1a2e; margin-bottom: 24px;">Confirm your email</h1>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hey #{name},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Thanks for signing up for Streampai! Please confirm your email address to
      activate your account and get started.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{confirm_url}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; text-decoration: none; padding: 14px 32px;
                border-radius: 8px; font-weight: 600; font-size: 16px;
                display: inline-block;">
        Confirm Email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">
      #{confirm_url}
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 32px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    """)
  end

  defp confirm_email_text(user, confirm_url) do
    name = user.display_name || "there"

    """
    Confirm your email

    Hey #{name},

    Thanks for signing up for Streampai! Please confirm your email address to
    activate your account and get started.

    Click this link to confirm your email:
    #{confirm_url}

    If you didn't create an account, you can safely ignore this email.

    - The Streampai Team
    """
  end

  defp password_reset_html(user, reset_url) do
    name = user.display_name || "there"

    layout_html("""
    <h1 style="color: #1a1a2e; margin-bottom: 24px;">Reset your password</h1>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hey #{name},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      We received a request to reset your password. Click the button below to
      choose a new password.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{reset_url}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; text-decoration: none; padding: 14px 32px;
                border-radius: 8px; font-weight: 600; font-size: 16px;
                display: inline-block;">
        Reset Password
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">
      #{reset_url}
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 32px;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>
    """)
  end

  defp password_reset_text(user, reset_url) do
    name = user.display_name || "there"

    """
    Reset your password

    Hey #{name},

    We received a request to reset your password. Click the link below to
    choose a new password:

    #{reset_url}

    If you didn't request a password reset, you can safely ignore this email.
    Your password will remain unchanged.

    - The Streampai Team
    """
  end

  defp frontend_url do
    Application.get_env(:streampai, :frontend_url, "http://localhost:3000")
  end

  defp layout_html(content) do
    """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Streampai</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f8;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Streampai</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  #{content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9fb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                    &copy; #{Date.utc_today().year} Streampai. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #999; font-size: 12px;">
                    You're receiving this email because you signed up for Streampai.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
  end
end
