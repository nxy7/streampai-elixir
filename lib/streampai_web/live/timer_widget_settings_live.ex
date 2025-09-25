defmodule StreampaiWeb.TimerWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring timer widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :timer_widget,
    fake_module: Streampai.Fake.Timer

  alias StreampaiWeb.Utils.WidgetHelpers

  # Widget-specific implementations

  defp widget_title, do: "Timer Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Don't generate initial event automatically - let Vue component handle initial state
    socket
    |> assign(:current_event, nil)
    |> assign(:timer_controls_visible, true)
    |> assign(:timer_running, false)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [
      :show_label,
      :show_progress_bar,
      :auto_restart,
      :sound_enabled,
      :donation_extension_enabled,
      :subscription_extension_enabled,
      :raid_extension_enabled,
      :patreon_extension_enabled
    ]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate extension events periodically for demo
    new_event = @fake_module.generate_event()
    assign(socket, :current_event, new_event)
  end

  # Disable automatic demo events for timer widget since Vue component handles its own timer
  defp schedule_demo_event, do: :ok

  defp convert_setting_value(setting, value) do
    cond do
      setting in numeric_duration_settings() ->
        convert_numeric_duration_setting(setting, value)

      setting in numeric_amount_settings() ->
        convert_numeric_amount_setting(setting, value)

      setting in choice_settings() ->
        convert_choice_setting(setting, value)

      true ->
        value
    end
  end

  defp numeric_duration_settings do
    [:initial_duration, :restart_duration, :warning_threshold, :sound_volume]
  end

  defp numeric_amount_settings do
    [
      :donation_extension_amount,
      :donation_min_amount,
      :subscription_extension_amount,
      :raid_extension_per_viewer,
      :raid_min_viewers,
      :patreon_extension_amount
    ]
  end

  defp choice_settings do
    [:count_direction, :font_size, :timer_format, :extension_animation]
  end

  defp convert_numeric_duration_setting(:initial_duration, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 10, max: 3600)

  defp convert_numeric_duration_setting(:restart_duration, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 10, max: 3600)

  defp convert_numeric_duration_setting(:warning_threshold, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 0, max: 300)

  defp convert_numeric_duration_setting(:sound_volume, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 0, max: 100)

  defp convert_numeric_amount_setting(:donation_extension_amount, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 1, max: 300)

  defp convert_numeric_amount_setting(:donation_min_amount, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 1, max: 1000)

  defp convert_numeric_amount_setting(:subscription_extension_amount, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 1, max: 600)

  defp convert_numeric_amount_setting(:raid_extension_per_viewer, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 0.1, max: 10)

  defp convert_numeric_amount_setting(:raid_min_viewers, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 1, max: 1000)

  defp convert_numeric_amount_setting(:patreon_extension_amount, value),
    do: WidgetHelpers.parse_numeric_setting(value, min: 1, max: 600)

  defp convert_choice_setting(:count_direction, value),
    do: WidgetHelpers.validate_config_value(:count_direction, value, ["up", "down"], "down")

  defp convert_choice_setting(:font_size, value),
    do: WidgetHelpers.validate_config_value(:font_size, value, ["small", "medium", "large", "extra-large"], "large")

  defp convert_choice_setting(:timer_format, value),
    do: WidgetHelpers.validate_config_value(:timer_format, value, ["mm:ss", "hh:mm:ss", "seconds"], "mm:ss")

  defp convert_choice_setting(:extension_animation, value),
    do: WidgetHelpers.validate_config_value(:extension_animation, value, ["slide", "fade", "bounce"], "bounce")

  # Additional event handlers for timer controls
  def handle_event("timer_control", %{"action" => action}, socket) do
    {event, new_timer_running} =
      case action do
        "toggle" ->
          if socket.assigns.timer_running do
            {@fake_module.generate_control_event(:stop), false}
          else
            {@fake_module.generate_control_event(:start), true}
          end

        "reset" ->
          {@fake_module.generate_control_event(:reset), false}

        "extend" ->
          # Fixed 30 second extension for testing
          event = %{
            id: Streampai.Fake.Base.generate_hex_id(),
            type: :extend,
            amount: 30,
            username: "TestUser",
            timestamp: DateTime.utc_now()
          }

          {event, socket.assigns.timer_running}
      end

    socket =
      socket
      |> assign(:current_event, event)
      |> assign(:timer_running, new_timer_running)

    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Timer Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Timer Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:timer_widget}
          url_path={~p"/widgets/timer/display"}
          dimensions="400x250"
          copy_button_id="copy-timer-url-button"
          vue_component="TimerWidget"
        >
          <.vue
            v-component="TimerWidget"
            v-socket={@socket}
            config={@widget_config}
            event={@current_event}
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Timer Controls for Testing -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Timer Controls (Preview)</h2>
          <div class="flex flex-wrap gap-2">
            <button
              phx-click="timer_control"
              phx-value-action="toggle"
              class={
                if @timer_running,
                  do: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",
                  else:
                    "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              }
            >
              <%= if @timer_running do %>
                <StreampaiWeb.CoreComponents.icon name="hero-stop-solid" class="h-4 w-4 mr-1" /> Stop
              <% else %>
                <StreampaiWeb.CoreComponents.icon name="hero-play-solid" class="h-4 w-4 mr-1" /> Start
              <% end %>
            </button>
            <button
              phx-click="timer_control"
              phx-value-action="reset"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-arrow-path-solid" class="h-4 w-4 mr-1" />
              Reset
            </button>
            <button
              phx-click="timer_control"
              phx-value-action="extend"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-plus-circle-solid" class="h-4 w-4 mr-1" />
              Extend (+30s)
            </button>
          </div>
        </div>
        
    <!-- Timer Settings Form -->
        <form phx-change="update_settings" class="space-y-6">
          <!-- Basic Timer Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Timer Settings</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  Initial Duration (seconds)
                </label>
                <input
                  type="number"
                  name="initial_duration"
                  value={@widget_config[:initial_duration]}
                  min="10"
                  max="3600"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Count Direction</label>
                <select
                  name="count_direction"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="down" selected={@widget_config[:count_direction] == "down"}>
                    Count Down
                  </option>
                  <option value="up" selected={@widget_config[:count_direction] == "up"}>
                    Count Up
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Timer Format</label>
                <select
                  name="timer_format"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="mm:ss" selected={@widget_config[:timer_format] == "mm:ss"}>
                    MM:SS
                  </option>
                  <option value="hh:mm:ss" selected={@widget_config[:timer_format] == "hh:mm:ss"}>
                    HH:MM:SS
                  </option>
                  <option value="seconds" selected={@widget_config[:timer_format] == "seconds"}>
                    Seconds Only
                  </option>
                </select>
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_label"
                  value="true"
                  checked={@widget_config[:show_label]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Timer Label
                </label>
              </div>

              <div :if={@widget_config[:show_label]}>
                <label class="block text-sm font-medium text-gray-700">Timer Label Text</label>
                <input
                  type="text"
                  name="timer_label"
                  value={@widget_config[:timer_label]}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_progress_bar"
                  value="true"
                  checked={@widget_config[:show_progress_bar]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Progress Bar
                </label>
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="auto_restart"
                  value="true"
                  checked={@widget_config[:auto_restart]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Auto-restart when timer ends
                </label>
              </div>

              <div :if={@widget_config[:auto_restart]}>
                <label class="block text-sm font-medium text-gray-700">
                  Restart Duration (seconds)
                </label>
                <input
                  type="number"
                  name="restart_duration"
                  value={@widget_config[:restart_duration]}
                  min="10"
                  max="3600"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div :if={@widget_config[:count_direction] == "down"}>
                <label class="block text-sm font-medium text-gray-700">
                  Warning Threshold (seconds)
                </label>
                <input
                  type="number"
                  name="warning_threshold"
                  value={@widget_config[:warning_threshold]}
                  min="0"
                  max="300"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
                <p class="mt-1 text-sm text-gray-500">
                  Timer will pulse when below this threshold (0 to disable)
                </p>
              </div>
            </div>
          </div>
          
    <!-- Appearance Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Appearance</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Font Size</label>
                <select
                  name="font_size"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="small" selected={@widget_config[:font_size] == "small"}>
                    Small
                  </option>
                  <option value="medium" selected={@widget_config[:font_size] == "medium"}>
                    Medium
                  </option>
                  <option value="large" selected={@widget_config[:font_size] == "large"}>
                    Large
                  </option>
                  <option value="extra-large" selected={@widget_config[:font_size] == "extra-large"}>
                    Extra Large
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Timer Color</label>
                <input
                  type="color"
                  name="timer_color"
                  value={@widget_config[:timer_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Background Color</label>
                <input
                  type="color"
                  name="background_color"
                  value={@widget_config[:background_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div :if={
                @widget_config[:count_direction] == "down" && @widget_config[:warning_threshold] > 0
              }>
                <label class="block text-sm font-medium text-gray-700">Warning Color</label>
                <input
                  type="color"
                  name="warning_color"
                  value={@widget_config[:warning_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Extension Animation</label>
                <select
                  name="extension_animation"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="slide" selected={@widget_config[:extension_animation] == "slide"}>
                    Slide
                  </option>
                  <option value="fade" selected={@widget_config[:extension_animation] == "fade"}>
                    Fade
                  </option>
                  <option value="bounce" selected={@widget_config[:extension_animation] == "bounce"}>
                    Bounce
                  </option>
                </select>
              </div>
            </div>
          </div>
          
    <!-- Extension Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Timer Extensions</h2>
            <div class="space-y-4">
              <!-- Donation Extensions -->
              <div class="border-b pb-4">
                <div class="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="donation_extension_enabled"
                    value="true"
                    checked={@widget_config[:donation_extension_enabled]}
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm font-medium text-gray-900">
                    Extend Timer on Donations
                  </label>
                </div>
                <div :if={@widget_config[:donation_extension_enabled]} class="ml-6 space-y-2">
                  <div>
                    <label class="block text-sm text-gray-700">Seconds per Dollar</label>
                    <input
                      type="number"
                      name="donation_extension_amount"
                      value={@widget_config[:donation_extension_amount]}
                      min="1"
                      max="300"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-700">Minimum Donation Amount ($)</label>
                    <input
                      type="number"
                      name="donation_min_amount"
                      value={@widget_config[:donation_min_amount]}
                      min="1"
                      max="1000"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
    <!-- Subscription Extensions -->
              <div class="border-b pb-4">
                <div class="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="subscription_extension_enabled"
                    value="true"
                    checked={@widget_config[:subscription_extension_enabled]}
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm font-medium text-gray-900">
                    Extend Timer on Subscriptions
                  </label>
                </div>
                <div :if={@widget_config[:subscription_extension_enabled]} class="ml-6">
                  <label class="block text-sm text-gray-700">Seconds per Subscription</label>
                  <input
                    type="number"
                    name="subscription_extension_amount"
                    value={@widget_config[:subscription_extension_amount]}
                    min="1"
                    max="600"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>
              
    <!-- Raid Extensions -->
              <div class="border-b pb-4">
                <div class="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="raid_extension_enabled"
                    value="true"
                    checked={@widget_config[:raid_extension_enabled]}
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm font-medium text-gray-900">
                    Extend Timer on Raids
                  </label>
                </div>
                <div :if={@widget_config[:raid_extension_enabled]} class="ml-6 space-y-2">
                  <div>
                    <label class="block text-sm text-gray-700">Seconds per Viewer</label>
                    <input
                      type="number"
                      name="raid_extension_per_viewer"
                      value={@widget_config[:raid_extension_per_viewer]}
                      min="0.1"
                      max="10"
                      step="0.1"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-700">Minimum Viewers</label>
                    <input
                      type="number"
                      name="raid_min_viewers"
                      value={@widget_config[:raid_min_viewers]}
                      min="1"
                      max="1000"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
    <!-- Patreon Extensions -->
              <div>
                <div class="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name="patreon_extension_enabled"
                    value="true"
                    checked={@widget_config[:patreon_extension_enabled]}
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm font-medium text-gray-900">
                    Extend Timer on Patreon Pledges
                  </label>
                </div>
                <div :if={@widget_config[:patreon_extension_enabled]} class="ml-6">
                  <label class="block text-sm text-gray-700">Seconds per Pledge</label>
                  <input
                    type="number"
                    name="patreon_extension_amount"
                    value={@widget_config[:patreon_extension_amount]}
                    min="1"
                    max="600"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
    <!-- Sound Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Sound Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="sound_enabled"
                  value="true"
                  checked={@widget_config[:sound_enabled]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Enable Sound Effects
                </label>
              </div>

              <div :if={@widget_config[:sound_enabled]}>
                <label class="block text-sm font-medium text-gray-700">Sound Volume</label>
                <input
                  type="range"
                  name="sound_volume"
                  value={@widget_config[:sound_volume]}
                  min="0"
                  max="100"
                  class="mt-1 block w-full"
                />
                <div class="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>{@widget_config[:sound_volume]}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </.dashboard_layout>
    """
  end
end
