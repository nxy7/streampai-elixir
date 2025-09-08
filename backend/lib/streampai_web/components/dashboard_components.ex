defmodule StreampaiWeb.Components.DashboardComponents do
  @moduledoc """
  Reusable dashboard UI components for consistent interface patterns.

  This module contains common dashboard elements like cards, status indicators,
  and other UI patterns used across multiple dashboard pages.
  """
  use Phoenix.Component

  @doc """
  Renders a dashboard card with consistent styling.

  ## Examples

      <.dashboard_card title="Account Info" icon="user">
        Card content goes here
      </.dashboard_card>

      <.dashboard_card title="Status" icon="activity" class="bg-red-50">
        <p>Custom content</p>
      </.dashboard_card>
  """
  attr :title, :string, required: true, doc: "Card title"
  attr :icon, :string, default: nil, doc: "Icon name for the card header"
  attr :class, :string, default: "", doc: "Additional CSS classes"
  slot :inner_block, required: true, doc: "Card content"

  def dashboard_card(assigns) do
    ~H"""
    <div class={"bg-white rounded-lg shadow-sm border border-gray-200 p-6 #{@class}"}>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">{@title}</h3>
        <%= if @icon do %>
          <.icon name={@icon} class="w-5 h-5 text-purple-500" />
        <% end %>
      </div>
      {render_slot(@inner_block)}
    </div>
    """
  end

  @doc """
  Renders a status badge with consistent styling.

  ## Examples

      <.status_badge status="online">Online</.status_badge>
      <.status_badge status="offline">Offline</.status_badge>
      <.status_badge status="warning">Warning</.status_badge>
  """
  attr :status, :string,
    required: true,
    doc: "Status type: online, offline, warning, success, error"

  slot :inner_block, required: true, doc: "Badge content"

  def status_badge(assigns) do
    ~H"""
    <span class={status_badge_class(@status)}>
      {render_slot(@inner_block)}
    </span>
    """
  end

  defp status_badge_class("online"),
    do:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"

  defp status_badge_class("offline"),
    do:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"

  defp status_badge_class("warning"),
    do:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"

  defp status_badge_class("success"),
    do:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"

  defp status_badge_class("error"),
    do:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"

  defp status_badge_class(_),
    do:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"

  @doc """
  Renders a status indicator with dot and text.

  ## Examples

      <.status_indicator status="online">Online</.status_indicator>
      <.status_indicator status="offline">Offline</.status_indicator>
  """
  attr :status, :string, required: true, doc: "Status type: online, offline"
  slot :inner_block, required: true, doc: "Status text"

  def status_indicator(assigns) do
    ~H"""
    <div class="flex items-center">
      <div class={"w-2 h-2 rounded-full mr-2 #{status_dot_class(@status)}"}></div>
      <span class={status_text_class(@status)}>
        {render_slot(@inner_block)}
      </span>
    </div>
    """
  end

  defp status_dot_class("online"), do: "bg-green-500"
  defp status_dot_class("offline"), do: "bg-gray-400"
  defp status_dot_class(_), do: "bg-gray-400"

  defp status_text_class("online"), do: "text-sm font-medium text-green-700"
  defp status_text_class("offline"), do: "text-sm text-gray-500"
  defp status_text_class(_), do: "text-sm text-gray-500"

  @doc """
  Renders an info row with label and value.

  ## Examples

      <.info_row label="Email" value={@user.email} />
      <.info_row label="Status">
        <.status_badge status="online">Online</.status_badge>
      </.info_row>
  """
  attr :label, :string, required: true, doc: "Label text"
  attr :value, :string, default: nil, doc: "Value text (optional if using slot)"
  attr :class, :string, default: "", doc: "Additional CSS classes"
  slot :inner_block, doc: "Custom value content"

  def info_row(assigns) do
    ~H"""
    <div class={@class}>
      <p class="text-sm text-gray-500">{@label}</p>
      <%= if @value do %>
        <p class="font-medium">{@value}</p>
      <% else %>
        {render_slot(@inner_block)}
      <% end %>
    </div>
    """
  end

  @doc """
  Renders a platform connection item with icon that changes color based on connection status.

  ## Examples

      <.platform_connection
        name="Twitch"
        platform={:twitch}
        connected={false}
        connect_url="/streaming/connect/twitch"
        color="purple"
        current_user={@current_user}
      />
  """
  attr :name, :string, required: true, doc: "Platform name"
  attr :platform, :atom, default: nil, doc: "Platform identifier for icon selection"
  attr :connected, :boolean, required: true, doc: "Connection status"
  attr :connect_url, :string, required: true, doc: "Connection URL"
  attr :color, :string, default: "purple", doc: "Platform brand color"
  attr :show_disconnect, :boolean, default: false, doc: "Show disconnect button when connected"
  attr :current_user, :map, default: nil, doc: "Current user for permission checks"

  attr :account_data, :map,
    default: nil,
    doc: "Connected account extra data (nickname, avatar, etc.)"

  def platform_connection(assigns) do
    ~H"""
    <div class={"flex items-center justify-between p-3 border rounded-lg #{if @connected, do: "border-#{@color}-200 bg-#{@color}-50", else: "border-gray-200"}"}>
      <div class="flex items-center space-x-3">
        <%= if @connected and @account_data && @account_data["image"] do %>
          <!-- User Avatar for connected accounts -->
          <img
            src={@account_data["image"]}
            alt={@account_data["nickname"] || @account_data["name"] || "User avatar"}
            class="w-8 h-8 rounded-lg object-cover"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          />
          <!-- Fallback platform icon (hidden by default, shown if image fails) -->
          <div
            class={"w-8 h-8 rounded-lg flex items-center justify-center bg-#{@color}-500"}
            style="display: none;"
          >
            {render_platform_icon(assigns)}
          </div>
        <% else %>
          <!-- Platform icon for disconnected accounts or when no avatar -->
          <div class={"w-8 h-8 rounded-lg flex items-center justify-center #{if @connected, do: "bg-#{@color}-500", else: "bg-gray-400"}"}>
            {render_platform_icon(assigns)}
          </div>
        <% end %>

        <div class="flex flex-col">
          <%= if @connected and @account_data do %>
            <!-- Connected: Show nickname and platform name -->
            <span class={"text-sm font-medium #{if @connected, do: "text-#{@color}-800", else: "text-gray-600"}"}>
              {get_display_name(@account_data)}
            </span>
            <span class={"text-xs #{if @connected, do: "text-#{@color}-600", else: "text-gray-500"}"}>
              {@name} • Connected
            </span>
          <% else %>
            <!-- Not connected: Show platform name and status -->
            <span class={"text-sm #{if @connected, do: "text-#{@color}-800 font-medium", else: "text-gray-600"}"}>
              {@name}: {if @connected, do: "Connected", else: "Not connected"}
            </span>
          <% end %>
        </div>
      </div>
      <%= if not @connected do %>
        <%= if can_connect_platform?(@current_user, @platform) do %>
          <a href={@connect_url} class="text-gray-600 hover:text-gray-700 text-sm font-medium">
            Connect
          </a>
        <% else %>
          <span class="text-gray-400 text-sm" title="Upgrade to Pro to connect more platforms">
            Pro Required
          </span>
        <% end %>
      <% else %>
        <div class="relative inline-block group">
          <!-- Default Connected State -->
          <span class={"group-hover:opacity-0 text-#{@color}-600 text-sm font-medium transition-opacity duration-200 inline-block w-28 text-center flex items-center justify-center h-8"}>
            <span class="flex items-center">
              <span class="mr-1">✓</span>
              <span>Connected</span>
            </span>
          </span>
          <!-- Disconnect Button (shows on hover) -->
          <button
            phx-click="disconnect_platform"
            phx-value-platform={@platform}
            class="absolute top-0 left-0 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all duration-200 w-28 h-8 flex items-center justify-center"
          >
            Disconnect
          </button>
        </div>
      <% end %>
    </div>
    """
  end

  @doc """
  Renders an empty state with icon and message.

  ## Examples

      <.empty_state
        icon="chart-bar"
        title="No Analytics Yet"
        message="Analytics will appear here once you start streaming."
      />
  """
  attr :icon, :string, required: true, doc: "Icon name for the empty state"
  attr :title, :string, required: true, doc: "Empty state title"
  attr :message, :string, required: true, doc: "Empty state message"
  attr :class, :string, default: "text-center py-12", doc: "Container CSS classes"

  def empty_state(assigns) do
    ~H"""
    <div class={@class}>
      <.icon name={@icon} class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">{@title}</h3>
      <p class="mt-1 text-sm text-gray-500">{@message}</p>
    </div>
    """
  end

  @doc """
  Renders an icon with consistent styling.
  SVG icons are inlined for better performance and customization.
  """
  attr :name, :string, required: true, doc: "Icon name"
  attr :class, :string, default: "w-5 h-5", doc: "Icon CSS classes"

  # Icon paths map - centralized icon data
  @icon_paths %{
    "user" => "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    "activity" => "M15 10l4.553-2.276A1 1 0 0021 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    "chart-bar" => "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    "lightning" => "M13 10V3L4 14h7v7l9-11h-7z",
    "clock" => "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    "currency-dollar" => "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "users" => "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
    "eye" => "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    "chat-bubble-left" => "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    "heart" => "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
  }

  # Multi-path icons (icons that have multiple <path> elements)
  @multi_path_icons %{
    "play" => [
      "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
      "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    ]
  }

  # Default icon path for unknown icons
  @default_icon_path "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"

  def icon(assigns) do
    icon_name = Map.get(assigns, :name, "default")
    paths = get_icon_paths(icon_name)
    
    assigns = assign(assigns, :paths, paths)
    
    ~H"""
    <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        :for={path <- @paths}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d={path}
      />
    </svg>
    """
  end

  defp get_icon_paths(icon_name) do
    cond do
      Map.has_key?(@multi_path_icons, icon_name) ->
        @multi_path_icons[icon_name]
      
      Map.has_key?(@icon_paths, icon_name) ->
        [@icon_paths[icon_name]]
      
      true ->
        [@default_icon_path]
    end
  end

  @doc """
  Renders a metric card with value, change indicator, and description.

  ## Examples

      <.metric_card
        title="Donations This Month"
        value="$1,234.56"
        change="+12%"
        change_type={:positive}
        icon="currency-dollar"
        description="Total donations received in 2024-01"
      />
  """
  attr :title, :string, required: true, doc: "Metric title"
  attr :value, :any, required: true, doc: "Metric value (can be string or number)"
  attr :change, :string, default: nil, doc: "Change percentage"
  attr :change_type, :atom, default: :neutral, doc: "Change type: :positive, :negative, :neutral"
  attr :icon, :string, required: true, doc: "Icon name for the metric"
  attr :description, :string, default: nil, doc: "Optional description"
  attr :class, :string, default: "", doc: "Additional CSS classes"

  def metric_card(assigns) do
    ~H"""
    <div class={"bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 #{@class}"}>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-purple-100 rounded-lg">
            <.icon name={@icon} class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500 font-medium">{@title}</p>
          </div>
        </div>
        <%= if @change do %>
          <div class={"flex items-center text-sm font-medium #{change_color(@change_type)}"}>
            <.change_icon change_type={@change_type} class="w-4 h-4 mr-1" />
            {@change}
          </div>
        <% end %>
      </div>

      <div class="mt-4">
        <p class="text-3xl font-bold text-gray-900">{@value}</p>
        <%= if @description do %>
          <p class="text-xs text-gray-500 mt-1">{@description}</p>
        <% end %>
      </div>
    </div>
    """
  end

  @doc """
  Renders a change indicator icon based on change type.
  """
  attr :change_type, :atom, required: true
  attr :class, :string, default: "w-4 h-4"

  def change_icon(%{change_type: :positive} = assigns) do
    ~H"""
    <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 11l5-5m0 0l5 5m-5-5v12"
      />
    </svg>
    """
  end

  def change_icon(%{change_type: :negative} = assigns) do
    ~H"""
    <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 13l-5 5m0 0l-5-5m5 5V6"
      />
    </svg>
    """
  end

  def change_icon(assigns) do
    ~H"""
    <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20 12H4"
      />
    </svg>
    """
  end

  # Helper function to get change color based on type
  defp change_color(:positive), do: "text-green-600"
  defp change_color(:negative), do: "text-red-600"
  defp change_color(_), do: "text-gray-500"

  # Helper function to check if a user can connect a platform using Ash policies
  defp can_connect_platform?(user, platform) when not is_nil(user) do
    Streampai.Accounts.StreamingAccount.can_create?(user, %{platform: platform})
  end

  defp can_connect_platform?(_user, _platform), do: false

  # Helper function to render platform icon
  defp render_platform_icon(assigns) do
    case assigns[:platform] || String.downcase(assigns.name) do
      platform when platform in ["twitch", :twitch] ->
        ~H"""
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z" />
        </svg>
        """

      platform when platform in ["youtube", :youtube] ->
        ~H"""
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        """

      _ ->
        ~H"""
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        """
    end
  end

  @doc """
  Renders a coming soon placeholder for dashboard features.

  ## Examples

      <.coming_soon_placeholder 
        title="Analytics Dashboard" 
        description="Detailed analytics and insights coming soon!" />
  """
  attr :title, :string, required: true, doc: "Feature title"
  attr :description, :string, required: true, doc: "Feature description"
  attr :class, :string, default: "", doc: "Additional CSS classes"

  def coming_soon_placeholder(assigns) do
    ~H"""
    <div class={"max-w-7xl mx-auto #{@class}"}>
      <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <.icon name="clock" class="w-8 h-8 text-purple-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{@title}</h2>
          <p class="text-gray-600 mb-8">{@description}</p>
          <div class="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            <.icon name="lightning" class="w-4 h-4 mr-2" /> Coming Soon
          </div>
        </div>
      </div>
    </div>
    """
  end

  # Helper function to get display name from account data
  defp get_display_name(account_data) when is_map(account_data) do
    account_data["nickname"] || account_data["name"] || "Connected User"
  end

  defp get_display_name(_), do: "Connected User"
end
