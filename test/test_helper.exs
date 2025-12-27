ExUnit.start()
Mneme.start()
Ecto.Adapters.SQL.Sandbox.mode(Streampai.Repo, :manual)

# Configure test environment for livestream manager
Application.put_env(:streampai, :test_mode, true)
Application.put_env(:streampai, :livestream_test_mode, true)

# Property-based testing configuration
if Code.ensure_loaded?(ExUnitProperties) do
  # ExUnitProperties.start()

  # Configure property test settings
  # ExUnitProperties.configure(
  #   max_runs: System.get_env("PROPERTY_TEST_MAX_RUNS", "100") |> String.to_integer(),
  #   max_shrinking_steps: 100
  # )
end

# Test timeouts and configuration
ExUnit.configure(
  timeout: 10_000,
  exclude: [
    # Exclude load tests by default
    :load_test,
    # Exclude performance tests by default
    :performance,
    # Exclude slow tests by default
    :slow,
    # Exclude external integration tests by default (require credentials)
    :external,
    # Exclude integration tests that require frontend routes
    :integration
  ]
)
