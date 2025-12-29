defmodule Streampai.Accounts.WidgetConfig.Changes.BroadcastConfigUpdate do
  @moduledoc """
  Broadcasts widget config updates via PubSub to notify interested GenServers
  (like AlertManager, TimerManager) of configuration changes in real-time.
  """

  use Ash.Resource.Change

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, record ->
      Phoenix.PubSub.broadcast(
        Streampai.PubSub,
        "widget_config:#{record.type}:#{record.user_id}",
        %{config: record.config, type: record.type}
      )

      {:ok, record}
    end)
  end
end
