defmodule Streampai.Application do
  @moduledoc false
  use Application

  require Logger

  @impl true
  def start(_type, _args) do
    Logger.info("streampai startup")

    # OpenTelemetry auto-instrumentation setup
    OpentelemetryBandit.setup()
    OpentelemetryPhoenix.setup(adapter: :bandit)
    OpentelemetryEcto.setup([:streampai, :repo])
    OpentelemetryOban.setup()

    # Initialize ETS tables
    :ets.new(:rate_limiter, [:set, :public, :named_table])
    :ets.new(:streampai_errors, [:named_table, :public, :set, {:read_concurrency, true}])

    if System.get_env("PHX_SERVER") do
      run_migrations()
    end

    # Start Nostrum only if Discord is configured
    maybe_start_nostrum()

    children =
      Enum.reject(
        [
          StreampaiWeb.Telemetry,
          StreampaiWeb.PromEx,
          Streampai.Repo,
          Streampai.Vault,
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
          {Registry, keys: :unique, name: Streampai.Integrations.Discord.BotRegistry},
          Streampai.Integrations.Discord.BotManager,
          maybe_whisper_serving(),
          {StreampaiWeb.Endpoint, phoenix_sync: Phoenix.Sync.plug_opts()}
        ],
        &is_nil/1
      )

    # Discord bot integration
    # Bumblebee Whisper serving for transcription (nil when disabled)
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

  defp maybe_whisper_serving do
    if Application.get_env(:streampai, :transcription_enabled, false) do
      model = Application.get_env(:streampai, :transcription_model, "openai/whisper-tiny")
      Logger.info("Starting Bumblebee Whisper serving with model: #{model}")

      {Nx.Serving,
       serving: build_whisper_serving(model), name: Streampai.WhisperServing, batch_size: 1, batch_timeout: 100}
    end
  end

  defp build_whisper_serving(model_name) do
    {:ok, whisper} = Bumblebee.load_model({:hf, model_name})
    {:ok, featurizer} = Bumblebee.load_featurizer({:hf, model_name})
    {:ok, tokenizer} = Bumblebee.load_tokenizer({:hf, model_name})
    {:ok, generation_config} = Bumblebee.load_generation_config({:hf, model_name})

    language = Application.get_env(:streampai, :transcription_language)

    Bumblebee.Audio.speech_to_text_whisper(whisper, featurizer, tokenizer, generation_config,
      chunk_num_seconds: 30,
      timestamps: :segments,
      language: language,
      task: :transcribe
    )
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
