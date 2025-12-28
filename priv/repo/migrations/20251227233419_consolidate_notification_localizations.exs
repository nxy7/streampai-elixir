defmodule Streampai.Repo.Migrations.ConsolidateNotificationLocalizations do
  @moduledoc """
  Consolidates notification localizations from separate table into columns.
  """

  use Ecto.Migration

  def up do
    alter table(:notifications) do
      add :content_de, :text
      add :content_pl, :text
      add :content_es, :text
    end

    drop table(:notification_localizations)
  end

  def down do
    create table(:notification_localizations, primary_key: false) do
      add :id, :uuid, null: false, primary_key: true

      add :notification_id, references(:notifications, type: :uuid, on_delete: :delete_all),
        null: false

      add :locale, :text, null: false
      add :content, :text, null: false
      add :inserted_at, :utc_datetime_usec, null: false, default: fragment("now()")
    end

    create unique_index(:notification_localizations, [:notification_id, :locale])

    alter table(:notifications) do
      remove :content_es
      remove :content_pl
      remove :content_de
    end
  end
end
