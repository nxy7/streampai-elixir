defmodule Streampai.Stream.StreamActor.Changes.InitializeDataTest do
  use Streampai.DataCase, async: true

  alias Streampai.Accounts.User
  alias Streampai.Stream.StreamActor
  alias Streampai.Stream.StreamActor.Changes.InitializeData

  describe "build_initial_data/2" do
    test "builds data map with idle status and nil message" do
      data = InitializeData.build_initial_data(:idle, nil)

      assert data["status"] == "idle"
      assert data["status_message"] == nil
      assert data["viewers"] == %{}
      assert data["total_viewers"] == 0
      assert data["platforms"] == %{}
      assert data["input_streaming"] == false
      assert is_binary(data["last_updated_at"])
    end

    test "builds data map with custom status" do
      data = InitializeData.build_initial_data(:streaming, "Starting stream")

      assert data["status"] == "streaming"
      assert data["status_message"] == "Starting stream"
    end

    test "builds data map with starting status" do
      data = InitializeData.build_initial_data(:starting, "Initializing...")

      assert data["status"] == "starting"
      assert data["status_message"] == "Initializing..."
    end

    test "includes valid ISO8601 timestamp" do
      data = InitializeData.build_initial_data(:idle, nil)

      {:ok, _datetime, _offset} = DateTime.from_iso8601(data["last_updated_at"])
    end
  end

  describe "upsert_for_user action with set_user_id option" do
    test "sets user_id from argument" do
      user =
        Ash.Seed.seed!(User, %{
          email: "test@example.com",
          name: "Test User"
        })

      {:ok, actor} = StreamActor.upsert_for_user(user.id, authorize?: false)

      assert actor.user_id == user.id
      assert actor.data["status"] == "idle"
    end

    test "creates actor with custom status" do
      user =
        Ash.Seed.seed!(User, %{
          email: "test@example.com",
          name: "Test User"
        })

      {:ok, actor} =
        Ash.create(
          StreamActor,
          %{user_id: user.id, status: :starting, status_message: "Initializing..."},
          action: :upsert_for_user,
          authorize?: false
        )

      assert actor.user_id == user.id
      assert actor.data["status"] == "starting"
      assert actor.data["status_message"] == "Initializing..."
    end
  end
end
