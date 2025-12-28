defmodule Streampai.Stream.StreamActor.Changes.SetErrorStateTest do
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

  describe "set_error action" do
    test "sets status to error", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{error_message: "Connection lost"},
          action: :set_error,
          authorize?: false
        )

      assert updated.data["status"] == "error"
    end

    test "stores error message", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{error_message: "Connection lost"},
          action: :set_error,
          authorize?: false
        )

      assert updated.data["error_message"] == "Connection lost"
    end

    test "sets error_at timestamp", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{error_message: "Connection lost"},
          action: :set_error,
          authorize?: false
        )

      assert is_binary(updated.data["error_at"])
      {:ok, _datetime, _offset} = DateTime.from_iso8601(updated.data["error_at"])
    end

    test "sets status_message with error prefix", %{actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{error_message: "Connection lost"},
          action: :set_error,
          authorize?: false
        )

      assert updated.data["status_message"] == "Error: Connection lost"
    end

    test "preserves other data fields", %{actor: actor} do
      livestream_id = Ash.UUID.generate()

      {:ok, streaming_actor} =
        Ash.update(
          actor,
          %{livestream_id: livestream_id},
          action: :set_streaming,
          authorize?: false
        )

      {:ok, updated} =
        Ash.update(
          streaming_actor,
          %{error_message: "Stream crashed"},
          action: :set_error,
          authorize?: false
        )

      assert updated.data["livestream_id"] == livestream_id
      assert updated.data["status"] == "error"
    end
  end
end
