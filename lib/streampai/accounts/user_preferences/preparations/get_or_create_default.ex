defmodule Streampai.Accounts.UserPreferences.Preparations.GetOrCreateDefault do
  @moduledoc """
  Provides default user preferences when none exist in the database.
  Creates a default record with standard values if no preferences are found for the user.
  """

  use Ash.Resource.Preparation

  alias Streampai.Accounts.UserPreferences

  @impl true
  # Create the record in the database if it doesn't exist
  # If creation fails (race condition), try reading again
  # This handles the case where another process created it between our read and create
  def prepare(query, _opts, context),
    do:
      Ash.Query.after_action(query, fn _query, results ->
        case results do
          [] ->
            user_id = Ash.Query.get_argument(query, :user_id)
            actor = context.actor

            case UserPreferences.create(
                   %{
                     user_id: user_id,
                     email_notifications: true,
                     min_donation_amount: nil,
                     max_donation_amount: nil,
                     donation_currency: "USD"
                   }, actor: actor) do
              {:ok, created} ->
                {:ok, [created]}

              {:error, _error} ->
                case UserPreferences |> Ash.Query.filter(user_id == ^user_id) |> Ash.read(actor: actor) do
                  {:ok, [existing]} -> {:ok, [existing]}
                  {:ok, []} -> {:ok, []}
                  {:error, error} -> {:error, error}
                end
            end

          [result] ->
            {:ok, [result]}
        end
      end)
end
