defmodule StreampaiWeb.Components.ChatObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone chat widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own message state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.ChatDisplayComponent
  alias StreampaiWeb.Utils.FakeChat

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      schedule_next_message()
    end

    initial_messages = FakeChat.initial_messages()
    
    {:ok,
     socket
     |> assign(:messages, initial_messages)
     |> assign(:user_id, nil)
     |> assign(:widget_config, FakeChat.default_config()), layout: false}
  end

  @impl true
  def handle_params(params, _uri, socket) do
    user_id = params["user_id"]
    socket = socket |> assign(:user_id, user_id)

    if connected?(socket) and user_id do
      # Subscribe to widget config updates for this user
      Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")

      # Load user's current config if available, otherwise use default
      # For now, we'll use the default config but this is where we'd fetch user's saved config
      current_config = FakeChat.default_config()
      socket = assign(socket, :widget_config, current_config)

      # Start generating fake messages
      schedule_next_message()

      {:noreply, socket}
    else
      {:noreply, socket}
    end
  end

  @impl true
  def handle_info(:generate_message, socket) do
    new_message = FakeChat.generate_message()
    max_messages = socket.assigns.widget_config.max_messages

    # Add new message and respect max_messages limit
    updated_messages =
      (socket.assigns.messages ++ [new_message])
      |> Enum.take(-max_messages)

    # Schedule the next message
    schedule_next_message()

    {:noreply, assign(socket, :messages, updated_messages)}
  end

  # Handle widget config updates from PubSub
  def handle_info(%{config: new_config}, socket) do
    # Update max messages limit if changed
    updated_messages =
      if length(socket.assigns.messages) > new_config.max_messages do
        socket.assigns.messages |> Enum.take(-new_config.max_messages)
      else
        socket.assigns.messages
      end

    {:noreply,
     socket
     |> assign(:widget_config, new_config)
     |> assign(:messages, updated_messages)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen">
      <.chat_display id="live-chat-widget" config={@widget_config} messages={@messages} />
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
