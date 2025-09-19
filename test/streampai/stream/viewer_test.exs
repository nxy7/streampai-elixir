defmodule Streampai.Stream.ViewerTest do
  use Streampai.DataCase
  use Mneme

  alias Ash.Error.Invalid
  alias Streampai.Accounts.User
  alias Streampai.Stream.Viewer
  alias Streampai.Stream.ViewerIdentity

  setup do
    user =
      Ash.Seed.seed!(User, %{
        email: "test@example.com",
        name: "Test Streamer"
      })

    %{user: user}
  end

  describe "creating viewers" do
    test "creates viewer with valid attributes", %{user: user} do
      result =
        Viewer.create(%{
          display_name: "testviewer",
          user_id: user.id,
          notes: "VIP viewer"
        })

      auto_assert {:ok, viewer} <- result

      auto_assert %Viewer{
                    display_name: "testviewer",
                    user_id: user_id,
                    notes: "VIP viewer",
                    first_seen_at: %DateTime{},
                    last_seen_at: %DateTime{}
                  } <- viewer

      assert user_id == user.id
    end

    test "enforces unique display_name per user", %{user: user} do
      # Create first viewer
      {:ok, _viewer1} =
        Viewer.create(%{
          display_name: "uniquename",
          user_id: user.id
        })

      # Try to create second viewer with same display_name for same user
      result =
        Viewer.create(%{
          display_name: "uniquename",
          user_id: user.id
        })

      auto_assert {:error, %Invalid{}} <- result
    end

    test "allows same display_name for different users" do
      user1 =
        Ash.Seed.seed!(User, %{
          email: "user1@example.com",
          name: "User 1"
        })

      user2 =
        Ash.Seed.seed!(User, %{
          email: "user2@example.com",
          name: "User 2"
        })

      # Create viewers with same display_name for different users
      {:ok, viewer1} =
        Viewer.create(%{
          display_name: "samename",
          user_id: user1.id
        })

      {:ok, viewer2} =
        Viewer.create(%{
          display_name: "samename",
          user_id: user2.id
        })

      assert viewer1.display_name == viewer2.display_name
      assert viewer1.user_id != viewer2.user_id
    end

    test "validates display_name format", %{user: user} do
      # Valid characters
      valid_names = ["user123", "test-viewer", "user_name", "Test User"]

      for name <- valid_names do
        {:ok, _viewer} =
          Viewer.create(%{
            display_name: name,
            user_id: user.id
          })
      end

      # Invalid characters should fail
      result =
        Viewer.create(%{
          display_name: "user@invalid!",
          user_id: user.id
        })

      auto_assert {:error, %Invalid{}} <- result
    end
  end

  describe "querying viewers" do
    test "for_user returns viewers for specific user", %{user: user} do
      other_user =
        Ash.Seed.seed!(User, %{
          email: "other@example.com",
          name: "Other User"
        })

      # Create viewers for both users
      {:ok, viewer1} =
        Viewer.create(%{
          display_name: "viewer1",
          user_id: user.id
        })

      {:ok, _other_viewer} =
        Viewer.create(%{
          display_name: "viewer2",
          user_id: other_user.id
        })

      {:ok, viewer3} =
        Viewer.create(%{
          display_name: "viewer3",
          user_id: user.id
        })

      # Query viewers for our user
      viewers = Viewer.for_user!(%{user_id: user.id})

      viewer_ids = Enum.map(viewers, & &1.id)
      assert viewer1.id in viewer_ids
      assert viewer3.id in viewer_ids
      assert length(viewers) == 2
    end

    test "by_display_name finds viewer by name for user", %{user: user} do
      {:ok, viewer} =
        Viewer.create(%{
          display_name: "findme",
          user_id: user.id
        })

      result = Viewer.by_display_name!(%{user_id: user.id, display_name: "findme"})

      auto_assert [found_viewer] <- result
      assert found_viewer.id == viewer.id
    end
  end

  describe "updating viewers" do
    test "touch_last_seen updates last_seen_at", %{user: user} do
      {:ok, viewer} =
        Viewer.create(%{
          display_name: "testviewer",
          user_id: user.id
        })

      original_last_seen = viewer.last_seen_at

      # Wait a moment to ensure timestamp difference
      :timer.sleep(10)

      updated_viewer = Viewer.touch_last_seen!(viewer)

      assert DateTime.after?(updated_viewer.last_seen_at, original_last_seen)
    end

    test "update changes display_name and notes", %{user: user} do
      {:ok, viewer} =
        Viewer.create(%{
          display_name: "oldname",
          user_id: user.id,
          notes: "old notes"
        })

      updated_viewer =
        Viewer.update!(viewer, %{
          display_name: "newname",
          notes: "updated notes"
        })

      assert updated_viewer.display_name == "newname"
      assert updated_viewer.notes == "updated notes"
      assert updated_viewer.id == viewer.id
    end
  end

  describe "viewer relationships" do
    test "loads viewer_identities relationship", %{user: user} do
      {:ok, viewer} =
        Viewer.create(%{
          display_name: "testviewer",
          user_id: user.id
        })

      _identity1 =
        ViewerIdentity.create!(%{
          viewer_id: viewer.id,
          platform: :twitch,
          platform_user_id: "12345",
          username: "testviewer",
          confidence_score: Decimal.new("1.0"),
          linking_method: :automatic
        })

      _identity2 =
        ViewerIdentity.create!(%{
          viewer_id: viewer.id,
          platform: :youtube,
          platform_user_id: "UCabcdef",
          username: "testviewer",
          confidence_score: Decimal.new("0.9"),
          linking_method: :username_similarity
        })

      # Load viewer with identities
      viewer_with_identities = Ash.load!(viewer, [:viewer_identities])

      assert length(viewer_with_identities.viewer_identities) == 2

      platforms = Enum.map(viewer_with_identities.viewer_identities, & &1.platform)
      assert :twitch in platforms
      assert :youtube in platforms
    end
  end
end
