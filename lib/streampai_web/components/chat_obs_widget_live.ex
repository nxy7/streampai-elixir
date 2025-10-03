defmodule StreampaiWeb.Components.ChatObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone chat widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own message state and subscribes to configuration changes.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :display,
    widget_type: :chat_widget

  defp initialize_display_assigns(socket) do
    assign(socket, :current_messages, [])
  end

  defp subscribe_to_real_events(user_id) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "chat:#{user_id}")
  end

  defp handle_real_event(socket, chat_event) do
    current_messages = socket.assigns.current_messages || []
    max_messages = socket.assigns.widget_config.max_messages || 50

    # Transform the chat event to match widget format
    widget_message = transform_chat_event(chat_event)

    # Keep 2x max_messages as buffer (in case some messages are filtered out on frontend)
    # This ensures we always have enough messages to display after filtering
    buffer_size = max_messages * 2
    updated_messages = Enum.take([widget_message | current_messages], buffer_size)

    {:noreply, assign(socket, :current_messages, updated_messages)}
  end

  defp transform_chat_event(event) do
    %{
      id: event.id,
      username: event.username,
      content: event.message,
      platform: platform_info(event.platform),
      timestamp: event.timestamp,
      is_moderator: Map.get(event, :is_moderator, false),
      is_owner: Map.get(event, :is_owner, false),
      profile_image_url: Map.get(event, :profile_image_url)
    }
  end

  defp platform_info(:youtube), do: %{icon: "youtube", color: "bg-red-600"}
  defp platform_info(:twitch), do: %{icon: "twitch", color: "bg-purple-600"}
  defp platform_info(:facebook), do: %{icon: "facebook", color: "bg-blue-600"}
  defp platform_info(:kick), do: %{icon: "kick", color: "bg-green-600"}
  defp platform_info(_), do: %{icon: "twitch", color: "bg-purple-600"}

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen">
      <.vue
        v-component="ChatWidget"
        v-socket={@socket}
        config={@widget_config}
        messages={@current_messages}
        class="w-full h-full"
        id="live-chat-widget"
      />
    </div>
    """
  end

  # Override handle_info to catch real chat messages
  def handle_info({:chat_message, chat_event}, socket) do
    handle_real_event(socket, chat_event)
  end

  # Delegate other messages to the WidgetBehaviour default implementation
  def handle_info(msg, socket) do
    super(msg, socket)
  end
end
