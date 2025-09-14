defmodule Streampai.LivestreamManager.Platforms.YouTube.Supervisor do
  @moduledoc false
  use Supervisor

  require Logger

  def start_link(init_arg) do
    user_id = Keyword.fetch!(init_arg, :user_id)
    name = via_tuple(user_id)
    Supervisor.start_link(__MODULE__, init_arg, name: name)
  end

  @impl true
  def init(init_arg) do
    user_id = Keyword.fetch!(init_arg, :user_id)
    config = Keyword.fetch!(init_arg, :config)

    children = [
      {Streampai.LivestreamManager.Platforms.YouTubeManager, {user_id, config}},
      {Streampai.LivestreamManager.Platforms.YouTube.ChatMonitor, user_id: user_id},
      {Streampai.LivestreamManager.Platforms.YouTube.MetricsMonitor, user_id: user_id}
    ]

    Supervisor.init(children, strategy: :one_for_one, max_restarts: 3, max_seconds: 5)
  end

  def stop(user_id) do
    case Process.whereis(via_tuple(user_id)) do
      nil ->
        :ok

      pid ->
        Supervisor.stop(pid, :normal)
    end
  end

  defp via_tuple(user_id) do
    registry_name = get_registry_name()
    {:via, Registry, {registry_name, {:youtube_supervisor, user_id}}}
  end

  defp get_registry_name do
    if Application.get_env(:streampai, :test_mode, false) do
      case Process.get(:test_registry_name) do
        nil -> Streampai.LivestreamManager.Registry
        test_registry -> test_registry
      end
    else
      Streampai.LivestreamManager.Registry
    end
  end
end
