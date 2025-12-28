defmodule Streampai.Stream.StreamActor.Changes.InitializeDataTest do
  use Streampai.DataCase, async: true

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
end
