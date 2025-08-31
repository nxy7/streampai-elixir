defmodule StreampaiWeb.Components.ChatDisplayComponent do
  @moduledoc """
  Pure function component for displaying livestream chat messages.

  Takes configuration and messages as props, handles no state internally.
  Can be embedded anywhere with different message sources.
  """
  use Phoenix.Component

  @doc """
  Renders a chat widget with the given configuration and messages.

  ## Attributes
  * `config` - Configuration map with display settings
  * `messages` - List of message maps to display
  * `id` - Optional DOM ID for the widget (defaults to "chat-widget")
  """
  attr :config, :map, required: true
  attr :messages, :list, required: true
  attr :id, :string, default: "chat-widget"

  def chat_display(assigns) do
    font_class =
      case assigns.config.font_size do
        "small" -> "text-xs"
        "large" -> "text-lg"
        # medium
        _ -> "text-sm"
      end

    # |> dbg

    messages = assigns.messages |> Enum.take(assigns.config.max_messages)

    assigns =
      assigns
      |> assign(:font_class, font_class)
      |> assign(:messages, messages)

    # dbg(assigns)

    ~H"""
    <div class="chat-widget text-white h-96 flex flex-col">
      <!-- Chat Messages Container -->
      <div id={"chat-messages-#{@id}"} class="flex-1 overflow-y-auto p-3 space-y-2">
        <%= for message <- @messages do %>
          <div class={"chat-message flex items-start space-x-2 #{@font_class}"}>
            <!-- User Badge/Avatar -->
            <%= if @config.show_badges do %>
              <div class={[
                "px-2 py-1 rounded text-xs font-semibold flex-shrink-0",
                message.badge_color
              ]}>
                {message.badge}
              </div>
            <% end %>
            
    <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <%= if @config.show_timestamps do %>
                <span class="text-xs text-gray-500 mr-2">
                  {Calendar.strftime(message.timestamp, "%H:%M")}
                </span>
              <% end %>
              <span class="font-semibold" style={"color: #{message.username_color}"}>
                {message.username}:
              </span>
              <span class="ml-1 text-gray-100">{message.content}</span>
              
    <!-- Emotes/Reactions -->
              <%= if @config.show_emotes and message.emotes != [] do %>
                <div class="inline-flex ml-2 space-x-1">
                  <%= for emote <- message.emotes do %>
                    <span class="text-yellow-400">{emote}</span>
                  <% end %>
                </div>
              <% end %>
            </div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end
end
