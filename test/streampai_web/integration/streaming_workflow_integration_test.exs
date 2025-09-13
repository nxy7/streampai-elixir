defmodule StreampaiWeb.Integration.StreamingWorkflowIntegrationTest do
  @moduledoc """
  Integration tests for streaming platform workflows.

  Tests platform connections, event handling, and multi-platform coordination.
  """
  use StreampaiWeb.ConnCase, async: false
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  alias Phoenix.Socket.Broadcast

  describe "platform connection workflow" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "user connects to streaming platform successfully", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, ~p"/dashboard/stream")

      html = render(view)
      assert html =~ "Connect Platform"

      assert html =~ "Twitch"
      assert html =~ "YouTube"
      assert html =~ "Facebook"
    end

    test "platform connection persists streaming account", %{conn: conn, user: user} do
      create_streaming_account(user, :twitch)

      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, ~p"/dashboard/stream")

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
      with_live_subscription("stream_events:#{user.id}", fn ->
        simulate_platform_event(user, :twitch, :chat_message, %{
          username: "viewer1",
          message: "Hello from Twitch!"
        })

        simulate_platform_event(user, :youtube, :chat_message, %{
          username: "viewer2",
          message: "Hello from YouTube!"
        })

        assert_receive {:platform_event, twitch_event}
        assert_receive {:platform_event, youtube_event}

        auto_assert %{platform: :twitch, event_type: :chat_message} <- twitch_event
        auto_assert %{platform: :youtube, event_type: :chat_message} <- youtube_event
      end)
    end

    test "platform events create stream event records", %{user: user} do
      simulate_platform_event(user, :twitch, :donation, %{
        amount: 5.00,
        currency: "USD",
        message: "Great stream!"
      })

      event = assert_stream_event_created(user.id, :donation)

      auto_assert %{
                    event_type: :donation,
                    platform: :twitch,
                    user_id: user_id
                  }
                  when user_id == user.id <- Map.take(event, [:event_type, :platform, :user_id])
    end
  end

  describe "stream state management" do
    setup do
      %{user: user} = user_fixture_with_streaming_accounts([:twitch])
      %{user: user}
    end

    test "stream state updates across platforms", %{user: user} do
      with_live_subscription("stream_state:#{user.id}", fn ->
        simulate_platform_event(user, :twitch, :stream_online, %{
          title: "Epic Gaming Session",
          category: "Gaming"
        })

        assert_receive {:platform_event, %{event_type: :stream_online}}
      end)
    end

    test "viewer count synchronization", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, ~p"/dashboard")

      simulate_platform_event(user, :twitch, :viewer_count, %{count: 150})

      html = render(view)
      assert html =~ "150"
    end
  end

  describe "alert and notification workflows" do
    setup do
      %{user: user} = user_fixture_with_streaming_accounts([:twitch])
      create_widget_config(user, :donation_widget, %{minimum_amount: 1.00})
      %{user: user}
    end

    test "donation triggers widget alert", %{user: user} do
      with_live_subscription("widget_alerts:#{user.id}", fn ->
        simulate_platform_event(user, :twitch, :donation, %{
          username: "generous_viewer",
          amount: 10.00,
          currency: "USD",
          message: "Keep up the great work!"
        })

        assert_receive %Broadcast{
          topic: "widget_alerts:" <> _,
          event: "new_alert",
          payload: alert_data
        }

        auto_assert %{
                      type: :donation,
                      amount: 10.00,
                      username: "generous_viewer"
                    } <- alert_data
      end)
    end

    test "follow events trigger appropriate alerts", %{user: user} do
      with_live_subscription("widget_alerts:#{user.id}", fn ->
        simulate_platform_event(user, :twitch, :follow, %{
          username: "new_follower"
        })

        assert_receive %Broadcast{
          event: "new_alert",
          payload: %{type: :follow, username: "new_follower"}
        }
      end)
    end
  end

  describe "authentication and authorization" do
    test "streaming workflows require authentication", %{conn: conn} do
      {:error, {:redirect, %{to: "/auth/sign_in"}}} = live(conn, ~p"/dashboard/stream")
    end

    test "free tier users have limited platform connections" do
      user = user_fixture_with_tier(:free)
      create_streaming_account(user, :twitch)

      assert_raise Ash.Error.Forbidden, fn ->
        create_streaming_account(user, :youtube)
      end
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
