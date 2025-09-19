defmodule Streampai.Stream.ViewerTest do
  use Streampai.DataCase
  use Mneme

  alias Streampai.Stream.Viewer

  describe "creating viewers" do
    test "creates viewer with default attributes" do
      result = Viewer.create(%{})

      auto_assert {:ok, viewer} <- result

      auto_assert %Viewer{
                    id: _id,
                    inserted_at: %DateTime{},
                    updated_at: %DateTime{}
                  } <- viewer

      assert is_binary(viewer.id)
    end
  end

  describe "viewer relationships" do
    test "loads stream_viewers relationship" do
      {:ok, viewer} = Viewer.create(%{})

      # Load viewer with stream_viewers relationship
      viewer_with_stream_viewers = Ash.load!(viewer, [:stream_viewers])

      # Should start with empty stream_viewers
      assert viewer_with_stream_viewers.stream_viewers == []
    end
  end
end
