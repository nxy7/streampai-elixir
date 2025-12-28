defmodule Streampai.Stream.StreamActor.Changes.SetStreamingStateTest do
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

  describe "set_streaming action" do
    test "sets status to streaming with livestream_id", %{actor: actor} do
      livestream_id = Ash.UUID.generate()

      {:ok, updated} =
        Ash.update(
          actor,
          %{livestream_id: livestream_id},
          action: :set_streaming,
          authorize?: false
        )

      assert updated.data["status"] == "streaming"
      assert updated.data["livestream_id"] == livestream_id
    end

    test "sets started_at timestamp", %{actor: actor} do
      livestream_id = Ash.UUID.generate()

      {:ok, updated} =
        Ash.update(
          actor,
          %{livestream_id: livestream_id},
          action: :set_streaming,
          authorize?: false
        )

      assert is_binary(updated.data["started_at"])
      {:ok, _datetime, _offset} = DateTime.from_iso8601(updated.data["started_at"])
    end

    test "uses custom status message when provided", %{actor: actor} do
      livestream_id = Ash.UUID.generate()

      {:ok, updated} =
        Ash.update(
          actor,
          %{livestream_id: livestream_id, status_message: "Going live on Twitch!"},
          action: :set_streaming,
          authorize?: false
        )

      assert updated.data["status_message"] == "Going live on Twitch!"
    end

    test "uses default status message when not provided", %{actor: actor} do
      livestream_id = Ash.UUID.generate()

      {:ok, updated} =
        Ash.update(
          actor,
          %{livestream_id: livestream_id},
          action: :set_streaming,
          authorize?: false
        )

      assert updated.data["status_message"] == "Streaming to platforms"
    end

    test "clears error fields", %{actor: actor} do
      {:ok, actor_with_error} =
        Ash.update(
          actor,
          %{error_message: "Something went wrong"},
          action: :set_error,
          authorize?: false
        )

      assert actor_with_error.data["error_message"] == "Something went wrong"
      assert actor_with_error.data["error_at"]

      livestream_id = Ash.UUID.generate()

      {:ok, updated} =
        Ash.update(
          actor_with_error,
          %{livestream_id: livestream_id},
          action: :set_streaming,
          authorize?: false
        )

      assert updated.data["error_message"] == nil
      assert updated.data["error_at"] == nil
    end
  end
end
