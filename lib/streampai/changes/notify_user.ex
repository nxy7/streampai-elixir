defmodule Streampai.Changes.NotifyUser do
  @moduledoc """
  Reusable Ash change module for creating user notifications after actions.

  ## Usage

  Add to any Ash action to send a notification after the action completes:

      # Static message to a field on the record
      change {Streampai.Changes.NotifyUser,
        to: :invitee_id,
        message: "You've been invited to be a moderator"
      }

      # Dynamic recipient using a function
      change {Streampai.Changes.NotifyUser,
        to: fn record, _context -> record.inviter_id end,
        message: "Someone accepted your invitation"
      }

      # Dynamic message using a function
      change {Streampai.Changes.NotifyUser,
        to: :user_id,
        message: fn record, context ->
          "\#{context.actor.name} commented on your post"
        end
      }

  ## Options

  * `:to` - (required) The recipient user ID. Can be:
    - An atom representing a field on the record (e.g., `:invitee_id`)
    - A function `(record, context) -> user_id` for dynamic resolution

  * `:message` - (required) The notification content. Can be:
    - A string for static messages
    - A function `(record, context) -> string` for dynamic messages
  """
  use Ash.Resource.Change

  alias Streampai.Notifications.Notification

  @impl true
  def change(changeset, opts, context) do
    to = Keyword.fetch!(opts, :to)
    message = Keyword.fetch!(opts, :message)

    Ash.Changeset.after_action(changeset, fn _changeset, record ->
      user_id = resolve_recipient(to, record, context)
      content = resolve_message(message, record, context)

      case create_notification(user_id, content) do
        {:ok, _notification} ->
          {:ok, record}

        {:error, error} ->
          require Logger

          Logger.warning("Failed to create notification: #{inspect(error)}")
          {:ok, record}
      end
    end)
  end

  defp resolve_recipient(field, record, _context) when is_atom(field) do
    Map.get(record, field)
  end

  defp resolve_recipient(fun, record, context) when is_function(fun, 2) do
    fun.(record, context)
  end

  defp resolve_message(message, _record, _context) when is_binary(message) do
    message
  end

  defp resolve_message(fun, record, context) when is_function(fun, 2) do
    fun.(record, context)
  end

  defp create_notification(nil, _content) do
    {:ok, nil}
  end

  defp create_notification(user_id, content) do
    Notification
    |> Ash.Changeset.for_create(:create, %{user_id: user_id, content: content}, authorize?: false)
    |> Ash.create()
  end
end
