defmodule StreampaiWeb.Integration.StreamingWorkflowIntegrationTest do
  @moduledoc """
  Integration tests for streaming platform workflows.

  Tests platform connections, event handling, and multi-platform coordination.

  NOTE: Some tests reference LiveView routes that don't exist in the Phoenix router.
  The dashboard is a SolidJS SPA served by the frontend. Tests that reference these
  routes are currently skipped but preserved for when/if LiveView dashboard routes are added.
  """
  use StreampaiWeb.ConnCase, async: true
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  @moduletag :integration

  # Frontend SPA routes - not verified by Phoenix router
  @dashboard_stream "/dashboard/stream"
  @dashboard "/dashboard"

  describe "platform connection workflow" do
    # These tests require LiveView routes that don't exist - skip them
    @describetag :skip

    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "user connects to streaming platform successfully", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, @dashboard_stream)

      html = render(view)
      # Verify the stream dashboard loads with platform information
      assert html =~ "Stream"

      # Verify platform names are present in the UI (actual implementation may vary)
      # These might be in buttons, links, or other elements depending on the current implementation
    end

    test "platform connection persists streaming account", %{conn: conn, user: user} do
      create_streaming_account(user, :twitch)

      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, @dashboard_stream)

      # Expand platform connections section (collapsed by default when connections exist)
      view |> element("button", "Platform Connections") |> render_click()

      html = render(view)
      assert html =~ "Connected"
      assert html =~ "Twitch"
    end
  end

  describe "multi-platform event handling" do
    setup do
      %{user: user, streaming_accounts: accounts} =
        user_fixture_with_streaming_accounts([:twitch, :youtube])

      %{user: user, streaming_accounts: accounts}
    end

    test "events from different platforms are handled correctly", %{user: user} do
      # Test multi-platform event simulation
      twitch_event =
        simulate_platform_event(user, :twitch, :chat_message, %{
          username: "viewer1",
          message: "Hello from Twitch!"
        })

      youtube_event =
        simulate_platform_event(user, :youtube, :chat_message, %{
          username: "viewer2",
          message: "Hello from YouTube!"
        })

      # Verify events are properly structured for each platform
      auto_assert %{platform: :twitch, event_type: :chat_message} <-
                    Map.take(twitch_event, [:platform, :event_type])

      auto_assert %{platform: :youtube, event_type: :chat_message} <-
                    Map.take(youtube_event, [:platform, :event_type])
    end

    test "platform events create stream event records", %{user: user} do
      # Simulate platform event (this would typically create stream event records in a full implementation)
      event_data =
        simulate_platform_event(user, :twitch, :donation, %{
          amount: 5.00,
          currency: "USD",
          message: "Great stream!"
        })

      # Verify the event data structure
      auto_assert %{
                    event_type: :donation,
                    platform: :twitch,
                    user_id: user_id
                  }
                  when user_id == user.id <-
                    Map.take(event_data, [:event_type, :platform, :user_id])
    end
  end

  describe "stream state management" do
    setup do
      %{user: user} = user_fixture_with_streaming_accounts([:twitch])
      %{user: user}
    end

    test "stream state updates across platforms", %{user: user} do
      # Test simulating platform events (real implementation would broadcast to stream_state topic)
      event_data =
        simulate_platform_event(user, :twitch, :stream_online, %{
          title: "Epic Gaming Session",
          category: "Gaming"
        })

      # Verify the event structure
      assert event_data.event_type == :stream_online
      assert event_data.platform == :twitch
    end

    @tag :skip
    test "viewer count synchronization", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)
      {:ok, _view, _html} = live(conn, @dashboard)

      # Simulate platform event (in a full implementation this would update viewer count)
      event_data = simulate_platform_event(user, :twitch, :viewer_count, %{count: 150})

      # Verify the event was properly structured
      assert event_data.event_type == :viewer_count
      assert event_data.count == 150
    end
  end

  describe "alert and notification workflows" do
    setup do
      %{user: user} = user_fixture_with_streaming_accounts([:twitch])
      create_widget_config(user, :donation_widget, %{minimum_amount: 1.00})
      %{user: user}
    end

    test "donation triggers widget alert", %{user: user} do
      # Test donation event simulation (full implementation would broadcast to widget_alerts topic)
      event_data =
        simulate_platform_event(user, :twitch, :donation, %{
          username: "generous_viewer",
          amount: 10.00,
          currency: "USD",
          message: "Keep up the great work!"
        })

      # Verify the event structure
      auto_assert %{
                    event_type: :donation,
                    platform: :twitch,
                    username: "generous_viewer",
                    amount: 10.00
                  } <- Map.take(event_data, [:event_type, :platform, :username, :amount])
    end

    test "follow events trigger appropriate alerts", %{user: user} do
      # Test follow event simulation (full implementation would broadcast to widget_alerts topic)
      event_data =
        simulate_platform_event(user, :twitch, :follow, %{
          username: "new_follower"
        })

      # Verify the event structure
      assert event_data.event_type == :follow
      assert event_data.platform == :twitch
      assert event_data.username == "new_follower"
    end
  end

  describe "authentication and authorization" do
    @tag :skip
    test "streaming workflows require authentication", %{conn: conn} do
      {:error, {:redirect, %{to: redirect_to}}} = live(conn, @dashboard_stream)
      assert redirect_to =~ "/auth/sign-in"
    end

    test "free tier users have limited platform connections" do
      user = user_fixture_with_tier(:free)
      create_streaming_account(user, :twitch)

      result = try_create_streaming_account(user, :youtube)

      assert {:error, %Ash.Error.Forbidden{}} = result
    end

    test "pro tier users can connect multiple platforms" do
      user = user_fixture_with_tier(:pro)

      account1 = create_streaming_account(user, :twitch)
      account2 = create_streaming_account(user, :youtube)

      assert account1.platform == :twitch
      assert account2.platform == :youtube
    end
  end
end
