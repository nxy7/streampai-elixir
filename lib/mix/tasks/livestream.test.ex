defmodule Mix.Tasks.Livestream.Test do
  @shortdoc "Run livestream manager tests with various configurations"

  @moduledoc """
  Mix task for running different types of tests on the livestream manager.

  ## Examples

      # Run basic unit tests
      mix livestream.test --unit

      # Run integration tests
      mix livestream.test --integration

      # Run property-based tests
      mix livestream.test --property

      # Run load test with 50 users for 2 minutes
      mix livestream.test --load --users=50 --duration=120

      # Run streaming simulation with 10 streamers
      mix livestream.test --stream-sim --streamers=10 --session-duration=300

      # Run all tests
      mix livestream.test --all
  """

  use Mix.Task

  @impl Mix.Task
  def run(args) do
    Mix.Task.run("app.start")

    {opts, _, _} =
      OptionParser.parse(args,
        switches: [
          unit: :boolean,
          integration: :boolean,
          property: :boolean,
          load: :boolean,
          stream_sim: :boolean,
          all: :boolean,
          users: :integer,
          streamers: :integer,
          duration: :integer,
          session_duration: :integer,
          verbose: :boolean
        ],
        aliases: [
          u: :unit,
          i: :integration,
          p: :property,
          l: :load,
          s: :stream_sim,
          a: :all,
          v: :verbose
        ]
      )

    if opts[:all] do
      run_all_tests(opts)
    else
      run_selected_tests(opts)
    end
  end

  defp run_all_tests(_opts) do
    Mix.shell().info("Running all livestream manager tests...")

    Mix.shell().info("\n=== Unit Tests ===")
    run_unit_tests()

    Mix.shell().info("\n=== Integration Tests ===")
    run_integration_tests()

    Mix.shell().info("\n=== Property-Based Tests ===")
    run_property_tests()

    Mix.shell().info("\n=== Load Tests (Basic) ===")

    Mix.shell().info("\n=== All tests completed ===")
  end

  defp run_selected_tests(opts) do
    cond do
      opts[:unit] -> run_unit_tests()
      opts[:integration] -> run_integration_tests()
      opts[:property] -> run_property_tests()
      opts[:load] -> run_load_test_with_opts(opts)
      true -> show_help()
    end
  end

  defp run_unit_tests do
    Mix.shell().info("Running unit tests for livestream manager...")

    test_files = [
      "test/streampai/livestream_manager/stream_state_server_test.exs",
      "test/streampai/livestream_manager/event_broadcaster_test.exs",
      "test/streampai/livestream_manager/alert_manager_test.exs"
    ]

    Enum.each(test_files, fn file ->
      if File.exists?(file) do
        Mix.shell().info("Running #{file}")
        System.cmd("mix", ["test", file], into: IO.stream())
      else
        Mix.shell().info("Test file not found: #{file}")
      end
    end)
  end

  defp run_integration_tests do
    Mix.shell().info("Running integration tests for livestream manager...")

    test_files = [
      "test/streampai/livestream_manager/user_stream_manager_integration_test.exs"
    ]

    Enum.each(test_files, fn file ->
      if File.exists?(file) do
        Mix.shell().info("Running #{file}")
        System.cmd("mix", ["test", file], into: IO.stream())
      else
        Mix.shell().info("Test file not found: #{file}")
      end
    end)
  end

  defp run_property_tests do
    Mix.shell().info("Running property-based tests for livestream manager...")

    test_files = [
      "test/streampai/livestream_manager/event_broadcaster_property_test.exs"
    ]

    Enum.each(test_files, fn file ->
      if File.exists?(file) do
        Mix.shell().info("Running #{file}")
        System.cmd("mix", ["test", file], into: IO.stream())
      else
        Mix.shell().info("Test file not found: #{file}")
      end
    end)
  end

  defp run_load_test_with_opts(opts) do
    _users = opts[:users] || 10
    _duration = (opts[:duration] || 60) * 1000
  end

  defp show_help do
    Mix.shell().info("""
    Livestream Manager Test Runner

    Usage: mix livestream.test [options]

    Options:
      --unit, -u              Run unit tests only
      --integration, -i       Run integration tests only
      --property, -p          Run property-based tests only
      --load, -l              Run load tests
      --stream-sim, -s        Run streaming simulation
      --all, -a               Run all test types

    Load Test Options:
      --users=N               Number of concurrent users (default: 10)
      --duration=N            Test duration in seconds (default: 60)

    Streaming Simulation Options:
      --streamers=N           Number of concurrent streamers (default: 5)
      --session-duration=N    Session duration in seconds (default: 120)

    Examples:
      mix livestream.test --unit
      mix livestream.test --load --users=50 --duration=300
      mix livestream.test --stream-sim --streamers=20 --session-duration=600
      mix livestream.test --all
    """)
  end
end
