defmodule StreampaiWeb.Components.ChatObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone chat widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own message state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view
  alias StreampaiWeb.Utils.FakeChat

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      schedule_next_message()
    end

    initial_messages = FakeChat.initial_messages()

    {:ok,
     socket
     |> stream(:messages, initial_messages)
     |> assign(:user_id, nil)
     |> assign(:widget_config, FakeChat.default_config())
     |> assign(:vue_messages, initial_messages), layout: false}
  end

  # TODO why do we need it? it seems like we were initializing twice instead of just in mount
  @impl true
  def handle_params(params, _uri, socket) do
    user_id = params["user_id"]
    socket = socket |> assign(:user_id, user_id)

    if connected?(socket) and user_id do
      # Subscribe to widget config updates for this user
      Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")

      current_config = FakeChat.default_config()
      socket = assign(socket, :widget_config, current_config)

      {:noreply, socket}
    else
      {:noreply, socket}
    end
  end

  @impl true
  def handle_info(:generate_message, socket) do
    new_message = FakeChat.generate_message()
    _max_messages = socket.assigns.widget_config.max_messages

    # Add new message to stream and let stream handle limiting
    socket = stream_insert(socket, :messages, new_message)

    # Keep track of messages for Vue component in a separate assign
    # Use prepend (O(1)) - Vue component will handle ordering for display
    current_vue_messages = Map.get(socket.assigns, :vue_messages, [])
    updated_vue_messages = [new_message | current_vue_messages]

    # Limit messages to max_messages
    limited_vue_messages =
      Enum.take(updated_vue_messages, socket.assigns.widget_config.max_messages)

    socket = assign(socket, :vue_messages, limited_vue_messages)

    # Schedule the next message
    schedule_next_message()

    {:noreply, socket}
  end

  # Handle widget config updates from PubSub
  def handle_info(%{config: new_config}, socket) do
    # For now, just update the config. Stream limiting is complex without being able to enumerate streams
    # In a real implementation, you might track message count separately or reset the stream
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  @impl true
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

  defp schedule_next_message do
    # 500ms = twice per second
    delay = 1000
    Process.send_after(self(), :generate_message, delay)
  end
end
