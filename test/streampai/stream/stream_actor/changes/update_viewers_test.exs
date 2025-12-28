defmodule Streampai.Stream.StreamActor.Changes.UpdateViewersTest do
  use Streampai.DataCase, async: true

  alias Streampai.Accounts.User
  alias Streampai.Stream.StreamActor

  setup do
    user =
      Ash.Seed.seed!(User, %{
        email: "test@example.com",
        name: "Test User"
      })

    {:ok, actor} = StreamActor.upsert_for_user(user.id, authorize?: false)
    %{user: user, actor: actor}
  end

  describe "update_viewers action" do
    test "sets viewer count for a platform", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 150},
          action: :update_viewers,
          authorize?: false
        )

      assert updated.data["viewers"]["twitch"] == 150
      assert updated.data["total_viewers"] == 150
    end

    test "accumulates viewers across platforms", %{actor: actor} do
      {:ok, actor} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 150},
          action: :update_viewers,
          authorize?: false
        )

      {:ok, updated} =
        Ash.update(
          actor,
          %{platform: :youtube, viewer_count: 200},
          action: :update_viewers,
          authorize?: false
        )

      assert updated.data["viewers"]["twitch"] == 150
      assert updated.data["viewers"]["youtube"] == 200
      assert updated.data["total_viewers"] == 350
    end

    test "updates existing platform count", %{actor: actor} do
      {:ok, actor} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 100},
          action: :update_viewers,
          authorize?: false
        )

      {:ok, updated} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 200},
          action: :update_viewers,
          authorize?: false
        )

      assert updated.data["viewers"]["twitch"] == 200
      assert updated.data["total_viewers"] == 200
    end

    test "recalculates total when updating one platform", %{actor: actor} do
      {:ok, actor} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 100},
          action: :update_viewers,
          authorize?: false
        )

      {:ok, actor} =
        Ash.update(
          actor,
          %{platform: :youtube, viewer_count: 100},
          action: :update_viewers,
          authorize?: false
        )

      assert actor.data["total_viewers"] == 200

      {:ok, updated} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 50},
          action: :update_viewers,
          authorize?: false
        )

      assert updated.data["total_viewers"] == 150
    end

    test "handles zero viewer count", %{actor: actor} do
      {:ok, actor} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 100},
          action: :update_viewers,
          authorize?: false
        )

      {:ok, updated} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 0},
          action: :update_viewers,
          authorize?: false
        )

      assert updated.data["viewers"]["twitch"] == 0
      assert updated.data["total_viewers"] == 0
    end

    test "updates last_updated_at", %{actor: actor} do
      original_timestamp = actor.data["last_updated_at"]

      Process.sleep(10)

      {:ok, updated} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 100},
          action: :update_viewers,
          authorize?: false
        )

      refute updated.data["last_updated_at"] == original_timestamp
    end
  end
end
