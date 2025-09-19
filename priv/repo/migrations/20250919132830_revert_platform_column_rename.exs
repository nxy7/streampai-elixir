defmodule Streampai.Repo.Migrations.RevertPlatformColumnRename do
  use Ecto.Migration

  def change do
    # Revert platform column name back to just "platform"
    rename table(:chat_messages), :sender_platform, to: :platform
  end
end
