defmodule Streampai.Mailer do
  @moduledoc """
  Email delivery module using Swoosh.

  In development, uses Local adapter (viewable at /dev/mailbox).
  In production, uses Resend if RESEND_API_KEY is set, otherwise logs a warning.
  """
  use Swoosh.Mailer, otp_app: :streampai

  require Logger

  @doc """
  Delivers an email gracefully, logging errors instead of crashing.
  Returns {:ok, email} on success or {:error, reason} on failure.
  """
  def deliver_gracefully(email) do
    case deliver(email) do
      {:ok, _} = success ->
        success

      {:error, reason} = error ->
        Logger.warning("Failed to deliver email to #{inspect(email.to)}: #{inspect(reason)}")
        error
    end
  rescue
    e ->
      Logger.error("Email delivery crashed: #{inspect(e)}")
      {:error, e}
  catch
    :exit, reason ->
      Logger.error("Email delivery exited: #{inspect(reason)}")
      {:error, reason}
  end
end
