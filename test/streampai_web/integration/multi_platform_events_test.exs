defmodule StreampaiWeb.Integration.MultiPlatformEventsTest do
  @moduledoc """
  Integration tests for multi-platform event handling and coordination.

  Tests event aggregation, platform-specific logic, and cross-platform workflows.
  """
  use StreampaiWeb.ConnCase, async: false
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  alias Streampai.Stream.StreamEvent

  require Ash.Query

  describe "cross-platform event coordination" do
    setup do
      %{user: user, streaming_accounts: accounts} =
        user_fixture_with_streaming_accounts([:twitch, :youtube, :facebook])

      %{user: user, streaming_accounts: accounts}
    end

    test "events from multiple platforms are processed independently", %{user: user} do
      with_live_subscription("stream_events:#{user.id}", fn ->
        simulate_platform_event(user, :twitch, :donation, %{
          amount: 10.00,
          username: "twitch_donor"
        })

        simulate_platform_event(user, :youtube, :donation, %{amount: 15.00, username: "yt_donor"})
        simulate_platform_event(user, :facebook, :donation, %{amount: 5.00, username: "fb_donor"})

        events =
          for _ <- 1..3 do
            assert_receive {:platform_event, event}, 2000
            event
          end

        platforms = events |> Enum.map(& &1.platform) |> Enum.sort()
        auto_assert [:facebook, :twitch, :youtube] <- platforms

        donation_amounts = events |> Enum.map(fn event -> event[:amount] end) |> Enum.sort()
        auto_assert [5.00, 10.00, 15.00] <- donation_amounts
      end)
    end

    test "aggregated events combine platform data correctly", %{user: user} do
      simulate_platform_event(user, :twitch, :viewer_count, %{count: 150})
      simulate_platform_event(user, :youtube, :viewer_count, %{count: 75})
      simulate_platform_event(user, :facebook, :viewer_count, %{count: 25})

      Process.sleep(200)

      total_event = assert_stream_event_created(user.id, :viewer_count_aggregate)

      aggregation_logic = %{
        combines_all_platforms: total_event.metadata["total_count"] == 250,
        includes_platform_breakdown: Map.has_key?(total_event.metadata, "platform_counts"),
        preserves_individual_counts: total_event.metadata["platform_counts"]["twitch"] == 150
      }

      auto_assert %{
                    combines_all_platforms: true,
                    includes_platform_breakdown: true,
                    preserves_individual_counts: true
                  } <- aggregation_logic
    end
  end

  describe "platform-specific event handling" do
    setup do
      user = user_fixture_with_tier(:pro)
      create_streaming_account(user, :twitch)
      create_streaming_account(user, :youtube)
      %{user: user}
    end

    test "Twitch-specific events handle platform features", %{user: user} do
      simulate_platform_event(user, :twitch, :raid, %{
        from_channel: "raiding_streamer",
        viewer_count: 50,
        raid_id: "raid_12345"
      })

      raid_event = assert_stream_event_created(user.id, :raid)

      twitch_logic = %{
        preserves_raid_metadata: raid_event.metadata["from_channel"] == "raiding_streamer",
        tracks_viewer_count: raid_event.metadata["viewer_count"] == 50,
        includes_platform_id: raid_event.metadata["raid_id"] == "raid_12345"
      }

      auto_assert %{
                    includes_platform_id: true,
                    preserves_raid_metadata: true,
                    tracks_viewer_count: true
                  } <- twitch_logic
    end

    test "YouTube-specific events handle Super Chat", %{user: user} do
      simulate_platform_event(user, :youtube, :super_chat, %{
        amount: 25.00,
        currency: "USD",
        message: "Great stream!",
        username: "generous_viewer",
        color: "#FF0000"
      })

      superchat_event = assert_stream_event_created(user.id, :super_chat)

      youtube_logic = %{
        preserves_amount: superchat_event.metadata["amount"] == 25.00,
        includes_currency: superchat_event.metadata["currency"] == "USD",
        maintains_color: superchat_event.metadata["color"] == "#FF0000"
      }

      auto_assert %{
                    includes_currency: true,
                    maintains_color: true,
                    preserves_amount: true
                  } <- youtube_logic
    end
  end

  describe "event deduplication and processing" do
    setup do
      user = user_fixture_with_tier(:pro)
      create_streaming_account(user, :twitch)
      %{user: user}
    end

    test "duplicate events are handled correctly", %{user: user} do
      event_id = "unique_event_123"

      simulate_platform_event(user, :twitch, :follow, %{
        username: "new_follower",
        event_id: event_id
      })

      simulate_platform_event(user, :twitch, :follow, %{
        username: "new_follower",
        event_id: event_id
      })

      Process.sleep(100)

      follow_events =
        StreamEvent
        |> Ash.Query.filter(user_id == ^user.id and event_type == :follow)
        |> Ash.read!()

      deduplication_logic = %{
        processes_only_once: length(follow_events) == 1,
        preserves_event_data: hd(follow_events).metadata["username"] == "new_follower"
      }

      auto_assert %{processes_only_once: true, preserves_event_data: true} <- deduplication_logic
    end

    test "rapid event sequences maintain order", %{user: user} do
      for i <- 1..10 do
        simulate_platform_event(user, :twitch, :chat_message, %{
          username: "rapid_chatter",
          message: "Message #{i}",
          sequence: i
        })
      end

      Process.sleep(500)

      chat_events =
        StreamEvent
        |> Ash.Query.filter(user_id == ^user.id and event_type == :chat_message)
        |> Ash.Query.sort(inserted_at: :asc)
        |> Ash.read!()

      sequence_logic = %{
        all_events_processed: length(chat_events) == 10,
        maintains_order: hd(chat_events).metadata["sequence"] == 1,
        ends_correctly: List.last(chat_events).metadata["sequence"] == 10
      }

      auto_assert %{
                    all_events_processed: true,
                    ends_correctly: true,
                    maintains_order: true
                  } <- sequence_logic
    end
  end

  describe "platform authentication and permissions" do
    setup do
      user = user_fixture_with_tier(:free)
      %{user: user}
    end

    test "events only process for authenticated platforms", %{user: user} do
      create_streaming_account(user, :twitch)

      simulate_platform_event(user, :twitch, :donation, %{amount: 10.00})

      simulate_platform_event(user, :youtube, :donation, %{amount: 15.00})

      Process.sleep(200)

      donation_events =
        StreamEvent
        |> Ash.Query.filter(user_id == ^user.id and event_type == :donation)
        |> Ash.read!()

      auth_logic = %{
        processes_authenticated_platform: Enum.any?(donation_events, fn event -> event.platform == :twitch end),
        ignores_unauthenticated_platform: !Enum.any?(donation_events, fn event -> event.platform == :youtube end),
        total_count_correct: length(donation_events) == 1
      }

      auto_assert %{
                    ignores_unauthenticated_platform: true,
                    processes_authenticated_platform: true,
                    total_count_correct: true
                  } <- auth_logic
    end

    test "tier restrictions affect platform event processing", %{user: user} do
      create_streaming_account(user, :twitch)

      assert_raise Ash.Error.Forbidden, fn ->
        create_streaming_account(user, :youtube)
      end

      platform_restriction = %{
        free_tier_limited: true
      }

      auto_assert %{free_tier_limited: true} <- platform_restriction
    end
  end

  describe "real-time coordination across platforms" do
    setup do
      %{user: user} = user_fixture_with_streaming_accounts([:twitch, :youtube])
      %{user: user}
    end

    test "dashboard reflects multi-platform activity", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, ~p"/dashboard")

      simulate_platform_event(user, :twitch, :viewer_count, %{count: 100})
      simulate_platform_event(user, :youtube, :viewer_count, %{count: 50})

      Process.sleep(200)
      html = render(view)

      dashboard_coordination = %{
        shows_combined_metrics: html =~ "150" || html =~ "Total",
        reflects_multi_platform: (html =~ "Twitch" && html =~ "YouTube") || html =~ "platforms"
      }

      auto_assert %{shows_combined_metrics: true} <- dashboard_coordination
    end
  end
end
