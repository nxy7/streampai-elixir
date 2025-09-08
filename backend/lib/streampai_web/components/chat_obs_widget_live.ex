defmodule StreampaiWeb.Components.ChatObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone chat widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own message state and subscribes to configuration changes.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :display,
    widget_type: :chat_widget

  alias Streampai.Fake.Chat

  defp initialize_display_assigns(socket) do
    initial_messages = Chat.initial_messages()

    socket
    |> stream(:messages, initial_messages)
    |> assign(:vue_messages, initial_messages)
  end

  defp subscribe_to_real_events(_user_id) do
    # For chat widget, we generate demo messages for now
    # In production, this would subscribe to real chat events
    schedule_demo_message()
  end

  defp handle_real_event(socket, _event_data) do
    # Handle real chat events here
    {:noreply, socket}
  end

  defp handle_demo_message_generation(socket) do
    new_message = Chat.generate_message()

    # Add new message to stream and let stream handle limiting
    socket = stream_insert(socket, :messages, new_message)

    # Keep track of messages for Vue component in a separate assign
    current_vue_messages = Map.get(socket.assigns, :vue_messages, [])
    updated_vue_messages = [new_message | current_vue_messages]

    # Limit messages to max_messages
    limited_vue_messages =
      Enum.take(updated_vue_messages, socket.assigns.widget_config.max_messages)

    socket = assign(socket, :vue_messages, limited_vue_messages)

    # Schedule the next message
    schedule_demo_message()

    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen">
      <.vue
        v-component="ChatWidget"
        v-socket={@socket}
        config={@widget_config}
        messages={@vue_messages}
        class="w-full h-full"
        id="live-chat-widget"
      />
    </div>
    """
  end

  # Helper functions

  defp schedule_demo_message do
    delay = 1000
    Process.send_after(self(), :generate_demo_message, delay)
  end
end
