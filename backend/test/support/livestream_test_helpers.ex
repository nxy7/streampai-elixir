defmodule StreampaiTest.LivestreamTestHelpers do
  @moduledoc """
  Test helpers for livestream manager testing.
  Provides utilities for setting up isolated test environments.
  """

  import ExUnit.Assertions

  alias Streampai.LivestreamManager

  @doc """
  Starts a test-isolated livestream manager supervisor tree.
  Uses separate registries and PubSub to avoid test interference.
  """
  def start_test_livestream_manager(test_name \\ nil) do
    suffix = test_name || :erlang.unique_integer([:positive])
    registry_name = :"TestLivestreamRegistry_#{suffix}"
    pubsub_name = :"TestPubSub_#{suffix}"

    # Override application environment for tests
    original_pubsub = Application.get_env(:streampai, :pubsub_name, Streampai.PubSub)
    Application.put_env(:streampai, :pubsub_name, pubsub_name)

    children = [
      Phoenix.PubSub.child_spec(name: pubsub_name),
      {Registry, keys: :unique, name: registry_name},
      {DynamicSupervisor, strategy: :one_for_one, name: :"TestUserSupervisor_#{suffix}"},
      {LivestreamManager.EventBroadcaster, name: :"TestEventBroadcaster_#{suffix}"},
      {LivestreamManager.MetricsCollector, name: :"TestMetricsCollector_#{suffix}"},
      {LivestreamManager.CloudflareSupervisor, name: :"TestCloudflareSupervisor_#{suffix}"}
    ]

    {:ok, supervisor_pid} = Supervisor.start_link(children, strategy: :one_for_one)

    test_config = %{
      supervisor_pid: supervisor_pid,
      registry_name: registry_name,
      pubsub_name: pubsub_name,
      original_pubsub: original_pubsub,
      user_supervisor: :"TestUserSupervisor_#{suffix}",
      event_broadcaster: :"TestEventBroadcaster_#{suffix}"
    }

    # Return cleanup function along with config
    cleanup_fn = fn ->
      Supervisor.stop(supervisor_pid, :normal)
      Application.put_env(:streampai, :pubsub_name, original_pubsub)

      if Process.alive?(Process.whereis(pubsub_name)) do
        Supervisor.stop(pubsub_name, :normal)
      end
    end

    {test_config, cleanup_fn}
  end

  @doc """
  Creates a mock user with streaming accounts for testing.
  """
  def create_test_user(user_id \\ nil) do
    user_id = user_id || "test_user_#{:erlang.unique_integer([:positive])}"

    # Mock streaming accounts
    streaming_accounts = [
      %{
        platform: :twitch,
        access_token: "mock_twitch_token",
        refresh_token: "mock_twitch_refresh",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600),
        extra_data: %{"username" => "test_streamer"}
      },
      %{
        platform: :youtube,
        access_token: "mock_youtube_token",
        refresh_token: "mock_youtube_refresh",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600),
        extra_data: %{"channel_id" => "test_channel_123"}
      }
    ]

    %{
      user_id: user_id,
      streaming_accounts: streaming_accounts
    }
  end

  @doc """
  Starts a user stream manager in test mode.
  """
  def start_test_user_stream(test_config, user_id) do
    # Mock the StreamingAccount.for_user call
    _mock_accounts_response = create_test_user(user_id).streaming_accounts

    # Start user stream with mocked dependencies
    child_spec = %{
      id: {:user_stream_manager, user_id},
      start: {LivestreamManager.UserStreamManager, :start_link, [user_id]},
      restart: :temporary,
      type: :supervisor
    }

    case DynamicSupervisor.start_child(test_config.user_supervisor, child_spec) do
      {:ok, pid} -> {:ok, pid}
      {:error, {:already_started, pid}} -> {:ok, pid}
      error -> error
    end
  end

  @doc """
  Waits for a specific event to be broadcast during tests.
  """
  def wait_for_event(pubsub_name, topic, timeout \\ 1000) do
    Phoenix.PubSub.subscribe(pubsub_name, topic)

    receive do
      event -> {:ok, event}
    after
      timeout -> {:timeout, topic}
    end
  end

  @doc """
  Asserts that an event was broadcast to a topic.
  """
  def assert_event_broadcast(pubsub_name, topic, expected_event, timeout \\ 1000) do
    case wait_for_event(pubsub_name, topic, timeout) do
      {:ok, event} ->
        assert event == expected_event
        :ok

      {:timeout, _} ->
        flunk("Expected event #{inspect(expected_event)} not received on topic #{topic}")
    end
  end

  @doc """
  Creates mock platform API responses for testing.
  """
  def mock_platform_responses do
    %{
      twitch: %{
        chat_send: :ok,
        stream_info: %{
          viewer_count: 42,
          title: "Test Stream",
          category: "Software Development"
        },
        auth_refresh: {:ok, %{access_token: "new_token", expires_in: 3600}}
      },
      youtube: %{
        chat_send: :ok,
        stream_info: %{
          viewer_count: 123,
          title: "YouTube Test Stream"
        }
      }
    }
  end

  @doc """
  Injects mock dependencies into a GenServer state.
  Useful for testing specific scenarios without full integration.
  """
  def inject_test_state(pid, state_updates) when is_pid(pid) do
    :sys.replace_state(pid, fn current_state ->
      Map.merge(current_state, state_updates)
    end)
  end

  @doc """
  Captures all events broadcast during test execution.
  """
  def capture_events(pubsub_name, topics, test_fn) when is_list(topics) do
    # Subscribe to all topics
    Enum.each(topics, &Phoenix.PubSub.subscribe(pubsub_name, &1))

    # Execute test
    result = test_fn.()

    # Collect events
    events = collect_events([])

    {result, events}
  end

  defp collect_events(acc) do
    receive do
      event -> collect_events([event | acc])
    after
      100 -> Enum.reverse(acc)
    end
  end
end
