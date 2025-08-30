defmodule StreampaiWeb.ChatHistoryLiveTest do
  use StreampaiWeb.ConnCase
  import Phoenix.LiveViewTest

  describe "ChatHistoryLive" do
    test "renders chat history page with generated messages", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _view, html} = live(conn, "/dashboard/chat-history")

      # Should render the page title
      assert html =~ "Chat History"
      
      # Should render filter section
      assert html =~ "Filter Chat Messages"
      
      # Should render messages section
      assert html =~ "Recent Messages"
      
      # Should contain platform badges (Twitch or YouTube)
      assert html =~ "Twitch" or html =~ "YouTube"
      
      # Should show message count in pagination
      assert html =~ "messages"
      assert html =~ "Showing"
    end

    test "generates exactly 20 chat messages", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, view, _html} = live(conn, "/dashboard/chat-history")
      
      # Check that we have exactly 20 messages
      chat_messages = :sys.get_state(view.pid).socket.assigns.chat_messages
      assert length(chat_messages) == 20
    end

    test "messages have required fields", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, view, _html} = live(conn, "/dashboard/chat-history")
      
      chat_messages = :sys.get_state(view.pid).socket.assigns.chat_messages
      
      # Check first message has all required fields
      message = List.first(chat_messages)
      assert Map.has_key?(message, :username)
      assert Map.has_key?(message, :message)
      assert Map.has_key?(message, :platform)
      assert Map.has_key?(message, :minutes_ago)
      assert message.platform in [:twitch, :youtube]
    end
  end
end