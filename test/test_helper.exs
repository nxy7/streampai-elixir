ExUnit.start()
Mneme.start()
Ecto.Adapters.SQL.Sandbox.mode(Streampai.Repo, :manual)

# Define Mox mocks
Mox.defmock(Streampai.Cloudflare.APIClientMock, for: Streampai.Cloudflare.APIClientBehaviour)

# Configure test environment for livestream manager
Application.put_env(:streampai, :test_mode, true)
Application.put_env(:streampai, :livestream_test_mode, true)

# Start the state machine registry globally for all tests
# This prevents race conditions between test files
{:ok, _} = Registry.start_link(keys: :unique, name: :livestream_state_machine_registry)

# Ensure the circuit breaker ETS table exists for all tests
Streampai.LivestreamManager.CircuitBreaker.ensure_table()

# Supertester configuration for OTP testing
# Provides zero-sleep synchronization and test isolation
Application.put_env(:supertester, :default_timeout, 5_000)
Application.put_env(:supertester, :sync_timeout, 1_000)

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
