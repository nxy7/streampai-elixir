defmodule Streampai.Stream.StreamViewerTest do
  use Streampai.DataCase
  use Mneme

  alias Streampai.Accounts.User
  alias Streampai.Stream.StreamViewer
  alias Streampai.Stream.Viewer

  setup do
    user =
      Ash.Seed.seed!(User, %{
        email: "test@example.com",
        name: "Test Streamer"
      })

    {:ok, viewer} = Viewer.create(%{})

    %{user: user, viewer: viewer}
  end

  describe "similarity search" do
    test "finds similar display names using trigram similarity", %{user: user, viewer: viewer} do
      # Create StreamViewer with original name
      {:ok, _stream_viewer} =
        StreamViewer.create(%{
          viewer_id: viewer.id,
          user_id: user.id,
          display_name: "eferyczny"
        })

      # Search for similar name with typo
      results =
        StreamViewer.by_display_name!(%{
          user_id: user.id,
          display_name: "efferyczny",
          similarity_threshold: 0.3
        })

      # Should find the similar name
      auto_assert [found_viewer] <- results
      assert found_viewer.display_name == "eferyczny"
    end

    test "respects similarity threshold", %{user: user, viewer: viewer} do
      # Create StreamViewer with a name
      {:ok, _stream_viewer} =
        StreamViewer.create(%{
          viewer_id: viewer.id,
          user_id: user.id,
          display_name: "completely_different"
        })

      # Search for very different name with high threshold
      results =
        StreamViewer.by_display_name!(%{
          user_id: user.id,
          display_name: "xyz",
          similarity_threshold: 0.8
        })

      # Should find nothing
      assert results == []
    end

    test "finds multiple similar names with low threshold", %{user: user} do
      {:ok, viewer1} = Viewer.create(%{})
      {:ok, viewer2} = Viewer.create(%{})
      {:ok, viewer3} = Viewer.create(%{})

      # Create StreamViewers with varying similarity to "test"
      {:ok, _sv1} =
        StreamViewer.create(%{
          viewer_id: viewer1.id,
          user_id: user.id,
          # exact match
          display_name: "test"
        })

      {:ok, _sv2} =
        StreamViewer.create(%{
          viewer_id: viewer2.id,
          user_id: user.id,
          # high similarity
          display_name: "testing"
        })

      {:ok, _sv3} =
        StreamViewer.create(%{
          viewer_id: viewer3.id,
          user_id: user.id,
          # moderate similarity
          display_name: "best"
        })

      # Search with low threshold to get multiple results
      results =
        StreamViewer.by_display_name!(%{
          user_id: user.id,
          display_name: "test",
          similarity_threshold: 0.1
        })

      # Should return multiple similar names
      names = Enum.map(results, & &1.display_name)
      assert "test" in names
      assert "testing" in names
      assert "best" in names
      assert length(results) == 3
    end
  end
end
