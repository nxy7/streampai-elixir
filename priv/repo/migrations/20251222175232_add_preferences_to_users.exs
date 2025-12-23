defmodule Streampai.Repo.Migrations.AddPreferencesToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :email_notifications, :boolean, null: false, default: true
      add :min_donation_amount, :integer
      add :max_donation_amount, :integer
      add :donation_currency, :string, null: false, default: "USD"
      add :default_voice, :string
    end

    # Migrate existing data from user_preferences to users
    execute(
      """
      UPDATE users
      SET
        email_notifications = COALESCE(up.email_notifications, true),
        min_donation_amount = up.min_donation_amount,
        max_donation_amount = up.max_donation_amount,
        donation_currency = COALESCE(up.donation_currency, 'USD'),
        default_voice = up.default_voice
      FROM user_preferences up
      WHERE users.id = up.user_id
      """,
      ""
    )
  end
end
