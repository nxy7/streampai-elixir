defmodule StreampaiTest.LoadTestFramework do
  @moduledoc """
  Framework for load testing the livestream manager.
  Simulates realistic user behavior and platform events at scale.
  """

  alias Streampai.LivestreamManager
  import StreampaiTest.LivestreamTestHelpers

  defstruct [
    :test_config,
    :users,
    :metrics,
    :start_time,
    :duration_ms
  ]

  @doc """
  Runs a load test with specified parameters.
  """
  def run_load_test(opts \\ []) do
    config = %__MODULE__{
      users: Keyword.get(opts, :users, 10),
      duration_ms: Keyword.get(opts, :duration_ms, 30_000),
      metrics: %{
        events_sent: 0,
        events_received: 0,
        errors: 0,
        response_times: [],
        peak_memory: 0,
        peak_processes: 0
      }
    }

    {test_config, cleanup_fn} = start_test_livestream_manager("load_test")
    config = %{config | test_config: test_config, start_time: System.monotonic_time(:millisecond)}

    try do
      run_test_scenario(config)
    after
      cleanup_fn.()
    end
  end

  @doc """
  Simulates realistic streaming behavior for multiple users.
  """
  def simulate_streaming_session(num_users \\ 5, session_duration_ms \\ 60_000) do
    {test_config, cleanup_fn} = start_test_livestream_manager("streaming_session")

    try do
      # Create users and start their streams
      user_tasks =
        for i <- 1..num_users do
          user_id = "streamer_#{i}"

          Task.async(fn ->
            simulate_single_streamer(test_config, user_id, session_duration_ms)
          end)
        end

      # Wait for all streaming sessions to complete
      results = Task.await_many(user_tasks, session_duration_ms + 5000)

      # Aggregate results
      aggregate_session_results(results)
    after
      cleanup_fn.()
    end
  end

  # Private functions

  defp generate_continuous_events(config) do
    start_time = System.monotonic_time(:millisecond)
    generate_continuous_events_loop(config, start_time)
  end

  defp generate_continuous_events_loop(config, start_time) do
    current_time = System.monotonic_time(:millisecond)

    if current_time - start_time < config.duration_ms do
      # Generate events for random users
      user_id = "load_test_user_#{:rand.uniform(config.users)}"

      # Generate events with realistic probability distribution
      case :rand.uniform(100) do
        # 5% chance - donation
        n when n <= 5 ->
          generate_donation_event(user_id)

        # 20% chance - follow  
        n when n <= 25 ->
          generate_follow_event(user_id)

        # 5% chance - subscription
        n when n <= 30 ->
          generate_subscription_event(user_id)

        # 1% chance - raid
        n when n <= 31 ->
          generate_raid_event(user_id)

        _ ->
          # No event this cycle
          :ok
      end

      # Wait before next event cycle (faster than streaming simulation)
      Process.sleep(:rand.uniform(50) + 25)
      generate_continuous_events_loop(config, start_time)
    else
      :ok
    end
  end

  defp run_test_scenario(config) do
    # Start monitoring
    monitoring_task = Task.async(fn -> monitor_system_metrics(config) end)

    # Create and start users
    user_tasks =
      for i <- 1..config.users do
        user_id = "load_test_user_#{i}"

        Task.async(fn ->
          simulate_user_activity(config.test_config, user_id, config.duration_ms)
        end)
      end

    # Generate events continuously
    event_task = Task.async(fn -> generate_continuous_events(config) end)

    # Wait for test completion
    user_results = Task.await_many(user_tasks, config.duration_ms + 5000)
    event_results = Task.await(event_task, config.duration_ms + 1000)
    monitoring_results = Task.await(monitoring_task, config.duration_ms + 1000)

    # Compile final results
    compile_load_test_results(config, user_results, event_results, monitoring_results)
  end

  defp simulate_user_activity(test_config, user_id, duration_ms) do
    start_time = System.monotonic_time(:millisecond)

    # Start user stream
    {:ok, _pid} = start_test_user_stream(test_config, user_id)

    metrics = %{
      user_id: user_id,
      events_processed: 0,
      chat_messages_sent: 0,
      metadata_updates: 0,
      errors: []
    }

    # Simulate user activity until duration expires
    simulate_user_loop(test_config, user_id, start_time, duration_ms, metrics)
  end

  defp simulate_user_loop(test_config, user_id, start_time, duration_ms, metrics) do
    current_time = System.monotonic_time(:millisecond)

    if current_time - start_time < duration_ms do
      # Randomly perform different actions
      case :rand.uniform(10) do
        n when n <= 3 ->
          # Send chat message (30% chance)
          send_test_chat_message(user_id)

          simulate_user_loop(test_config, user_id, start_time, duration_ms, %{
            metrics
            | chat_messages_sent: metrics.chat_messages_sent + 1
          })

        n when n <= 5 ->
          # Update stream metadata (20% chance) 
          update_test_stream_metadata(user_id)

          simulate_user_loop(test_config, user_id, start_time, duration_ms, %{
            metrics
            | metadata_updates: metrics.metadata_updates + 1
          })

        n when n <= 7 ->
          # Generate platform event (20% chance)
          generate_random_platform_event(user_id)

          simulate_user_loop(test_config, user_id, start_time, duration_ms, %{
            metrics
            | events_processed: metrics.events_processed + 1
          })

        _ ->
          # Wait/idle (30% chance)
          Process.sleep(:rand.uniform(100))
          simulate_user_loop(test_config, user_id, start_time, duration_ms, metrics)
      end
    else
      metrics
    end
  end

  defp simulate_single_streamer(test_config, user_id, session_duration_ms) do
    {:ok, _pid} = start_test_user_stream(test_config, user_id)

    session_metrics = %{
      user_id: user_id,
      total_events: 0,
      donations_received: 0,
      follows_received: 0,
      chat_messages: 0,
      peak_viewers: 0,
      session_duration: session_duration_ms
    }

    # Subscribe to user events to track metrics
    Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:#{user_id}:events")

    # Start the streaming session
    start_streaming_simulation(test_config, user_id, session_duration_ms, session_metrics)
  end

  defp start_streaming_simulation(_test_config, user_id, duration_ms, metrics) do
    start_time = System.monotonic_time(:millisecond)

    # Set stream to live
    LivestreamManager.update_stream_metadata(user_id, %{
      title: "Load Test Stream - #{user_id}",
      thumbnail_url: "https://example.com/thumb.jpg"
    })

    # Simulate events throughout the session
    event_generation_task =
      Task.async(fn ->
        generate_streaming_events(user_id, duration_ms)
      end)

    # Monitor events
    monitoring_task =
      Task.async(fn ->
        monitor_streaming_events(start_time, duration_ms, metrics)
      end)

    # Wait for session to complete
    Task.await(event_generation_task, duration_ms + 1000)
    final_metrics = Task.await(monitoring_task, duration_ms + 1000)

    final_metrics
  end

  defp generate_streaming_events(user_id, duration_ms) do
    start_time = System.monotonic_time(:millisecond)

    generate_events_loop(user_id, start_time, duration_ms)
  end

  defp generate_events_loop(user_id, start_time, duration_ms) do
    current_time = System.monotonic_time(:millisecond)

    if current_time - start_time < duration_ms do
      # Generate random event based on realistic probabilities
      case :rand.uniform(1000) do
        # 0.2% chance - donation
        n when n <= 2 ->
          generate_donation_event(user_id)

        # 1.8% chance - follow  
        n when n <= 20 ->
          generate_follow_event(user_id)

        # 0.5% chance - subscription
        n when n <= 25 ->
          generate_subscription_event(user_id)

        # 0.1% chance - raid
        n when n <= 26 ->
          generate_raid_event(user_id)

        _ ->
          # No event this cycle
          :ok
      end

      # Wait a bit before next event cycle
      Process.sleep(:rand.uniform(200) + 100)
      generate_events_loop(user_id, start_time, duration_ms)
    end
  end

  defp monitor_streaming_events(start_time, duration_ms, initial_metrics) do
    monitor_events_loop(start_time, duration_ms, initial_metrics)
  end

  defp monitor_events_loop(start_time, duration_ms, metrics) do
    current_time = System.monotonic_time(:millisecond)

    if current_time - start_time < duration_ms do
      receive do
        {:stream_event, %{type: :donation} = _event} ->
          updated_metrics = %{
            metrics
            | total_events: metrics.total_events + 1,
              donations_received: metrics.donations_received + 1
          }

          monitor_events_loop(start_time, duration_ms, updated_metrics)

        {:stream_event, %{type: :follow} = _event} ->
          updated_metrics = %{
            metrics
            | total_events: metrics.total_events + 1,
              follows_received: metrics.follows_received + 1
          }

          monitor_events_loop(start_time, duration_ms, updated_metrics)

        {:stream_event, _event} ->
          updated_metrics = %{metrics | total_events: metrics.total_events + 1}
          monitor_events_loop(start_time, duration_ms, updated_metrics)
      after
        100 ->
          monitor_events_loop(start_time, duration_ms, metrics)
      end
    else
      metrics
    end
  end

  # Event generation helpers

  defp send_test_chat_message(user_id) do
    messages = [
      "Hello chat!",
      "How's everyone doing?",
      "Thanks for watching!",
      "Check out this cool feature",
      "Don't forget to follow!"
    ]

    message = Enum.random(messages)
    LivestreamManager.send_chat_message(user_id, message, :all)
  end

  defp update_test_stream_metadata(user_id) do
    titles = [
      "Awesome Stream Session",
      "Building Cool Stuff",
      "Just Chatting",
      "Gaming Time",
      "Creative Coding Session"
    ]

    title = Enum.random(titles)
    LivestreamManager.update_stream_metadata(user_id, %{title: title})
  end

  defp generate_random_platform_event(user_id) do
    events = [:donation, :follow, :subscription]
    event_type = Enum.random(events)

    case event_type do
      :donation -> generate_donation_event(user_id)
      :follow -> generate_follow_event(user_id)
      :subscription -> generate_subscription_event(user_id)
    end
  end

  defp generate_donation_event(user_id) do
    event = %{
      type: :donation,
      user_id: user_id,
      platform: :twitch,
      username: "donor_#{:rand.uniform(1000)}",
      amount: :rand.uniform(100) + 0.99,
      currency: "USD",
      message: "Great stream!"
    }

    LivestreamManager.EventBroadcaster.broadcast_event(event)
  end

  defp generate_follow_event(user_id) do
    event = %{
      type: :follow,
      user_id: user_id,
      platform: :twitch,
      username: "follower_#{:rand.uniform(10000)}"
    }

    LivestreamManager.EventBroadcaster.broadcast_event(event)
  end

  defp generate_subscription_event(user_id) do
    event = %{
      type: :subscription,
      user_id: user_id,
      platform: :twitch,
      username: "subscriber_#{:rand.uniform(1000)}",
      tier: "Tier 1",
      message: "Love the content!"
    }

    LivestreamManager.EventBroadcaster.broadcast_event(event)
  end

  defp generate_raid_event(user_id) do
    event = %{
      type: :raid,
      user_id: user_id,
      platform: :twitch,
      username: "raider_#{:rand.uniform(100)}",
      viewer_count: :rand.uniform(500) + 10
    }

    LivestreamManager.EventBroadcaster.broadcast_event(event)
  end

  defp monitor_system_metrics(config) do
    metrics = []
    monitor_system_loop(config.start_time, config.duration_ms, metrics)
  end

  defp monitor_system_loop(start_time, duration_ms, metrics) do
    current_time = System.monotonic_time(:millisecond)

    if current_time - start_time < duration_ms do
      # Collect current metrics
      current_metric = %{
        timestamp: current_time,
        memory_usage: :erlang.memory(:total),
        process_count: length(Process.list()),
        message_queue_lengths: get_process_queue_lengths()
      }

      # Sample every second
      Process.sleep(1000)
      monitor_system_loop(start_time, duration_ms, [current_metric | metrics])
    else
      Enum.reverse(metrics)
    end
  end

  defp get_process_queue_lengths do
    Process.list()
    # Sample first 100 processes
    |> Enum.take(100)
    |> Enum.map(fn pid ->
      case Process.info(pid, :message_queue_len) do
        {:message_queue_len, len} -> len
        nil -> 0
      end
    end)
    |> Enum.sum()
  end

  defp compile_load_test_results(config, user_results, _event_results, monitoring_results) do
    total_events =
      Enum.reduce(user_results, 0, fn
        %{events_processed: count}, acc -> acc + count
        _, acc -> acc
      end)

    %{
      test_config: %{
        users: config.users,
        duration_ms: config.duration_ms
      },
      results: %{
        total_events_processed: total_events,
        average_events_per_user: total_events / config.users,
        peak_memory_mb:
          monitoring_results |> Enum.map(& &1.memory_usage) |> Enum.max() |> div(1024 * 1024),
        peak_processes: monitoring_results |> Enum.map(& &1.process_count) |> Enum.max(),
        user_results: user_results,
        system_metrics: monitoring_results
      }
    }
  end

  defp aggregate_session_results(results) do
    total_events = Enum.reduce(results, 0, &(&1.total_events + &2))
    total_donations = Enum.reduce(results, 0, &(&1.donations_received + &2))
    total_follows = Enum.reduce(results, 0, &(&1.follows_received + &2))

    %{
      summary: %{
        total_streamers: length(results),
        total_events: total_events,
        total_donations: total_donations,
        total_follows: total_follows,
        average_events_per_streamer: total_events / length(results)
      },
      individual_results: results
    }
  end
end
