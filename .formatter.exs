[
  import_deps: [
    # :ash_typescript,  # Removing during GraphQL migration
    :ash_ai,
    :ash_events,
    :ash_state_machine,
    :ash_oban,
    :oban,
    :ash_phoenix,
    :reactor,
    :mneme,
    :ash_authentication_phoenix,
    :ash_authentication,
    :ash_admin,
    :ash_postgres,
    :ash,
    :ecto,
    :ecto_sql,
    :phoenix
  ],
  subdirectories: ["priv/*/migrations"],
  plugins: [Spark.Formatter, Phoenix.LiveView.HTMLFormatter, Styler],
  inputs: ["*.{heex,ex,exs}", "{config,lib,test}/**/*.{heex,ex,exs}", "priv/*/seeds.exs"]
]
