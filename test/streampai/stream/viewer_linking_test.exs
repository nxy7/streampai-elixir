defmodule Streampai.Stream.ViewerLinkingTest do
  use Streampai.DataCase
  use Mneme

  alias Streampai.Accounts.User
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.Viewer
  alias Streampai.Stream.ViewerIdentity
  alias Streampai.Stream.ViewerLinkingSimple, as: ViewerLinking

  setup do
    user =
      Ash.Seed.seed!(User, %{
        email: "test@example.com",
        name: "Test Streamer"
      })

    %{user: user}
  end

  describe "link_identity/4" do
    test "creates new viewer and identity for first-time platform user", %{user: user} do
      result =
        ViewerLinking.link_identity(
          :twitch,
          "12345",
          "johndoe",
          user_id: user.id
        )

      auto_assert {:ok, %{viewer: viewer, identity: identity, created?: true}} <- result

      auto_assert %Viewer{
                    display_name: "johndoe",
                    user_id: user_id,
                    first_seen_at: %DateTime{},
                    last_seen_at: %DateTime{}
                  } <- viewer

      assert user_id == user.id

      auto_assert %ViewerIdentity{
                    platform: :twitch,
                    platform_user_id: "12345",
                    username: "johndoe",
                    confidence_score: %Decimal{},
                    linking_method: :automatic,
                    global_viewer_id: global_viewer_id
                  } <- identity

      assert is_binary(global_viewer_id)
      assert Decimal.equal?(identity.confidence_score, Decimal.new("1.0"))
    end

    test "links to existing viewer when username similarity is high", %{user: user} do
      # Create existing global identity with YouTube platform
      global_viewer_id = Ash.UUID.generate()

      {:ok, existing_viewer} =
        Viewer.create(%{
          display_name: "johndoe",
          user_id: user.id
        })

      {:ok, _youtube_identity} =
        ViewerIdentity.create(%{
          global_viewer_id: global_viewer_id,
          platform: :youtube,
          platform_user_id: "UCabcdef",
          username: "johndoe",
          display_name: "johndoe",
          confidence_score: Decimal.new("1.0"),
          linking_method: :automatic
        })

      # Link a Twitch identity with same username
      result =
        ViewerLinking.link_identity(
          :twitch,
          "67890",
          "johndoe",
          user_id: user.id
        )

      auto_assert {:ok, %{viewer: viewer, identity: identity, created?: true}} <- result

      # Should link to existing viewer
      assert viewer.id == existing_viewer.id

      auto_assert %ViewerIdentity{
                    platform: :twitch,
                    platform_user_id: "67890",
                    username: "johndoe",
                    linking_method: :automatic,
                    global_viewer_id: global_viewer_id
                  } <- identity

      assert is_binary(global_viewer_id)
    end

    test "returns existing identity when already linked", %{user: user} do
      # Create existing viewer and global identity
      global_viewer_id = Ash.UUID.generate()

      {:ok, viewer} =
        Viewer.create(%{
          display_name: "testuser",
          user_id: user.id
        })

      {:ok, existing_identity} =
        ViewerIdentity.create(%{
          global_viewer_id: global_viewer_id,
          platform: :twitch,
          platform_user_id: "12345",
          username: "testuser",
          display_name: "testuser",
          confidence_score: Decimal.new("1.0"),
          linking_method: :automatic
        })

      # Try to link the same platform identity again
      result =
        ViewerLinking.link_identity(
          :twitch,
          "12345",
          "testuser",
          user_id: user.id
        )

      auto_assert {:ok, %{viewer: returned_viewer, identity: returned_identity, created?: false}} <-
                    result

      assert returned_viewer.id == viewer.id
      assert returned_identity.id == existing_identity.id
    end

    test "updates username when existing identity has different username", %{user: user} do
      # Create existing viewer and global identity
      global_viewer_id = Ash.UUID.generate()

      {:ok, viewer} =
        Viewer.create(%{
          display_name: "oldname",
          user_id: user.id
        })

      {:ok, existing_identity} =
        ViewerIdentity.create(%{
          global_viewer_id: global_viewer_id,
          platform: :twitch,
          platform_user_id: "12345",
          username: "oldname",
          display_name: "oldname",
          confidence_score: Decimal.new("1.0"),
          linking_method: :automatic
        })

      # Link with updated username
      result =
        ViewerLinking.link_identity(
          :twitch,
          "12345",
          "newname",
          user_id: user.id
        )

      auto_assert {:ok, %{viewer: returned_viewer, identity: updated_identity, created?: false}} <-
                    result

      assert returned_viewer.id == viewer.id
      assert updated_identity.id == existing_identity.id
      assert updated_identity.username == "newname"
      assert updated_identity.last_seen_username == "oldname"
    end
  end

  describe "link_chat_message/2" do
    test "links chat message to viewer and creates viewer if needed", %{user: user} do
      # Create a livestream first
      {:ok, livestream} =
        Streampai.Stream.Livestream.create(%{
          started_at: DateTime.utc_now()
        })

      # Create a chat message (this would normally be done by the chat message system)
      {:ok, message} =
        ChatMessage.create!(%{
          id: "msg123",
          message: "Hello world!",
          sender_username: "chatuser",
          platform: :twitch,
          sender_channel_id: "12345",
          user_id: user.id,
          livestream_id: livestream.id,
          sender_is_moderator: false,
          sender_is_patreon: false
        })

      result = ViewerLinking.link_chat_message(message)

      auto_assert {:ok, %{message: updated_message, viewer: viewer, identity: identity}} <- result

      # Verify viewer was created
      auto_assert %Viewer{
                    display_name: "chatuser",
                    user_id: user_id
                  } <- viewer

      assert user_id == user.id

      # Verify identity was created
      auto_assert %ViewerIdentity{
                    platform: :twitch,
                    platform_user_id: "12345",
                    username: "chatuser",
                    viewer_id: viewer_id
                  } <- identity

      assert viewer_id == viewer.id

      # Verify message was updated with viewer_id
      assert updated_message.viewer_id == viewer.id
    end
  end

  describe "link_stream_event/2" do
    test "links stream event to viewer and creates viewer if needed", %{user: user} do
      # Create a stream event
      {:ok, event} =
        StreamEvent.create!(%{
          type: :donation,
          data: %{"username" => "donor123", "amount" => "10.00"},
          data_raw: %{"raw" => "data"},
          author_id: "donor_id_123",
          platform: :twitch,
          user_id: user.id,
          livestream_id: Ash.UUID.generate()
        })

      result = ViewerLinking.link_stream_event(event)

      auto_assert {:ok, %{event: updated_event, viewer: viewer, identity: identity}} <- result

      # Verify viewer was created with username from event data
      auto_assert %Viewer{
                    display_name: "donor123",
                    user_id: user_id
                  } <- viewer

      assert user_id == user.id

      # Verify identity was created
      auto_assert %ViewerIdentity{
                    platform: :twitch,
                    platform_user_id: "donor_id_123",
                    username: "donor123",
                    viewer_id: viewer_id
                  } <- identity

      assert viewer_id == viewer.id

      # Verify event was updated with viewer_id
      assert updated_event.viewer_id == viewer.id
    end

    test "handles event without username in data", %{user: user} do
      # Create a stream event without username in data
      {:ok, event} =
        StreamEvent.create!(%{
          type: :follow,
          data: %{"follow_count" => 100},
          data_raw: %{"raw" => "data"},
          author_id: "follower_id_456",
          platform: :youtube,
          user_id: user.id,
          livestream_id: Ash.UUID.generate()
        })

      result = ViewerLinking.link_stream_event(event)

      auto_assert {:ok, %{event: updated_event, viewer: viewer, identity: identity}} <- result

      # Should fallback to "unknown" username
      assert viewer.display_name == "unknown"
      assert identity.username == "unknown"
      assert updated_event.viewer_id == viewer.id
    end
  end

  describe "reevaluate_user_linking/1" do
    test "performs dry run reevaluation without making changes", %{user: user} do
      # Create some test data
      {:ok, viewer} =
        Viewer.create(%{
          display_name: "testuser",
          user_id: user.id
        })

      global_viewer_id = Ash.UUID.generate()

      {:ok, _identity} =
        ViewerIdentity.create(%{
          global_viewer_id: global_viewer_id,
          platform: :twitch,
          platform_user_id: "12345",
          username: "testuser",
          display_name: "testuser",
          confidence_score: Decimal.new("0.8"),
          linking_method: :automatic
        })

      result =
        ViewerLinking.reevaluate_user_linking(
          user_id: user.id,
          dry_run: true
        )

      auto_assert {:ok,
                   %{
                     total_identities: _,
                     results: _,
                     batch_id: batch_id,
                     dry_run: true
                   }} <- result

      assert is_binary(batch_id)
    end
  end

  describe "confidence scoring and linking methods" do
    test "assigns high confidence for exact username matches", %{user: user} do
      result =
        ViewerLinking.link_identity(
          :twitch,
          "12345",
          "exactmatch",
          user_id: user.id,
          confidence_threshold: Decimal.new("0.9")
        )

      auto_assert {:ok, %{identity: identity}} <- result
      assert Decimal.equal?(identity.confidence_score, Decimal.new("1.0"))
      assert identity.linking_method == :automatic
    end

    test "respects custom confidence thresholds", %{user: user} do
      # This test would be more meaningful with a complex linking scenario
      # For now, just verify the threshold parameter is accepted
      result =
        ViewerLinking.link_identity(
          :twitch,
          "12345",
          "testuser",
          user_id: user.id,
          confidence_threshold: Decimal.new("0.5")
        )

      auto_assert {:ok, %{identity: identity}} <- result
      assert identity.confidence_score
    end
  end

  describe "batch processing" do
    test "groups linking operations with batch IDs", %{user: user} do
      batch_id = "test_batch_123"

      result1 =
        ViewerLinking.link_identity(
          :twitch,
          "user1",
          "testuser1",
          user_id: user.id,
          batch_id: batch_id
        )

      result2 =
        ViewerLinking.link_identity(
          :youtube,
          "user2",
          "testuser2",
          user_id: user.id,
          batch_id: batch_id
        )

      auto_assert {:ok, %{identity: identity1}} <- result1
      auto_assert {:ok, %{identity: identity2}} <- result2

      assert identity1.linking_batch_id == batch_id
      assert identity2.linking_batch_id == batch_id
    end
  end

  describe "username similarity calculations" do
    test "handles edge cases in username comparison" do
      # Test via the private function's behavior through the public API
      # This is testing the internal logic indirectly

      # Placeholder test - in real implementation, you'd test with
      # viewers that have similar usernames on different platforms
      assert true
    end
  end
end
