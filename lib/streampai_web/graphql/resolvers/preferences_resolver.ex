defmodule StreampaiWeb.GraphQL.Resolvers.PreferencesResolver do
  @moduledoc """
  GraphQL resolver for user preferences operations.
  """

  alias Streampai.Accounts.UserPreferences

  def save_donation_settings(_parent, args, resolution) do
    actor = resolution.context[:actor]

    unless actor do
      {:error, "Not authenticated"}
    else
      case UserPreferences.get_by_user_id(%{user_id: actor.id}, actor: actor) do
        {:ok, preferences} ->
          update_preferences(preferences, args, actor)

        {:error, _} ->
          create_preferences(args, actor)
      end
    end
  end

  def toggle_email_notifications(_parent, _args, resolution) do
    actor = resolution.context[:actor]

    unless actor do
      {:error, "Not authenticated"}
    else
      case UserPreferences.get_by_user_id(%{user_id: actor.id}, actor: actor) do
        {:ok, preferences} ->
          UserPreferences.toggle_email_notifications(preferences, actor: actor)

        {:error, _} ->
          {:error, "Preferences not found"}
      end
    end
  end

  defp update_preferences(preferences, args, actor) do
    case UserPreferences.update_donation_settings(
           preferences,
           args[:min_amount],
           args[:max_amount],
           args[:currency] || "USD",
           actor: actor
         ) do
      {:ok, updated} ->
        if args[:default_voice] do
          UserPreferences.update_voice_settings(updated, args[:default_voice], actor: actor)
        else
          {:ok, updated}
        end

      {:error, error} ->
        {:error, format_error(error)}
    end
  end

  defp create_preferences(args, actor) do
    case UserPreferences.create(
           %{
             user_id: actor.id,
             min_donation_amount: args[:min_amount],
             max_donation_amount: args[:max_amount],
             donation_currency: args[:currency] || "USD",
             default_voice: args[:default_voice]
           },
           actor: actor
         ) do
      {:ok, preferences} ->
        {:ok, preferences}

      {:error, error} ->
        {:error, format_error(error)}
    end
  end

  defp format_error(%Ash.Error.Invalid{} = error) do
    error.errors
    |> Enum.map(fn e -> e.message end)
    |> Enum.join(", ")
  end

  defp format_error(error) when is_binary(error), do: error
  defp format_error(error), do: inspect(error)
end
