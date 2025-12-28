defmodule Streampai.Stream.StreamActor.Changes.SetStoppedStateTest do
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

    livestream_id = Ash.UUID.generate()

    {:ok, streaming_actor} =
      Ash.update(
        actor,
        %{livestream_id: livestream_id},
        action: :set_streaming,
        authorize?: false
      )

    %{user: user, actor: streaming_actor}
  end

  describe "set_stopped action" do
    test "sets status to idle", %{actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{}, action: :set_stopped, authorize?: false)

      assert updated.data["status"] == "idle"
    end

    test "clears livestream_id", %{actor: actor} do
      assert actor.data["livestream_id"]

      {:ok, updated} =
        Ash.update(actor, %{}, action: :set_stopped, authorize?: false)

      assert updated.data["livestream_id"] == nil
    end

    test "resets viewers to empty map", %{actor: actor} do
      {:ok, actor_with_viewers} =
        Ash.update(
          actor,
          %{platform: :twitch, viewer_count: 150},
          action: :update_viewers,
          authorize?: false
        )

      assert actor_with_viewers.data["viewers"]["twitch"] == 150

      {:ok, updated} =
        Ash.update(actor_with_viewers, %{}, action: :set_stopped, authorize?: false)

      assert updated.data["viewers"] == %{}
      assert updated.data["total_viewers"] == 0
    end

    test "sets input_streaming to false", %{actor: actor} do
      {:ok, actor_with_input} =
        Ash.update(
          actor,
          %{input_streaming: true},
          action: :update_state,
          authorize?: false
        )

      assert actor_with_input.data["input_streaming"] == true

      {:ok, updated} =
        Ash.update(actor_with_input, %{}, action: :set_stopped, authorize?: false)

      assert updated.data["input_streaming"] == false
    end

    test "uses custom status message when provided", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{status_message: "Stream completed successfully"},
          action: :set_stopped,
          authorize?: false
        )

      assert updated.data["status_message"] == "Stream completed successfully"
    end

    test "uses default status message when not provided", %{actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{}, action: :set_stopped, authorize?: false)

      assert updated.data["status_message"] == "Stream ended"
    end
  end
end
