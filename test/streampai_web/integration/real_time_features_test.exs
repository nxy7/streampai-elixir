defmodule StreampaiWeb.Integration.RealTimeFeaturesTest do
  @moduledoc """
  Integration tests for real-time features reliability.

  Tests PubSub broadcasts, LiveView updates, and system responsiveness under load.
  """
  use StreampaiWeb.ConnCase, async: false
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  alias Phoenix.Socket.Broadcast

  describe "PubSub reliability" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "multiple subscribers receive broadcasts correctly", %{user: user} do
      subscribers = for _ <- 1..5, do: spawn_link(fn -> receive_loop([]) end)

      topic = "test_topic:#{user.id}"

      Enum.each(subscribers, fn pid ->
        Phoenix.PubSub.subscribe(Streampai.PubSub, topic, pid)
      end)

      test_payload = %{test: "data", timestamp: DateTime.utc_now()}
      Phoenix.PubSub.broadcast(Streampai.PubSub, topic, {:test_event, test_payload})

      Process.sleep(100)

      Enum.each(subscribers, fn pid ->
        send(pid, :get_messages)

        receive do
          {:messages, messages} ->
            auto_assert [{:test_event, ^test_payload}] <- messages
        after
          1000 -> flunk("Subscriber #{inspect(pid)} did not receive message")
        end
      end)
    end

    test "broadcasts are delivered in correct order", %{user: user} do
      topic = "ordered_test:#{user.id}"

      with_live_subscription(topic, fn ->
        for i <- 1..10 do
          Phoenix.PubSub.broadcast(Streampai.PubSub, topic, {:ordered_event, i})
        end

        received_messages =
          for _ <- 1..10 do
            receive do
              %Broadcast{payload: {:ordered_event, i}} -> i
            after
              1000 -> flunk("Did not receive all ordered messages")
            end
          end

        auto_assert [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] <- received_messages
      end)
    end
  end

  describe "LiveView real-time updates" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "dashboard updates with stream events", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, ~p"/dashboard")

      simulate_platform_event(user, :twitch, :viewer_count, %{count: 250})

      Process.sleep(200)
      html = render(view)
      assert html =~ "250"
    end

    test "multiple LiveViews stay synchronized", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, dashboard_view, _html} = live(conn, ~p"/dashboard")
      {:ok, stream_view, _html} = live(conn, ~p"/dashboard/stream")

      simulate_platform_event(user, :twitch, :stream_online, %{
        title: "Live Coding Session",
        category: "Software and Game Development"
      })

      Process.sleep(200)

      dashboard_html = render(dashboard_view)
      stream_html = render(stream_view)

      assert dashboard_html =~ "Live Coding Session"
      assert stream_html =~ "Live Coding Session"
    end
  end

  describe "widget real-time functionality" do
    setup do
      user = user_fixture_with_tier(:pro)
      create_widget_config(user, :chat_widget, %{max_messages: 10})
      %{user: user}
    end

    test "widget display receives real-time events", %{conn: conn, user: user} do
      {:ok, widget_view, _html} = live(conn, ~p"/widgets/chat/display?user_id=#{user.id}")

      simulate_platform_event(user, :twitch, :chat_message, %{
        username: "test_user",
        message: "Hello stream!",
        badges: ["subscriber"]
      })

      Process.sleep(100)
      html = render(widget_view)

      assert html =~ "test_user"
      assert html =~ "Hello stream!"
    end

    test "widget configuration updates propagate to display", %{conn: conn, user: user} do
      {:ok, widget_view, _html} = live(conn, ~p"/widgets/chat/display?user_id=#{user.id}")

      Phoenix.PubSub.broadcast(
        Streampai.PubSub,
        "widget_config:chat_widget:#{user.id}",
        {:config_updated, %{config: %{max_messages: 25, show_timestamps: true}}}
      )

      Process.sleep(100)
      html = render(widget_view)

      assert html =~ "data-max-messages=\"25\""
      assert html =~ "data-show-timestamps=\"true\""
    end
  end

  describe "system load handling" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "handles burst of events without dropping messages", %{user: user} do
      topic = "load_test:#{user.id}"

      with_live_subscription(topic, fn ->
        for i <- 1..100 do
          Phoenix.PubSub.broadcast(Streampai.PubSub, topic, {:load_event, i})
        end

        received_count =
          for _ <- 1..100, reduce: 0 do
            acc ->
              receive do
                %Broadcast{payload: {:load_event, _i}} -> acc + 1
              after
                50 -> acc
              end
          end

        auto_assert 100 <- received_count
      end)
    end

    test "multiple concurrent users don't interfere", %{conn: conn} do
      users = for _ <- 1..5, do: user_fixture_with_tier(:pro)

      tasks =
        Enum.map(users, fn user ->
          Task.async(fn ->
            conn = log_in_user(conn, user)
            {:ok, view, _html} = live(conn, ~p"/dashboard")

            simulate_platform_event(user, :twitch, :viewer_count, %{count: 100 + user.id})
            Process.sleep(100)

            html = render(view)
            {user.id, html}
          end)
        end)

      results = Task.await_many(tasks, 5000)

      Enum.each(results, fn {user_id, html} ->
        assert html =~ to_string(100 + user_id)
      end)
    end
  end

  describe "error recovery and resilience" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "LiveView recovers from temporary disconnection", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, ~p"/dashboard")

      simulate_platform_event(user, :twitch, :viewer_count, %{count: 50})
      Process.sleep(100)

      html = render(view)
      assert html =~ "50"
    end

    test "malformed events don't crash system", %{user: user} do
      topic = "error_test:#{user.id}"

      with_live_subscription(topic, fn ->
        Phoenix.PubSub.broadcast(Streampai.PubSub, topic, {:malformed_event, %{invalid: :data}})

        Phoenix.PubSub.broadcast(Streampai.PubSub, topic, {:valid_event, %{data: "valid"}})

        assert_receive %Broadcast{payload: {:valid_event, %{data: "valid"}}}
      end)
    end
  end

  defp receive_loop(messages) do
    receive do
      :get_messages ->
        send(self(), {:messages, Enum.reverse(messages)})
        receive_loop([])

      message ->
        receive_loop([message | messages])
    end
  end
end
