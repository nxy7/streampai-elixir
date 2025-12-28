defmodule Streampai.Stream.StreamActor.Changes.UpdateDataTest do
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

  describe "update_state action with UpdateData change" do
    test "updates single field", %{actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{status: :streaming}, action: :update_state, authorize?: false)

      assert updated.data["status"] == "streaming"
    end

    test "updates multiple fields", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{status: :streaming, status_message: "Going live!", input_streaming: true},
          action: :update_state,
          authorize?: false
        )

      assert updated.data["status"] == "streaming"
      assert updated.data["status_message"] == "Going live!"
      assert updated.data["input_streaming"] == true
    end

    test "preserves existing fields when updating", %{actor: actor} do
      {:ok, actor} =
        Ash.update(
          actor,
          %{status: :streaming, status_message: "First message"},
          action: :update_state,
          authorize?: false
        )

      {:ok, updated} =
        Ash.update(actor, %{status_message: "Updated message"},
          action: :update_state,
          authorize?: false
        )

      assert updated.data["status"] == "streaming"
      assert updated.data["status_message"] == "Updated message"
    end

    test "nil values don't overwrite existing values", %{actor: actor} do
      {:ok, actor} =
        Ash.update(
          actor,
          %{status: :streaming, status_message: "Existing message"},
          action: :update_state,
          authorize?: false
        )

      {:ok, updated} =
        Ash.update(actor, %{status: :stopping}, action: :update_state, authorize?: false)

      assert updated.data["status"] == "stopping"
      assert updated.data["status_message"] == "Existing message"
    end

    test "updates last_updated_at timestamp", %{actor: actor} do
      original_timestamp = actor.data["last_updated_at"]

      # Small delay to ensure timestamp changes
      Process.sleep(10)

      {:ok, updated} =
        Ash.update(actor, %{status: :streaming}, action: :update_state, authorize?: false)

      refute updated.data["last_updated_at"] == original_timestamp
    end
  end
end
