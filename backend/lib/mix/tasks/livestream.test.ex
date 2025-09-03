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
  alias StreampaiTest.LoadTestFramework

  @impl Mix.Task
  def run(args) do
    Mix.Task.run("app.start")
    
    {opts, _, _} = OptionParser.parse(args,
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

  defp run_all_tests(opts) do
    Mix.shell().info("Running all livestream manager tests...")
    
    # Unit tests
    Mix.shell().info("\n=== Unit Tests ===")
    run_unit_tests()
    
    # Integration tests  
    Mix.shell().info("\n=== Integration Tests ===")
    run_integration_tests()
    
    # Property tests
    Mix.shell().info("\n=== Property-Based Tests ===")
    run_property_tests()
    
    # Load tests (smaller scale for --all)
    Mix.shell().info("\n=== Load Tests (Basic) ===")
    run_load_test(users: 5, duration: 30)
    
    Mix.shell().info("\n=== All tests completed ===")
  end

  defp run_selected_tests(opts) do
    cond do
      opts[:unit] -> run_unit_tests()
      opts[:integration] -> run_integration_tests()
      opts[:property] -> run_property_tests()
      opts[:load] -> run_load_test_with_opts(opts)
      opts[:stream_sim] -> run_streaming_simulation_with_opts(opts)
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
    users = opts[:users] || 10
    duration = (opts[:duration] || 60) * 1000  # Convert to milliseconds
    
    run_load_test(users: users, duration: duration)
  end

  defp run_load_test(opts) do
    users = opts[:users]
    duration_ms = opts[:duration]
    
    Mix.shell().info("Running load test with #{users} users for #{div(duration_ms, 1000)} seconds...")
    
    start_time = System.monotonic_time(:millisecond)
    
    results = LoadTestFramework.run_load_test(
      users: users,
      duration_ms: duration_ms
    )
    
    end_time = System.monotonic_time(:millisecond)
    actual_duration = end_time - start_time
    
    # Display results
    Mix.shell().info("\n=== Load Test Results ===")
    Mix.shell().info("Test Duration: #{div(actual_duration, 1000)}s")
    Mix.shell().info("Users: #{results.test_config.users}")
    Mix.shell().info("Total Events Processed: #{results.results.total_events_processed}")
    Mix.shell().info("Average Events per User: #{Float.round(results.results.average_events_per_user, 2)}")
    Mix.shell().info("Peak Memory Usage: #{results.results.peak_memory_mb}MB")
    Mix.shell().info("Peak Process Count: #{results.results.peak_processes}")
    
    events_per_second = results.results.total_events_processed / (duration_ms / 1000)
    Mix.shell().info("Event Processing Rate: #{Float.round(events_per_second, 2)} events/sec")
  end

  defp run_streaming_simulation_with_opts(opts) do
    streamers = opts[:streamers] || 5
    session_duration = (opts[:session_duration] || 120) * 1000  # Convert to ms
    
    Mix.shell().info("Running streaming simulation with #{streamers} streamers for #{div(session_duration, 1000)} seconds each...")
    
    start_time = System.monotonic_time(:millisecond)
    
    results = LoadTestFramework.simulate_streaming_session(streamers, session_duration)
    
    end_time = System.monotonic_time(:millisecond)
    actual_duration = end_time - start_time
    
    # Display results
    Mix.shell().info("\n=== Streaming Simulation Results ===")
    Mix.shell().info("Simulation Duration: #{div(actual_duration, 1000)}s")
    Mix.shell().info("Number of Streamers: #{results.summary.total_streamers}")
    Mix.shell().info("Total Events Generated: #{results.summary.total_events}")
    Mix.shell().info("Total Donations: #{results.summary.total_donations}")
    Mix.shell().info("Total Follows: #{results.summary.total_follows}")
    Mix.shell().info("Average Events per Streamer: #{Float.round(results.summary.average_events_per_streamer, 2)}")
    
    # Show top performers
    sorted_streamers = Enum.sort_by(results.individual_results, & &1.total_events, :desc)
    top_streamer = List.first(sorted_streamers)
    
    Mix.shell().info("\nTop Performer: #{top_streamer.user_id}")
    Mix.shell().info("  - Total Events: #{top_streamer.total_events}")
    Mix.shell().info("  - Donations: #{top_streamer.donations_received}")
    Mix.shell().info("  - Follows: #{top_streamer.follows_received}")
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