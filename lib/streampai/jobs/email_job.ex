defmodule Streampai.Jobs.EmailJob do
  @moduledoc """
  Oban job for sending emails asynchronously.

  Benefits:
  - Non-blocking: Doesn't slow down request handling
  - Automatic retries: Failed emails are retried with backoff
  - Persistence: Survives app restarts
  - Observability: Track email status in Oban dashboard

  Usage:
      Streampai.Jobs.EmailJob.enqueue(:welcome, user_id: user.id)
      Streampai.Jobs.EmailJob.enqueue(:confirmation, user_id: user.id, token: token)
      Streampai.Jobs.EmailJob.enqueue(:password_reset, user_id: user.id, token: token)
      Streampai.Jobs.EmailJob.enqueue(:newsletter, email: "user@example.com")
  """
  use Oban.Worker,
    queue: :emails,
    max_attempts: 5,
    tags: ["email"]

  alias Streampai.Accounts.User
  alias Streampai.Emails.Templates
  alias Streampai.Mailer
  alias Swoosh.Email

  require Logger

  @from_name "Streampai"
  @from_email "noreply@streampai.com"

  @doc """
  Enqueues an email job.

  ## Examples

      EmailJob.enqueue(:welcome, user_id: user.id)
      EmailJob.enqueue(:confirmation, user_id: user.id, token: "abc123")
      EmailJob.enqueue(:password_reset, user_id: user.id, token: "abc123")
      EmailJob.enqueue(:newsletter, email: "user@example.com")
  """
  def enqueue(email_type, opts) do
    %{type: email_type, opts: Map.new(opts)}
    |> new()
    |> Oban.insert()
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"type" => type, "opts" => opts}}) do
    case send_email(type, opts) do
      {:ok, _} ->
        Logger.info("Email sent successfully", type: type, opts: sanitize_opts(opts))
        :ok

      {:error, reason} ->
        Logger.error("Failed to send email", type: type, reason: inspect(reason))
        {:error, reason}
    end
  end

  defp send_email("welcome", %{"user_id" => user_id}) do
    with {:ok, user} <- fetch_user(user_id) do
      Email.new()
      |> Email.to({user.name || user.email, user.email})
      |> Email.from({@from_name, @from_email})
      |> Email.subject("Welcome to Streampai!")
      |> Email.html_body(Templates.welcome_html(user))
      |> Email.text_body(Templates.welcome_text(user))
      |> Mailer.deliver_gracefully()
    end
  end

  defp send_email("confirmation", %{"user_id" => user_id, "token" => token}) do
    with {:ok, user} <- fetch_user(user_id) do
      confirm_url = build_confirm_url(token)

      Email.new()
      |> Email.to({user.name || user.email, user.email})
      |> Email.from({@from_name, @from_email})
      |> Email.subject("Confirm your Streampai account")
      |> Email.html_body(Templates.confirm_email_html(user, confirm_url))
      |> Email.text_body(Templates.confirm_email_text(user, confirm_url))
      |> Mailer.deliver_gracefully()
    end
  end

  defp send_email("password_reset", %{"user_id" => user_id, "token" => token}) do
    with {:ok, user} <- fetch_user(user_id) do
      reset_url = build_password_reset_url(token)

      Email.new()
      |> Email.to({user.name || user.email, user.email})
      |> Email.from({@from_name, @from_email})
      |> Email.subject("Reset your Streampai password")
      |> Email.html_body(Templates.password_reset_html(user, reset_url))
      |> Email.text_body(Templates.password_reset_text(user, reset_url))
      |> Mailer.deliver_gracefully()
    end
  end

  defp send_email("newsletter", %{"email" => email}) do
    Email.new()
    |> Email.to(email)
    |> Email.from({@from_name, @from_email})
    |> Email.subject("You're subscribed to Streampai updates!")
    |> Email.html_body(Templates.newsletter_confirmation_html(email))
    |> Email.text_body(Templates.newsletter_confirmation_text(email))
    |> Mailer.deliver_gracefully()
  end

  defp send_email(type, opts) do
    {:error, "Unknown email type: #{type} with opts: #{inspect(opts)}"}
  end

  defp fetch_user(user_id) do
    case Ash.get(User, user_id) do
      {:ok, user} -> {:ok, user}
      {:error, _} -> {:error, "User not found: #{user_id}"}
    end
  end

  defp build_confirm_url(token) do
    backend_url = Application.get_env(:streampai, :backend_url, "http://localhost:4000")
    "#{backend_url}/api/auth/user/confirm_new_user?confirm=#{token}"
  end

  defp build_password_reset_url(token) do
    frontend_url = Application.get_env(:streampai, :frontend_url, "http://localhost:3000")
    "#{frontend_url}/auth/reset-password?token=#{token}"
  end

  # Remove sensitive data from logs
  defp sanitize_opts(opts) do
    opts
    |> Map.delete("token")
    |> Map.update("email", "[redacted]", fn _ -> "[redacted]" end)
  end
end
