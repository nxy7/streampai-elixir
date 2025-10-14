defmodule Streampai.Repo.Migrations.FixStreamViewerPlatforms do
  @moduledoc """
  Fixes the platform field in stream_viewers by setting it to match
  the platform from their chat messages.
  """

  use Ecto.Migration

  def up do
    # Update stream_viewers platform based on their chat messages
    execute """
    UPDATE stream_viewers sv
    SET platform = (
      SELECT cm.platform
      FROM chat_messages cm
      WHERE cm.viewer_id = sv.viewer_id
        AND cm.user_id = sv.user_id
      ORDER BY cm.inserted_at DESC
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1
      FROM chat_messages cm
      WHERE cm.viewer_id = sv.viewer_id
        AND cm.user_id = sv.user_id
    )
    """
  end

  def down do
    # No need to revert - the data correction is intentional
    :ok
  end
end
