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

    messages = assigns.messages |> Enum.take(assigns.config.max_messages)

    assigns =
      assigns
      |> assign(:font_class, font_class)
      |> assign(:messages, messages)

    ~H"""
    <div class="chat-widget text-white h-96 flex flex-col">
      <!-- Chat Messages Container -->
      <div 
        id={"chat-messages-#{@id}"} 
        class="flex-1 overflow-y-auto p-3 chat-messages-container"
      >
        <div class="min-h-full flex flex-col justify-end">
          <div class="space-y-2" id={"messages-#{@id}"}>
          <%= for message <- @messages do %>
            <div id={"messages-#{@id}-#{message.id}"} class={"chat-message flex items-start space-x-2 #{@font_class}"}>
            <!-- Platform Icon (leftmost) -->
            <%= if @config.show_platform do %>
              <.platform_icon platform={message.platform} />
            <% end %>
            
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
      </div>
    </div>
    """
  end

  # Platform icon component
  defp platform_icon(%{platform: %{icon: "twitch"}} = assigns) do
    ~H"""
    <div class={"w-5 h-5 rounded flex items-center justify-center #{@platform.color}"}>
      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z" />
      </svg>
    </div>
    """
  end

  defp platform_icon(%{platform: %{icon: "youtube"}} = assigns) do
    ~H"""
    <div class={"w-5 h-5 rounded flex items-center justify-center #{@platform.color}"}>
      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </div>
    """
  end

  defp platform_icon(%{platform: %{icon: "facebook"}} = assigns) do
    ~H"""
    <div class={"w-5 h-5 rounded flex items-center justify-center #{@platform.color}"}>
      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </div>
    """
  end

  defp platform_icon(%{platform: %{icon: "kick"}} = assigns) do
    ~H"""
    <div class={"w-5 h-5 rounded flex items-center justify-center #{@platform.color}"}>
      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
    """
  end

  # Fallback for unknown platforms
  defp platform_icon(%{platform: _platform} = assigns) do
    ~H"""
    <div class={"w-5 h-5 rounded flex items-center justify-center #{@platform.color}"}>
      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </div>
    """
  end
end
