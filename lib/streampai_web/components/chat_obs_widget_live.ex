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

    stream(socket, :messages, initial_messages, limit: socket.assigns.widget_config.max_messages)
  end

  defp subscribe_to_real_events(_user_id) do
    schedule_demo_message()
  end

  defp handle_real_event(socket, _event_data) do
    {:noreply, socket}
  end

  defp handle_demo_message_generation(socket) do
    new_message = Chat.generate_message()

    socket = stream_insert(socket, :messages, new_message, at: -1)

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
        messages={stream_to_list(@streams.messages)}
        class="w-full h-full"
        id="live-chat-widget"
      />
    </div>
    """
  end

  defp stream_to_list(stream) do
    stream
    |> Stream.map(fn {_id, message} -> message end)
    |> Enum.to_list()
  end

  defp schedule_demo_message do
    delay = 1000
    Process.send_after(self(), :generate_demo_message, delay)
  end
end
