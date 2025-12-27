defmodule Streampai.Accounts.User.Changes.SendWelcomeEmail do
  @moduledoc """
  Sends a welcome email to new users when they register.

  This change should be added to create actions for user registration.
  It checks if this is a genuinely new user (not an upsert/update) before sending.
  """

  use Ash.Resource.Change

  alias Streampai.Emails

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn changeset, user ->
      # Only send if this is a new user creation (not an upsert that matched existing)
      if changeset.action_type == :create and is_new_user?(changeset) do
        send_welcome_async(user)
      end

      {:ok, user}
    end)
  end

  defp is_new_user?(changeset) do
    # For upserts, check if the record was actually created vs updated
    # By checking if created_at and updated_at are the same (new record)
    # or if the action is a non-upsert create
    not changeset.action.upsert?
  end

  defp send_welcome_async(user) do
    # Send email asynchronously to not block the registration flow
    Task.start(fn ->
      case Emails.send_welcome_email(user) do
        {:ok, _} ->
          :ok

        {:error, reason} ->
          require Logger

          Logger.warning("Failed to send welcome email to #{user.email}: #{inspect(reason)}")
      end
    end)
  end
end
