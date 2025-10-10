defmodule StreampaiWeb.Components.DashboardComponents do
  @moduledoc """
  Reusable dashboard UI components for consistent interface patterns.

  This module contains common dashboard elements like cards, status indicators,
  and other UI patterns used across multiple dashboard pages.
  """
  use StreampaiWeb, :html

  alias Streampai.Accounts.StreamingAccount

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
          <.dashboard_icon name={@icon} class="w-5 h-5 text-purple-500" />
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

  defp status_badge_class(status) do
    base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    color = status_badge_color(status)
    "#{base} #{color}"
  end

  defp status_badge_color("online"), do: "bg-green-100 text-green-800"
  defp status_badge_color("success"), do: "bg-green-100 text-green-800"
  defp status_badge_color("warning"), do: "bg-yellow-100 text-yellow-800"
  defp status_badge_color("error"), do: "bg-red-100 text-red-800"
  defp status_badge_color(_), do: "bg-gray-100 text-gray-800"

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

  attr :disconnecting_platform, :atom,
    default: nil,
    doc: "Platform currently being disconnected (for loading state)"

  def platform_connection(assigns) do
    ~H"""
    <div
      class={
        "relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md #{
          if @connected,
            do: "shadow-sm",
            else: "border border-gray-300 bg-transparent hover:border-gray-400 hover:bg-gray-50"
        }"
      }
      style={if @connected, do: get_background_style(@color), else: nil}
    >
      <div class="relative flex items-center justify-between p-4">
        <div class="flex items-center space-x-4">
          <!-- Avatar/Icon Section -->
          <div class="relative">
            <%= if @connected and @account_data && @account_data["image"] do %>
              <!-- User Avatar for connected accounts with border -->
              <div class="relative">
                <img
                  src={@account_data["image"]}
                  alt={@account_data["nickname"] || @account_data["name"] || "User avatar"}
                  class="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-sm"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                />
              </div>
              <!-- Fallback platform icon (hidden by default, shown if image fails) -->
              <div
                class={"w-12 h-12 rounded-xl flex items-center justify-center #{get_icon_background_class(@color)} shadow-lg"}
                style="display: none;"
              >
                {render_platform_icon(assigns)}
              </div>
            <% else %>
              <!-- Platform icon for disconnected accounts or when no avatar -->
              <div class={
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm #{
                  if @connected,
                    do: get_icon_background_class(@color),
                    else: "bg-gray-100 border border-gray-200"
                }"
              }>
                {render_platform_icon(assigns)}
              </div>
            <% end %>
          </div>
          
    <!-- Content Section -->
          <div class="flex flex-col">
            <%= if @connected and @account_data do %>
              <!-- Connected: Show nickname and platform name -->
              <div class="flex items-center space-x-2">
                <span class="text-base font-semibold text-gray-900">
                  {get_display_name(@account_data)}
                </span>
                <div
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={get_small_badge_style(@color)}
                >
                  <span class="mr-1">✓</span> Connected
                </div>
              </div>
              <span class="text-sm text-gray-500 mt-0.5">
                {@name}
              </span>
            <% else %>
              <!-- Not connected: Show platform name and status -->
              <div class="flex items-center space-x-2">
                <span class="text-base font-semibold text-gray-900">
                  {@name}
                </span>
              </div>
              <span class="text-sm text-gray-500 mt-0.5">
                Not connected
              </span>
            <% end %>
          </div>
        </div>
        
    <!-- Action Section -->
        <div class="flex items-center">
          <%= if not @connected do %>
            <%= if can_connect_platform?(@current_user, @platform) do %>
              <a
                href={@connect_url}
                class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Connect
              </a>
            <% else %>
              <div class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg border border-gray-200">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Pro Required
              </div>
            <% end %>
          <% else %>
            <div class="relative group">
              <!-- Default Connected State -->
              <div class="group-hover:opacity-0 transition-opacity duration-200">
                <div
                  class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg"
                  style={get_badge_style(@color)}
                >
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Connected
                </div>
              </div>
              <!-- Disconnect Button (shows on hover) -->
              <button
                phx-click="disconnect_platform"
                phx-value-platform={@platform}
                disabled={@disconnecting_platform == @platform}
                class={[
                  "absolute top-0 left-0 opacity-0 group-hover:opacity-100 inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm",
                  if(@disconnecting_platform == @platform,
                    do: "bg-red-400 cursor-not-allowed",
                    else: "bg-red-500 hover:bg-red-600 text-white"
                  )
                ]}
              >
                <%= if @disconnecting_platform == @platform do %>
                  <svg
                    class="w-4 h-4 mr-2 text-white animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    >
                    </circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    >
                    </path>
                  </svg>
                  <span class="text-white">Disconnecting...</span>
                <% else %>
                  <svg
                    class="w-4 h-4 mr-2 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span class="text-white">Disconnect</span>
                <% end %>
              </button>
            </div>
          <% end %>
        </div>
      </div>
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
      <.dashboard_icon name={@icon} class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-lg font-medium text-gray-900">{@title}</h3>
      <p class="mt-1 text-sm text-gray-500">{@message}</p>
    </div>
    """
  end

  attr :name, :string, required: true, doc: "Icon name"
  attr :class, :string, default: "w-5 h-5", doc: "Icon CSS classes"

  @icon_paths %{
    "user" => "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    "activity" =>
      "M15 10l4.553-2.276A1 1 0 0021 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    "chart-bar" =>
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    "lightning" => "M13 10V3L4 14h7v7l9-11h-7z",
    "clock" => "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    "currency-dollar" =>
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "users" =>
      "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
    "eye" =>
      "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    "chat-bubble-left" =>
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    "heart" =>
      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
  }

  @multi_path_icons %{
    "play" => [
      "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
      "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    ]
  }

  @default_icon_path "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"

  defp dashboard_icon(assigns) do
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
            <.dashboard_icon name={@icon} class="w-5 h-5 text-purple-600" />
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

  defp change_color(:positive), do: "text-green-600"
  defp change_color(:negative), do: "text-red-600"
  defp change_color(_), do: "text-gray-500"

  defp can_connect_platform?(user, platform) when not is_nil(user) do
    StreamingAccount.can_create?(user, %{platform: platform})
  end

  defp can_connect_platform?(_user, _platform), do: false

  defp render_platform_icon(assigns) do
    assigns =
      assign(
        assigns,
        :icon_class,
        if(assigns.connected, do: "w-6 h-6 text-white", else: "w-6 h-6 text-gray-400")
      )

    case assigns[:platform] || String.downcase(assigns.name) do
      platform when platform in ["twitch", :twitch] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z" />
        </svg>
        """

      platform when platform in ["youtube", :youtube] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        """

      platform when platform in ["facebook", :facebook] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        """

      platform when platform in ["kick", :kick] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.014 12.358c0 4.393-1.411 5.646-4.045 5.646-1.969 0-3.044-1.308-3.044-1.308v1.122h-2.77V6h2.77v4.031s1.011-1.173 2.864-1.173c2.696 0 4.225 1.29 4.225 3.5zm-5.818-1.173c-1.319 0-1.757.979-1.757 2.354 0 1.374.438 2.354 1.757 2.354s1.757-.98 1.757-2.354c0-1.375-.438-2.354-1.757-2.354zm-9.196 0c-1.319 0-1.757.979-1.757 2.354 0 1.374.438 2.354 1.757 2.354s1.757-.98 1.757-2.354c0-1.375-.438-2.354-1.757-2.354zM9 12.358c0 4.393-1.411 5.646-4.045 5.646C2.986 18.004 2 16.696 2 16.696v1.122H0V6h2.77v4.031s1.011-1.173 2.864-1.173C8.33 8.858 9 10.148 9 12.358z" />
        </svg>
        """

      platform when platform in ["tiktok", :tiktok] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
        """

      platform when platform in ["trovo", :trovo] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4.41 0-8-3.59-8-8V8.5l8-4 8 4V12c0 4.41-3.59 8-8 8zm-2-6h4v2h-4v-2zm0-4h4v2h-4v-2z" />
        </svg>
        """

      platform when platform in ["instagram", :instagram] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
        """

      platform when platform in ["rumble", :rumble] ->
        ~H"""
        <svg class={@icon_class} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        """

      _ ->
        ~H"""
        <svg class={@icon_class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <.dashboard_icon name="clock" class="w-8 h-8 text-purple-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{@title}</h2>
          <p class="text-gray-600 mb-8">{@description}</p>
          <div class="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            <.dashboard_icon name="lightning" class="w-4 h-4 mr-2" /> Coming Soon
          </div>
        </div>
      </div>
    </div>
    """
  end

  defp get_display_name(account_data) when is_map(account_data) do
    account_data["nickname"] || account_data["name"] || "Connected User"
  end

  defp get_display_name(_), do: "Connected User"

  defp get_background_style(color) do
    case color do
      "red" -> "background-color: rgb(254 242 242);"
      "purple" -> "background-color: rgb(250 245 255);"
      "blue" -> "background-color: rgb(239 246 255);"
      "green" -> "background-color: rgb(240 253 244);"
      "yellow" -> "background-color: rgb(255 251 235);"
      "indigo" -> "background-color: rgb(238 242 255);"
      "pink" -> "background-color: rgb(253 242 248);"
      _ -> "background-color: rgb(249 250 251);"
    end
  end

  defp get_badge_style(color) do
    case color do
      "red" ->
        "background-color: white; color: rgb(185, 28, 28);"

      "purple" ->
        "background-color: white; color: rgb(124, 58, 237);"

      "blue" ->
        "background-color: white; color: rgb(37, 99, 235);"

      "green" ->
        "background-color: white; color: rgb(22, 163, 74);"

      "yellow" ->
        "background-color: white; color: rgb(217, 119, 6);"

      "indigo" ->
        "background-color: white; color: rgb(79, 70, 229);"

      "pink" ->
        "background-color: white; color: rgb(219, 39, 119);"

      _ ->
        "background-color: white; color: rgb(75, 85, 99);"
    end
  end

  defp get_small_badge_style(color) do
    case color do
      "red" ->
        "background-color: white; color: rgb(185, 28, 28);"

      "purple" ->
        "background-color: white; color: rgb(124, 58, 237);"

      "blue" ->
        "background-color: white; color: rgb(37, 99, 235);"

      "green" ->
        "background-color: white; color: rgb(22, 163, 74);"

      "yellow" ->
        "background-color: white; color: rgb(217, 119, 6);"

      "indigo" ->
        "background-color: white; color: rgb(79, 70, 229);"

      "pink" ->
        "background-color: white; color: rgb(219, 39, 119);"

      _ ->
        "background-color: white; color: rgb(75, 85, 99);"
    end
  end

  defp get_icon_background_class(color) do
    case color do
      "red" -> "bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-200"
      "purple" -> "bg-gradient-to-br from-purple-500 to-purple-600 ring-2 ring-purple-200"
      "blue" -> "bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-200"
      "green" -> "bg-gradient-to-br from-green-500 to-green-600 ring-2 ring-green-200"
      "yellow" -> "bg-gradient-to-br from-yellow-500 to-yellow-600 ring-2 ring-yellow-200"
      "indigo" -> "bg-gradient-to-br from-indigo-500 to-indigo-600 ring-2 ring-indigo-200"
      "pink" -> "bg-gradient-to-br from-pink-500 to-pink-600 ring-2 ring-pink-200"
      _ -> "bg-gradient-to-br from-gray-500 to-gray-600 ring-2 ring-gray-200"
    end
  end

  @doc """
  Stream status cards showing live status, active platforms, and viewer count.
  """
  attr :stream_status, :map, required: true
  attr :current_user, :map, required: true

  def stream_status_cards(assigns) do
    ~H"""
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <.stream_status_card
        title="Live Status"
        icon="play"
        status={@stream_status.status}
        color="red"
      />
      <.stream_status_card
        title="Active Platforms"
        icon="globe"
        value={"#{Map.get(@current_user || %{}, :connected_platforms, 0)}/#{if Map.get(@current_user || %{}, :tier) == :free, do: 1, else: 99}"}
        color="blue"
      />
      <.stream_status_card
        title="Total Viewers"
        icon="eye"
        value="0"
        color="green"
      />
    </div>
    """
  end

  @doc """
  Individual stream status card component.
  """
  attr :title, :string, required: true
  attr :icon, :string, required: true
  attr :status, :atom, default: nil
  attr :value, :string, default: nil
  attr :color, :string, required: true

  def stream_status_card(assigns) do
    ~H"""
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class={[
            "w-8 h-8 rounded-full flex items-center justify-center",
            get_status_card_bg_class(@color)
          ]}>
            <.stream_status_icon name={@icon} class={["w-5 h-5", get_status_card_icon_class(@color)]} />
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">{@title}</dt>
            <dd class="text-lg font-medium text-gray-900">
              <%= if @status do %>
                <.stream_status_text status={@status} />
              <% else %>
                {@value}
              <% end %>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    """
  end

  @doc """
  Stream status text with emoji indicators.
  """
  attr :status, :atom, required: true

  def stream_status_text(assigns) do
    ~H"""
    <%= case @status do %>
      <% :streaming -> %>
        <span class="text-green-600">🔴 LIVE</span>
      <% :ready -> %>
        <span class="text-yellow-600">⚡ Ready</span>
      <% _ -> %>
        <span class="text-gray-600">⏸️ Offline</span>
    <% end %>
    """
  end

  @doc """
  Stream controls section with GO LIVE/STOP button and RTMP details.
  """
  attr :stream_status, :map, required: true
  attr :loading, :boolean, required: true
  attr :show_stream_key, :boolean, required: true
  attr :stream_metadata, :map, default: %{}
  attr :current_user, :map, required: true

  def stream_controls(assigns) do
    ~H"""
    <div class="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Stream Controls</h3>
      </div>
      <div class="p-6">
        <%= if @stream_status.manager_available do %>
          <div class="flex flex-col space-y-4">
            <.stream_input_status
              status={@stream_status.input_streaming_status}
              youtube_broadcast_id={Map.get(@stream_status, :youtube_broadcast_id)}
            />

            <%= if @stream_status.can_start_streaming && @stream_status.status != :streaming do %>
              <.stream_metadata_form
                metadata={@stream_metadata}
                socket={@socket}
                current_user={@current_user}
              />
            <% end %>

            <.stream_action_button stream_status={@stream_status} loading={@loading} />
            <%= if @stream_status.rtmp_url && @stream_status.stream_key do %>
              <.rtmp_connection_details
                rtmp_url={@stream_status.rtmp_url}
                stream_key={@stream_status.stream_key}
                show_stream_key={@show_stream_key}
              />
            <% end %>
            <%= if @stream_status.input_streaming_status != :live do %>
              <.stream_status_message />
            <% end %>
          </div>
        <% else %>
          <.stream_service_unavailable />
        <% end %>
      </div>
    </div>
    """
  end

  @doc """
  Input streaming status indicator.
  """
  attr :status, :atom, required: true
  attr :youtube_broadcast_id, :string, default: nil

  def stream_input_status(assigns) do
    ~H"""
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class={[
          "w-3 h-3 rounded-full",
          if(@status == :live, do: "bg-green-500", else: "bg-gray-300")
        ]}>
        </div>
        <span class="text-sm font-medium text-gray-700">
          Input Stream: {if @status == :live, do: "LIVE", else: "Offline"}
        </span>
      </div>
      <%= if @youtube_broadcast_id do %>
        <a
          href={"https://youtu.be/#{@youtube_broadcast_id}"}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span>Watch on YouTube</span>
        </a>
      <% end %>
    </div>
    """
  end

  @doc """
  Stream metadata form for title, description, and thumbnail (Vue component).
  """
  attr :metadata, :map, required: true
  attr :socket, :any, default: nil
  attr :current_user, :map, required: true

  def stream_metadata_form(assigns) do
    ~H"""
    <div class="space-y-4">
      <.vue
        v-component="StreamSettingsPreForm"
        v-socket={@socket}
        metadata={@metadata}
        v-on:updateMetadata={JS.push("update_stream_metadata")}
      />

      <.live_component
        module={StreampaiWeb.Components.ThumbnailSelectorComponent}
        id="thumbnail-selector"
        current_thumbnail_url={Map.get(@metadata, :thumbnail_url)}
      />
    </div>
    """
  end

  @doc """
  GO LIVE/STOP streaming action button.
  """
  attr :stream_status, :map, required: true
  attr :loading, :boolean, required: true

  def stream_action_button(assigns) do
    ~H"""
    <div class="flex items-center justify-center mb-4">
      <%= if @stream_status.status == :streaming do %>
        <button
          phx-click="stop_streaming"
          phx-disable-with="⏳ Stopping..."
          disabled={@loading}
          class="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg shadow-lg transition-all duration-200"
        >
          🔴 STOP STREAM
        </button>
      <% else %>
        <button
          phx-click="start_streaming"
          phx-disable-with="⏳ Starting..."
          disabled={@loading || !@stream_status.can_start_streaming}
          class={[
            "px-8 py-4 font-semibold rounded-lg text-lg shadow-lg transition-all duration-200 disabled:cursor-not-allowed",
            if(@stream_status.can_start_streaming && !@loading,
              do: "bg-green-600 hover:bg-green-700 text-white",
              else: "bg-gray-300 text-gray-500 disabled:opacity-50"
            )
          ]}
        >
          <%= cond do %>
            <% @stream_status.input_streaming_status != :live -> %>
              ⚡ Waiting for Input...
            <% !@stream_status.can_start_streaming -> %>
              🚫 Configure Platforms
            <% true -> %>
              🚀 GO LIVE
          <% end %>
        </button>
      <% end %>
    </div>
    """
  end

  @doc """
  RTMP connection details with copy functionality.
  """
  attr :rtmp_url, :string, required: true
  attr :stream_key, :string, required: true
  attr :show_stream_key, :boolean, required: true

  def rtmp_connection_details(assigns) do
    ~H"""
    <div class="mb-4">
      <.copy_field label="RTMP URL" value={@rtmp_url} />
      <.copy_field
        label="Stream Key"
        value={@stream_key}
        hidden={!@show_stream_key}
        toggle_event="toggle_stream_key_visibility"
        regenerate_event="regenerate_stream_key"
      />
    </div>
    """
  end

  @doc """
  Copyable field with optional visibility toggle.
  """
  attr :label, :string, required: true
  attr :value, :string, required: true
  attr :hidden, :boolean, default: false
  attr :toggle_event, :string, default: nil
  attr :regenerate_event, :string, default: nil

  def copy_field(assigns) do
    display_value =
      if assigns.hidden,
        do: String.duplicate("•", String.length(assigns.value)),
        else: assigns.value

    assigns = assign(assigns, :display_value, display_value)

    ~H"""
    <div class="mb-3 relative">
      <div class="flex items-center justify-between mb-1">
        <label class="block text-xs font-medium text-gray-500">{@label}</label>
        <%= if @regenerate_event do %>
          <button
            type="button"
            phx-click={@regenerate_event}
            class="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            title="Regenerate stream key"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Regenerate
          </button>
        <% end %>
      </div>
      <div class="relative">
        <div
          class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono cursor-pointer hover:bg-gray-100 select-none transition-colors"
          onclick={"navigator.clipboard.writeText('#{@value}'); this.classList.add('bg-green-100'); this.classList.add('border-green-300'); const popup = this.#{if @toggle_event, do: "parentElement.", else: ""}nextElementSibling; popup.classList.remove('opacity-0'); popup.classList.add('opacity-100'); setTimeout(() => { this.classList.remove('bg-green-100'); this.classList.remove('border-green-300'); popup.classList.remove('opacity-100'); popup.classList.add('opacity-0'); }, 1500);"}
          title="Click to copy"
        >
          {@display_value}
        </div>
        <%= if @toggle_event do %>
          <button
            type="button"
            phx-click={@toggle_event}
            class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
            title={
              if @hidden,
                do: "Show #{String.downcase(@label)}",
                else: "Hide #{String.downcase(@label)}"
            }
          >
            <.visibility_toggle_icon hidden={@hidden} />
          </button>
        <% end %>
      </div>
      <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-300 pointer-events-none z-10">
        {String.capitalize(@label)} copied!
      </div>
    </div>
    """
  end

  @doc """
  Visibility toggle icon (eye/eye-slash).
  """
  attr :hidden, :boolean, required: true

  def visibility_toggle_icon(assigns) do
    if assigns.hidden do
      ~H"""
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      """
    else
      ~H"""
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
        />
      </svg>
      """
    end
  end

  @doc """
  Status message for when input stream is not live.
  """
  def stream_status_message(assigns) do
    ~H"""
    <div class="text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      📺 Start streaming to your RTMP URL in OBS to enable the GO LIVE button
    </div>
    """
  end

  @doc """
  Streaming services unavailable placeholder.
  """
  def stream_service_unavailable(assigns) do
    ~H"""
    <div class="text-center py-8">
      <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <.dashboard_icon name="clock" class="w-8 h-8 text-yellow-600" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Streaming Services Starting Up</h3>
      <p class="text-sm text-gray-600 mb-4">
        We're initializing your streaming infrastructure. This usually takes a few moments.
      </p>
      <div class="flex items-center justify-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span class="text-sm text-blue-600">
          Our gnomes are starting your streaming infrastructure...
        </span>
      </div>
      <p class="text-xs text-gray-500 mt-4">
        ℹ️ Streaming services start automatically when you're detected as online
      </p>
    </div>
    """
  end

  @doc """
  Platform connections section.
  """
  attr :platform_connections, :list, required: true
  attr :current_user, :map, required: true
  attr :disconnecting_platform, :atom, default: nil

  def platform_connections_section(assigns) do
    assigns =
      assign_new(assigns, :active_count, fn ->
        connected_count = Enum.count(assigns.platform_connections, & &1.connected)

        total_count = length(assigns.platform_connections)
        "#{connected_count}/#{total_count}"
      end)

    ~H"""
    <div class="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">
          Platform Connections <span class="text-gray-500 font-normal">({@active_count})</span>
        </h3>
      </div>
      <div class="p-6">
        <div class="space-y-3">
          <.platform_connection
            :for={connection <- @platform_connections}
            name={connection.name}
            platform={connection.platform}
            connected={connection.connected}
            connect_url={connection.connect_url}
            color={connection.color}
            current_user={@current_user}
            account_data={connection.account_data}
            show_disconnect={true}
            disconnecting_platform={@disconnecting_platform}
          />
        </div>
      </div>
    </div>
    """
  end

  defp stream_status_icon(%{name: "play"} = assigns) do
    ~H"""
    <svg class={@class} fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clip-rule="evenodd"
      />
    </svg>
    """
  end

  defp stream_status_icon(%{name: "globe"} = assigns) do
    ~H"""
    <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
      />
    </svg>
    """
  end

  defp stream_status_icon(assigns) do
    ~H"""
    <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
    """
  end

  defp get_status_card_bg_class("red"), do: "bg-red-100"
  defp get_status_card_bg_class("blue"), do: "bg-blue-100"
  defp get_status_card_bg_class("green"), do: "bg-green-100"
  defp get_status_card_bg_class(_), do: "bg-gray-100"

  defp get_status_card_icon_class("red"), do: "text-red-600"
  defp get_status_card_icon_class("blue"), do: "text-blue-600"
  defp get_status_card_icon_class("green"), do: "text-green-600"
  defp get_status_card_icon_class(_), do: "text-gray-600"
end
