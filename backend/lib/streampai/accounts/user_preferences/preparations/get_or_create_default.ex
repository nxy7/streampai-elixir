defmodule Streampai.Accounts.UserPreferences.Preparations.GetOrCreateDefault do
  @moduledoc """
  Provides default user preferences when none exist in the database.
  Creates a default record with standard values if no preferences are found for the user.
  """

  use Ash.Resource.Preparation

  @impl true
  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, results ->
      case results do
        [] ->
          default_record = %Streampai.Accounts.UserPreferences{
            user_id: Ash.Query.get_argument(query, :user_id),
            email_notifications: true,
            min_donation_amount: nil,
            max_donation_amount: nil,
            donation_currency: "USD"
          }

          {:ok, [default_record]}

        [result] ->
          {:ok, [result]}
      end
    end)
  end
end