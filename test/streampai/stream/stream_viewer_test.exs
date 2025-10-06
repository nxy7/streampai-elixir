defmodule Streampai.Stream.StreamViewerTest do
  use Streampai.DataCase, async: true
  use Mneme

  alias Streampai.Accounts.User
  alias Streampai.Stream.StreamViewer

  setup do
    user =
      Ash.Seed.seed!(User, %{
        email: "test@example.com",
        name: "Test Streamer"
      })

    %{user: user}
  end

  describe "similarity search" do
    test "finds similar display names using trigram similarity", %{user: user} do
      {:ok, _stream_viewer} =
        StreamViewer.upsert(%{
          viewer_id: "viewer1",
          user_id: user.id,
          display_name: "eferyczny"
        })

      results =
        StreamViewer.by_display_name!(%{
          user_id: user.id,
          display_name: "efferyczny",
          similarity_threshold: 0.3
        })

      auto_assert [found_viewer] <- results
      assert found_viewer.display_name == "eferyczny"
    end

    test "respects similarity threshold", %{user: user} do
      {:ok, _stream_viewer} =
        StreamViewer.upsert(%{
          viewer_id: "viewer1",
          user_id: user.id,
          display_name: "completely_different"
        })

      results =
        StreamViewer.by_display_name!(%{
          user_id: user.id,
          display_name: "xyz",
          similarity_threshold: 0.8
        })

      assert results == []
    end

    test "finds multiple similar names with low threshold", %{user: user} do
      {:ok, _sv1} =
        StreamViewer.upsert(%{
          viewer_id: "viewer1",
          user_id: user.id,
          display_name: "test"
        })

      {:ok, _sv2} =
        StreamViewer.upsert(%{
          viewer_id: "viewer2",
          user_id: user.id,
          display_name: "testing"
        })

      {:ok, _sv3} =
        StreamViewer.upsert(%{
          viewer_id: "viewer3",
          user_id: user.id,
          display_name: "best"
        })

      results =
        StreamViewer.by_display_name!(%{
          user_id: user.id,
          display_name: "test",
          similarity_threshold: 0.1
        })

      names = Enum.map(results, & &1.display_name)
      assert "test" in names
      assert "testing" in names
      assert "best" in names
      assert length(results) == 3
    end
  end
end
