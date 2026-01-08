defmodule Streampai.Application do
  @moduledoc false
  use Application

  require Logger

  @impl true
  def start(_type, _args) do
    Logger.info("streampai startup")

    # Initialize ETS tables
    :ets.new(:rate_limiter, [:set, :public, :named_table])
    :ets.new(:streampai_errors, [:named_table, :public, :set, {:read_concurrency, true}])

    if System.get_env("PHX_SERVER") do
      run_migrations()
    end

    # Start Nostrum only if Discord is configured
    maybe_start_nostrum()

    children = [
      StreampaiWeb.Telemetry,
      Streampai.Repo,
      {Oban,
       AshOban.config(
         Application.fetch_env!(:streampai, :ash_domains),
         Application.fetch_env!(:streampai, Oban)
       )},
      {Phoenix.PubSub, name: Streampai.PubSub},
      StreampaiWeb.Presence,
      {Finch, name: Streampai.Finch},
      {Streampai.LivestreamManager.Supervisor, [name: Streampai.LivestreamManager.Supervisor]},
      {AshAuthentication.Supervisor, [otp_app: :streampai]},
      {Task.Supervisor, name: Streampai.TaskSupervisor},
      {DynamicSupervisor, strategy: :one_for_one, name: GRPC.Client.Supervisor},
      Streampai.Stream.EventPersister,
      Streampai.YouTube.TokenSupervisor,
      # Discord bot integration
      {Registry, keys: :unique, name: Streampai.Integrations.Discord.BotRegistry},
      Streampai.Integrations.Discord.BotManager,
      {StreampaiWeb.Endpoint, phoenix_sync: Phoenix.Sync.plug_opts()}
    ]

    opts = [strategy: :one_for_one, name: Streampai.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp maybe_start_nostrum do
    if Application.get_env(:streampai, :discord_enabled, false) do
      Logger.info("Starting Nostrum (Discord bot)...")

      case Application.ensure_all_started(:nostrum) do
        {:ok, _} -> Logger.info("Nostrum started successfully")
        {:error, reason} -> Logger.warning("Failed to start Nostrum: #{inspect(reason)}")
      end
    else
      Logger.info("Discord bot disabled (DISCORD_BOT_TOKEN not configured)")
    end
  end

  @impl true
  def config_change(changed, _new, removed) do
    StreampaiWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp run_migrations do
    Logger.info("Running migrations...")

    try do
      Streampai.Release.migrate()
      Logger.info("Migrations completed successfully")
    rescue
      error ->
        Logger.error("Migration failed: #{inspect(error)}")
        :ok
    end
  end
end
