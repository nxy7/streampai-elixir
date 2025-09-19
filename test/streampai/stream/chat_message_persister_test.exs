defmodule Streampai.Stream.ChatMessagePersisterTest do
  use Streampai.DataCase, async: false

  import Streampai.TestHelpers

  alias Streampai.Accounts.User
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.ChatMessagePersister
  alias Streampai.Stream.Livestream

  require Ash.Query

  describe "ChatMessagePersister" do
    setup do
      # Create test user
      user_attrs = factory(:user)

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, user_attrs)
        |> Ash.create()

      # Create test livestream
      {:ok, livestream} =
        Livestream
        |> Ash.Changeset.for_create(:create, %{started_at: DateTime.utc_now()})
        |> Ash.create()

      # Start the persister process for testing
      {:ok, persister_pid} =
        ChatMessagePersister.start_link(name: :"TestPersister_#{:rand.uniform(10_000)}")

      on_exit(fn ->
        if Process.alive?(persister_pid) do
          GenServer.stop(persister_pid)
        end
      end)

      %{user: user, livestream: livestream, persister: persister_pid}
    end

    test "adds message to batch queue", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      message_data = %{
        message: "Hello, world!",
        username: "test_user",
        platform: :twitch,
        channel_id: "test_channel",
        user_id: user.id,
        livestream_id: livestream.id,
        is_moderator: false,
        is_patreon: false
      }

      GenServer.cast(persister, {:add_message, message_data})

      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 1
    end

    test "flushes messages when batch size reached", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      # Add 100 messages to trigger batch flush
      for i <- 1..100 do
        message_data = %{
          message: "Message #{i}",
          username: "user_#{i}",
          platform: :twitch,
          channel_id: "test_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          is_moderator: false,
          is_patreon: false
        }

        GenServer.cast(persister, {:add_message, message_data})
      end

      # Wait a bit for processing
      Process.sleep(100)

      # Check that messages were flushed
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 0

      # Verify messages were saved to database
      query = Ash.Query.filter(ChatMessage, livestream_id: livestream.id)
      {:ok, saved_messages} = Ash.read(query)
      assert length(saved_messages) == 100
    end

    test "manual flush saves pending messages", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      # Add a few messages
      for i <- 1..5 do
        message_data = %{
          message: "Manual flush test #{i}",
          username: "manual_user_#{i}",
          platform: :youtube,
          channel_id: "manual_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          is_moderator: i == 1,
          is_patreon: i == 2
        }

        GenServer.cast(persister, {:add_message, message_data})
      end

      # Manually flush
      {:ok, count} = GenServer.call(persister, :flush_now)
      assert count == 5

      # Verify stats
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 0

      # Verify messages in database
      query = Ash.Query.filter(ChatMessage, livestream_id: livestream.id)
      {:ok, saved_messages} = Ash.read(query)
      assert length(saved_messages) == 5

      # Verify message content
      youtube_messages = Enum.filter(saved_messages, &(&1.platform == :youtube))
      assert length(youtube_messages) == 5

      moderator_messages = Enum.filter(saved_messages, &(&1.is_moderator == true))
      assert length(moderator_messages) == 1

      patreon_messages = Enum.filter(saved_messages, &(&1.is_patreon == true))
      assert length(patreon_messages) == 1
    end

    test "handles timer-based flush", %{user: user, livestream: livestream, persister: persister} do
      # Add a few messages (less than batch size)
      for i <- 1..3 do
        message_data = %{
          message: "Timer test #{i}",
          username: "timer_user_#{i}",
          platform: :twitch,
          channel_id: "timer_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          is_moderator: false,
          is_patreon: false
        }

        GenServer.cast(persister, {:add_message, message_data})
      end

      # Messages should be pending
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 3

      # Send flush timer message to trigger timer flush
      send(persister, :flush_timer)

      # Wait for processing
      Process.sleep(100)

      # Check that messages were flushed
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 0

      # Verify in database
      query = Ash.Query.filter(ChatMessage, livestream_id: livestream.id)
      {:ok, saved_messages} = Ash.read(query)
      assert length(saved_messages) == 3
    end

    test "preserves message data integrity", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      original_message = %{
        message: "Test message with unicode 🎮",
        username: "test_streamer",
        platform: :twitch,
        channel_id: "special_channel_123",
        user_id: user.id,
        livestream_id: livestream.id,
        is_moderator: true,
        is_patreon: true
      }

      GenServer.cast(persister, {:add_message, original_message})
      {:ok, _count} = GenServer.call(persister, :flush_now)

      # Retrieve and verify
      query = Ash.Query.filter(ChatMessage, message: original_message.message)
      {:ok, [saved_message]} = Ash.read(query)

      assert saved_message.message == original_message.message
      assert saved_message.username == original_message.username
      assert saved_message.platform == original_message.platform
      assert saved_message.channel_id == original_message.channel_id
      assert saved_message.user_id == original_message.user_id
      assert saved_message.livestream_id == original_message.livestream_id
      assert saved_message.is_moderator == original_message.is_moderator
      assert saved_message.is_patreon == original_message.is_patreon
    end

    test "handles empty flush gracefully", %{persister: persister} do
      {:ok, result} = GenServer.call(persister, :flush_now)
      assert result == []

      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 0
    end

    test "upsert prevents duplicate messages across separate flushes", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      message_data = %{
        message: "Duplicate test message",
        username: "duplicate_user",
        platform: :twitch,
        channel_id: "duplicate_channel",
        user_id: user.id,
        livestream_id: livestream.id,
        is_moderator: false,
        is_patreon: false
      }

      # Add and flush the first message
      GenServer.cast(persister, {:add_message, message_data})
      {:ok, _count} = GenServer.call(persister, :flush_now)

      # Add the same message again and flush
      GenServer.cast(persister, {:add_message, message_data})
      {:ok, _count} = GenServer.call(persister, :flush_now)

      # Should only have one message due to upsert
      query = Ash.Query.filter(ChatMessage, message: message_data.message)
      {:ok, saved_messages} = Ash.read(query)

      assert length(saved_messages) == 1
    end

    test "get_stats returns correct information", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      # Initial stats
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 0
      assert is_integer(stats.last_flush)
      assert is_integer(stats.uptime)

      # Add messages
      for i <- 1..3 do
        message_data = %{
          message: "Stats test #{i}",
          username: "stats_user",
          platform: :twitch,
          channel_id: "stats_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          is_moderator: false,
          is_patreon: false
        }

        GenServer.cast(persister, {:add_message, message_data})
      end

      # Check updated stats
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 3
    end
  end

  describe "ChatMessagePersister module functions" do
    test "add_message/1 works with global persister" do
      # This test would require the global persister to be running
      # For now, we'll test the function exists and has correct arity
      assert function_exported?(ChatMessagePersister, :add_message, 1)
      assert function_exported?(ChatMessagePersister, :flush_now, 0)
      assert function_exported?(ChatMessagePersister, :get_stats, 0)
    end
  end
end
