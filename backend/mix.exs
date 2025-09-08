defmodule Streampai.MixProject do
  use Mix.Project

  def project do
    [
      app: :streampai,
      version: "0.1.1",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      listeners: [Phoenix.CodeReloader],
      start_permanent: Mix.env() == :prod,
      consolidate_protocols: Mix.env() != :dev,
      aliases: aliases(),
      deps: deps(),
      releases: releases(),
      preferred_cli_env: ["mneme.test": :test, "mneme.watch": :test]
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
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

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:live_vue, "~> 0.7"},
      {:ex_money_sql, "~> 1.0"},
      {:ex_cldr, "~> 2.0"},
      {:usage_rules, "~> 0.1"},
      {:sourceror, "~> 1.8"},
      {:oban, "~> 2.0"},
      {:ash_money, "~> 0.2"},
      {:ash_ai, "~> 0.2"},
      {:tidewave, "~> 0.4", only: [:dev]},
      {:live_debugger, "~> 0.4", only: [:dev]},
      {:ash_events, "~> 0.4"},
      {:ash_state_machine, "~> 0.2"},
      {:oban_web, "~> 2.0"},
      {:ash_oban, "~> 0.4"},
      {:uuid, "~> 1.1"},
      {:bcrypt_elixir, "~> 3.0"},
      {:ash_admin, "~> 0.13"},
      {:req, "~> 0.5.10"},
      {:lazy_html, ">= 0.1.0", only: :test},
      {:picosat_elixir, "~> 0.2"},
      {:ash_phoenix, "~> 2.0"},
      {:ash_postgres, "~> 2.0"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:ash_authentication, "~> 4.0"},
      # {:ash_authentication_phoenix, "~> 2.10"},
      {:ash_authentication_phoenix, path: "../patches/ash_authentication_phoenix", override: true},
      {:ash, "~> 3.0"},
      {:igniter, "~> 0.6", override: true},
      {:phoenix, "~> 1.8.1"},
      {:phoenix_html, "~> 4.2"},
      {:phoenix_live_reload, "~> 1.6", only: :dev},
      {:phoenix_live_view, "~> 1.1.8", override: true},
      {:assent, "~> 0.2.9"},
      {:ueberauth, "~> 0.10"},
      {:ueberauth_github, "~> 0.8"},
      {:ueberauth_google, "~> 0.10"},
      {:ueberauth_twitch, "~> 0.2"},
      {:certifi, "~> 2.4"},
      {:ssl_verify_fun, "~> 1.1"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.10"},
      {:dotenvy, "~> 0.9.0", only: [:dev, :test]},
      {:postgrex, ">= 0.0.0"},
      {:floki, ">= 0.30.0"},
      {:rewrite, "~> 1.1", override: true},
      {:mneme, "~> 0.10.1", only: [:test, :dev]},
      {:phoenix_live_dashboard, "~> 0.8.3"},
      {:smokestack, "~> 0.9.2"},
      {:heroicons,
       github: "tailwindlabs/heroicons",
       tag: "v2.1.1",
       sparse: "optimized",
       app: false,
       compile: false,
       depth: 1},
      {:swoosh, "~> 1.5"},
      {:finch, "~> 0.13"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.20"},
      {:jason, "~> 1.2"},
      {:bandit, "~> 1.5"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
      start: ["phx.server"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ash.setup --quiet", "test"],
      "assets.setup": ["cmd --cd assets npm install"],
      "assets.build": [
        "cmd --cd assets npm run build",
        "cmd --cd assets npm run build-server"
      ],
      "assets.deploy": [
        "cmd --cd assets npm run build",
        "cmd --cd assets npm run build-server",
        "phx.digest"
      ],
      "ash.setup": ["ash.setup", "run priv/repo/seeds.exs"]
    ]
  end

  defp releases do
    [
      streampai: [
        include_executables_for: [:unix],
        applications: [runtime_tools: :permanent],
        steps: [:assemble, :tar]
      ]
    ]
  end
end
