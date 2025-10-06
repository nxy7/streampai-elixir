defmodule Streampai.Stream.EventPersisterTest do
  use Streampai.DataCase, async: true

  import Streampai.TestHelpers

  alias Streampai.Accounts.User
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.EventPersister
  alias Streampai.Stream.Livestream

  require Ash.Query

  defp build_author_attrs(user_id, viewer_id, username) do
    %{
      viewer_id: viewer_id,
      user_id: user_id,
      display_name: username,
      avatar_url: nil,
      channel_url: nil,
      is_verified: false,
      is_owner: false,
      is_moderator: false,
      is_patreon: false
    }
  end

  describe "EventPersister" do
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
        |> Ash.Changeset.for_create(:create, %{
          user_id: user.id,
          started_at: DateTime.utc_now(),
          title: "Test Stream"
        })
        |> Ash.create()

      # Start the persister process for testing
      {:ok, persister_pid} =
        EventPersister.start_link(name: :"TestPersister_#{:rand.uniform(10_000)}")

      # Allow the persister process to access the database connection
      Ecto.Adapters.SQL.Sandbox.allow(Streampai.Repo, self(), persister_pid)

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
      message_attrs = %{
        id: "test_msg_1",
        message: "Hello, world!",
        sender_username: "test_user",
        platform: :twitch,
        sender_channel_id: "test_channel",
        user_id: user.id,
        livestream_id: livestream.id,
        sender_is_moderator: false,
        sender_is_patreon: false
      }

      author_attrs = build_author_attrs(user.id, "test_channel", "test_user")

      GenServer.cast(persister, {:add_message, {message_attrs, author_attrs}})

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
        message_attrs = %{
          id: "batch_msg_#{i}",
          message: "Message #{i}",
          sender_username: "user_#{i}",
          platform: :twitch,
          sender_channel_id: "test_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          sender_is_moderator: false,
          sender_is_patreon: false
        }

        author_attrs = build_author_attrs(user.id, "test_channel", "user_#{i}")

        GenServer.cast(persister, {:add_message, {message_attrs, author_attrs}})
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
        message_attrs = %{
          id: "manual_msg_#{i}",
          message: "Manual flush test #{i}",
          sender_username: "manual_user_#{i}",
          platform: :youtube,
          sender_channel_id: "manual_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          sender_is_moderator: i == 1,
          sender_is_patreon: i == 2
        }

        author_attrs = build_author_attrs(user.id, "manual_channel", "manual_user_#{i}")

        GenServer.cast(persister, {:add_message, {message_attrs, author_attrs}})
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

      moderator_messages = Enum.filter(saved_messages, &(&1.sender_is_moderator == true))
      assert length(moderator_messages) == 1

      patreon_messages = Enum.filter(saved_messages, &(&1.sender_is_patreon == true))
      assert length(patreon_messages) == 1
    end

    test "handles timer-based flush", %{user: user, livestream: livestream, persister: persister} do
      # Add a few messages (less than batch size)
      for i <- 1..3 do
        message_attrs = %{
          id: "timer_msg_#{i}",
          message: "Timer test #{i}",
          sender_username: "timer_user_#{i}",
          platform: :twitch,
          sender_channel_id: "timer_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          sender_is_moderator: false,
          sender_is_patreon: false
        }

        author_attrs = build_author_attrs(user.id, "timer_channel", "timer_user_#{i}")

        GenServer.cast(persister, {:add_message, {message_attrs, author_attrs}})
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
      message_attrs = %{
        id: "unicode_msg_1",
        message: "Test message with unicode 🎮",
        sender_username: "test_streamer",
        platform: :twitch,
        sender_channel_id: "special_channel_123",
        user_id: user.id,
        livestream_id: livestream.id,
        sender_is_moderator: true,
        sender_is_patreon: true
      }

      author_attrs = build_author_attrs(user.id, "special_channel_123", "test_streamer")

      GenServer.cast(persister, {:add_message, {message_attrs, author_attrs}})
      {:ok, _count} = GenServer.call(persister, :flush_now)

      # Retrieve and verify
      query = Ash.Query.filter(ChatMessage, message: message_attrs.message)
      {:ok, [saved_message]} = Ash.read(query)

      assert saved_message.message == message_attrs.message
      assert saved_message.sender_username == message_attrs.sender_username
      assert saved_message.platform == message_attrs.platform
      assert saved_message.sender_channel_id == message_attrs.sender_channel_id
      assert saved_message.user_id == message_attrs.user_id
      assert saved_message.livestream_id == message_attrs.livestream_id
      assert saved_message.sender_is_moderator == message_attrs.sender_is_moderator
      assert saved_message.sender_is_patreon == message_attrs.sender_is_patreon
    end

    test "handles empty flush gracefully", %{persister: persister} do
      {:ok, result} = GenServer.call(persister, :flush_now)
      assert result == []

      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 0
    end

    test "upsert updates existing message with same ID", %{
      user: user,
      livestream: livestream,
      persister: persister
    } do
      message_attrs_v1 = %{
        id: "duplicate_msg_1",
        message: "Original message",
        sender_username: "duplicate_user",
        platform: :twitch,
        sender_channel_id: "duplicate_channel",
        user_id: user.id,
        livestream_id: livestream.id,
        sender_is_moderator: false,
        sender_is_patreon: false
      }

      author_attrs = build_author_attrs(user.id, "duplicate_channel", "duplicate_user")

      # Add and flush the first version
      GenServer.cast(persister, {:add_message, {message_attrs_v1, author_attrs}})
      {:ok, _count} = GenServer.call(persister, :flush_now)

      # Update the same message (same ID, different content)
      message_attrs_v2 = %{
        message_attrs_v1
        | message: "Updated message",
          sender_is_moderator: true
      }

      GenServer.cast(persister, {:add_message, {message_attrs_v2, author_attrs}})
      {:ok, _count} = GenServer.call(persister, :flush_now)

      # Should only have one message due to upsert by ID
      query = Ash.Query.filter(ChatMessage, id: message_attrs_v1.id)
      {:ok, saved_messages} = Ash.read(query)

      assert length(saved_messages) == 1
      [saved_message] = saved_messages
      assert saved_message.message == "Updated message"
      assert saved_message.sender_is_moderator == true
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
        message_attrs = %{
          id: "stats_msg_#{i}",
          message: "Stats test #{i}",
          sender_username: "stats_user",
          platform: :twitch,
          sender_channel_id: "stats_channel",
          user_id: user.id,
          livestream_id: livestream.id,
          sender_is_moderator: false,
          sender_is_patreon: false
        }

        author_attrs = build_author_attrs(user.id, "stats_channel", "stats_user")

        GenServer.cast(persister, {:add_message, {message_attrs, author_attrs}})
      end

      # Check updated stats
      stats = GenServer.call(persister, :get_stats)
      assert stats.pending_messages == 3
    end
  end

  describe "EventPersister module functions" do
    test "add_message/1 works with global persister" do
      # This test would require the global persister to be running
      # For now, we'll test the function exists and has correct arity
      assert function_exported?(EventPersister, :add_message, 1)
      assert function_exported?(EventPersister, :flush_now, 0)
      assert function_exported?(EventPersister, :get_stats, 0)
    end
  end
end
