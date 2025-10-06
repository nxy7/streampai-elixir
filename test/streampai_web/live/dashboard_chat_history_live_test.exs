defmodule StreampaiWeb.DashboardChatHistoryLiveTest do
  use StreampaiWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream

  describe "DashboardChatHistoryLive" do
    test "renders chat history page", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _view, html} = live(conn, "/dashboard/chat-history")

      # Should render the page title
      assert html =~ "Chat History"

      # Should render filter section
      assert html =~ "Filter Chat Messages"

      # Should render messages section
      assert html =~ "Recent Messages"

      # Should show message count in pagination
      assert html =~ "messages"
    end

    test "displays chat messages with real data", %{conn: conn} do
      {conn, user} = register_and_log_in_user(conn)

      # Create a livestream
      {:ok, livestream} =
        Livestream.create(%{
          user_id: user.id,
          started_at: DateTime.utc_now(),
          title: "Test Stream"
        })

      # Create chat messages
      for i <- 1..25 do
        ChatMessage.create!(%{
          id: "msg_#{i}",
          message: "Test message #{i}",
          sender_username: "user_#{i}",
          platform: Enum.random([:twitch, :youtube]),
          sender_channel_id: "channel_#{i}",
          user_id: user.id,
          livestream_id: livestream.id,
          sender_is_moderator: false,
          sender_is_patreon: false
        })
      end

      {:ok, view, _html} = live(conn, "/dashboard/chat-history")

      chat_messages = :sys.get_state(view.pid).socket.assigns.chat_messages
      assert length(chat_messages) == 20
    end

    test "messages have required fields", %{conn: conn} do
      {conn, user} = register_and_log_in_user(conn)

      # Create a livestream
      {:ok, livestream} =
        Livestream.create(%{
          user_id: user.id,
          started_at: DateTime.utc_now(),
          title: "Test Stream"
        })

      # Create a chat message
      ChatMessage.create!(%{
        id: "test_msg",
        message: "Hello world",
        sender_username: "test_user",
        platform: :twitch,
        sender_channel_id: "test_channel",
        user_id: user.id,
        livestream_id: livestream.id,
        sender_is_moderator: true
      })

      {:ok, view, _html} = live(conn, "/dashboard/chat-history")

      chat_messages = :sys.get_state(view.pid).socket.assigns.chat_messages

      # Check first message has all required fields
      message = List.first(chat_messages)
      assert message.sender_username == "test_user"
      assert message.message == "Hello world"
      assert message.platform == :twitch
      assert message.sender_is_moderator == true
      assert %DateTime{} = message.inserted_at
    end
  end
end
