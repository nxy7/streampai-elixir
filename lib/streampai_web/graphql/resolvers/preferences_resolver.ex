defmodule StreampaiWeb.GraphQL.Resolvers.PreferencesResolver do
  @moduledoc """
  GraphQL resolver for user preferences operations.
  Preferences are now stored directly on the User resource.
  """

  alias Streampai.Accounts.User

  def save_donation_settings(_parent, args, resolution) do
    actor = resolution.context[:actor]

    if actor do
      case User.update_donation_settings(
             actor,
             args[:min_amount],
             args[:max_amount],
             args[:currency],
             args[:default_voice],
             actor: actor
           ) do
        {:ok, user} ->
          {:ok, user_to_preferences_format(user)}

        {:error, error} ->
          {:error, format_error(error)}
      end
    else
      {:error, "Not authenticated"}
    end
  end

  def toggle_email_notifications(_parent, _args, resolution) do
    actor = resolution.context[:actor]

    if actor do
      case User.toggle_email_notifications(actor, actor: actor) do
        {:ok, user} ->
          {:ok, user_to_preferences_format(user)}

        {:error, error} ->
          {:error, format_error(error)}
      end
    else
      {:error, "Not authenticated"}
    end
  end

  defp user_to_preferences_format(user) do
    %{
      user_id: user.id,
      email_notifications: user.email_notifications,
      min_donation_amount: user.min_donation_amount,
      max_donation_amount: user.max_donation_amount,
      donation_currency: user.donation_currency,
      default_voice: user.default_voice,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at
    }
  end

  defp format_error(%Ash.Error.Invalid{} = error) do
    Enum.map_join(error.errors, ", ", fn e -> e.message end)
  end

  defp format_error(error) when is_binary(error), do: error
  defp format_error(error), do: inspect(error)
end
