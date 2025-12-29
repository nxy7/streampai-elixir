defmodule Streampai.MixProject do
  use Mix.Project

  def project do
    [
      app: :streampai,
      version: "0.3.1",
      elixir: "~> 1.19",
      elixirc_paths: elixirc_paths(Mix.env()),
      listeners: [Phoenix.CodeReloader],
      start_permanent: Mix.env() == :prod,
      consolidate_protocols: Mix.env() != :dev,
      aliases: aliases(),
      deps: deps(),
      releases: releases()
    ]
  end

  def cli do
    [preferred_envs: ["mneme.test": :test, "mneme.watch": :test]]
  end

  def application do
    [
      mod: {Streampai.Application, []},
      extra_applications: [
        :logger,
        :runtime_tools,
        :inets
      ]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:styler, "~> 1.8", only: [:dev, :test], runtime: false},
      {:ex_money_sql, "~> 1.0"},
      {:ex_cldr, "~> 2.0"},
      {:usage_rules, "~> 0.1"},
      {:oban, "~> 2.0"},
      {:ash_money, "~> 0.2"},
      {:ash_ai, "~> 0.2"},
      {:tidewave, "~> 0.4", only: [:dev]},
      {:ash_events, "~> 0.4"},
      {:ash_state_machine, "~> 0.2"},
      {:oban_web, "~> 2.0"},
      {:ash_oban, "~> 0.4"},
      {:uuid, "~> 1.1"},
      {:bcrypt_elixir, "~> 3.0"},
      {:ash_admin, "~> 0.13"},
      {:req, "~> 0.5.10"},
      {:picosat_elixir, "~> 0.2"},
      {:ash_phoenix, "~> 2.0"},
      {:ash_postgres, "~> 2.0"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:ash_authentication, "~> 4.0"},
      {:ash_authentication_phoenix, "~> 2.10"},
      {:ash, "~> 3.0"},
      {:ash_typescript, "~> 0.2"},
      {:igniter, "~> 0.6", override: true},
      {:phoenix, "~> 1.8.1"},
      {:phoenix_html, "~> 4.2"},
      {:phoenix_live_view, "~> 1.1.8", override: true},
      {:ueberauth, "~> 0.10"},
      {:ueberauth_google, "~> 0.10"},
      {:ueberauth_twitch, "~> 0.2"},
      {:certifi, "~> 2.4"},
      {:ssl_verify_fun, "~> 1.1"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.10"},
      {:dotenvy, "~> 1.1.0"},
      {:postgrex, ">= 0.0.0"},
      {:mneme, "~> 0.10.1", only: [:test, :dev]},
      {:swoosh, "~> 1.5"},
      {:finch, "~> 0.13"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.26"},
      {:jason, "~> 1.2"},
      {:bandit, "~> 1.5"},
      {:grpc, "~> 0.10"},
      {:protobuf, "~> 0.12"},
      {:protobuf_generate, "~> 0.1.0"},
      {:ex_aws, "~> 2.5"},
      {:ex_aws_s3, "~> 2.5"},
      {:hackney, "~> 1.18"},
      {:sweet_xml, "~> 0.7"},
      {:electric, "~> 1.0"},
      {:phoenix_sync, "== 0.6.0"},
      # Discord bot integration for full bot functionality (join servers, list channels, send messages)
      # runtime: false prevents auto-start; we start it manually when DISCORD_BOT_TOKEN is configured
      {:nostrum, "~> 0.10", runtime: false}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      start: ["phx.server"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ash.setup --quiet", "test"],
      "ash.setup": ["ash.setup", "run priv/repo/seeds.exs"]
    ]
  end

  defp releases do
    [
      streampai: [
        include_executables_for: [:unix],
        applications: [runtime_tools: :permanent],
        steps: [:assemble, :tar],
        # Allow overlapping modules from protobuf and protox libraries
        # (electric uses protox, grpc uses protobuf - both define Google.Protobuf.* modules)
        skip_mode_validation_for: [
          Google.Protobuf.Any,
          Google.Protobuf.BoolValue,
          Google.Protobuf.BytesValue,
          Google.Protobuf.DoubleValue,
          Google.Protobuf.Duration,
          Google.Protobuf.Empty,
          Google.Protobuf.FieldMask,
          Google.Protobuf.FloatValue,
          Google.Protobuf.Int32Value,
          Google.Protobuf.Int64Value,
          Google.Protobuf.ListValue,
          Google.Protobuf.NullValue,
          Google.Protobuf.StringValue,
          Google.Protobuf.Struct,
          Google.Protobuf.Timestamp,
          Google.Protobuf.UInt32Value,
          Google.Protobuf.UInt64Value,
          Google.Protobuf.Value
        ]
      ]
    ]
  end
end
