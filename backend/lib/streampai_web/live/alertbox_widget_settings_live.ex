defmodule StreampaiWeb.AlertboxWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring alertbox widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :alertbox_widget,
    fake_module: Streampai.Fake.Alert

  # Widget-specific implementations

  defp widget_title, do: "Alertbox Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Generate initial event for preview
    initial_event = @fake_module.generate_event()
    display_time = Enum.random(3..8)
    initial_event_with_time = Map.put(initial_event, :display_time, display_time)

    socket
    |> assign(:current_event, initial_event_with_time)
  end

  defp update_widget_settings(config, params) do
    # Handle boolean settings (checkboxes that send "on" when checked)
    boolean_fields = [:sound_enabled, :show_message, :show_amount]

    config_with_booleans =
      StreampaiWeb.Utils.WidgetHelpers.update_boolean_settings(config, params, boolean_fields)

    # Handle other settings (numbers, selects, etc.)
    Enum.reduce(params, config_with_booleans, fn {key, value}, acc ->
      case key do
        key when key in ["sound_enabled", "show_message", "show_amount"] ->
          # Already handled above
          acc

        _ ->
          try do
            atom_key = String.to_existing_atom(key)
            converted_value = convert_setting_value(atom_key, value)
            Map.put(acc, atom_key, converted_value)
          rescue
            # Skip invalid field names
            ArgumentError -> acc
          end
      end
    end)
  end

  defp generate_and_assign_demo_data(socket) do
    new_event = @fake_module.generate_event()
    display_time = Enum.random(3..8)
    event_with_display_time = Map.put(new_event, :display_time, display_time)

    assign(socket, :current_event, event_with_display_time)
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 7000)

  # Handle presence updates (inherited from BaseLive)
  def handle_info(
        %Phoenix.Socket.Broadcast{topic: "users_presence", event: "presence_diff"},
        socket
      ) do
    {:noreply, socket}
  end

  # Let WidgetBehaviour handle other messages
  def handle_info(msg, socket) do
    super(msg, socket)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :display_duration ->
        StreampaiWeb.Utils.WidgetHelpers.parse_numeric_setting(value, min: 1, max: 30)

      :sound_volume ->
        StreampaiWeb.Utils.WidgetHelpers.parse_numeric_setting(value, min: 0, max: 100)

      :animation_type ->
        StreampaiWeb.Utils.WidgetHelpers.validate_config_value(
          :animation_type,
          value,
          ["fade", "slide", "bounce"],
          "fade"
        )

      :alert_position ->
        StreampaiWeb.Utils.WidgetHelpers.validate_config_value(
          :alert_position,
          value,
          ["top", "center", "bottom"],
          "center"
        )

      :font_size ->
        StreampaiWeb.Utils.WidgetHelpers.validate_config_value(
          :font_size,
          value,
          ["small", "medium", "large"],
          "medium"
        )

      _ ->
        value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Alertbox Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Alertbox Widget Preview</h3>
            <div class="flex items-center space-x-2">
              <button
                id="copy-alertbox-url-button"
                class="text-sm text-purple-600 hover:text-purple-700 font-medium"
                phx-hook="CopyToClipboard"
                data-clipboard-text={url(~p"/widgets/alertbox/display?user_id=#{@current_user.id}")}
                data-clipboard-message="Alertbox browser source URL copied!"
              >
                Copy Browser Source URL
              </button>
              <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                Configure
              </button>
            </div>
          </div>
          
    <!-- Alertbox Widget Display -->
          <div class="max-w-2xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-96 overflow-hidden relative">
            <div class="text-xs text-gray-400 mb-2">
              Preview (actual widget has transparent background)
            </div>
            <.vue
              v-component="AlertboxWidget"
              v-socket={@socket}
              config={@widget_config}
              event={@current_event}
              class="w-full h-full"
              id="preview-alertbox-widget"
            />
          </div>
        </div>
        
    <!-- Configuration Options -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Widget Settings</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Display Options -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-700">Display Options</h4>

              <form phx-change="update_settings">
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="show_amount"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.show_amount}
                    />
                    <span class="ml-2 text-sm text-gray-700">Show donation amounts</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="show_message"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.show_message}
                    />
                    <span class="ml-2 text-sm text-gray-700">Show alert messages</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="sound_enabled"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.sound_enabled}
                    />
                    <span class="ml-2 text-sm text-gray-700">Enable alert sounds</span>
                  </label>
                </div>
              </form>
            </div>
            
    <!-- Alert Settings -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-700">Alert Settings</h4>

              <form phx-change="update_settings">
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Display duration (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      name="display_duration"
                      value={@widget_config.display_duration}
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      How long alerts stay visible (1-30 seconds)
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Animation type</label>
                    <select
                      name="animation_type"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="fade" selected={@widget_config.animation_type == "fade"}>
                        Fade In
                      </option>
                      <option value="slide" selected={@widget_config.animation_type == "slide"}>
                        Slide In
                      </option>
                      <option value="bounce" selected={@widget_config.animation_type == "bounce"}>
                        Bounce In
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Alert position</label>
                    <select
                      name="alert_position"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="top" selected={@widget_config.alert_position == "top"}>
                        Top
                      </option>
                      <option value="center" selected={@widget_config.alert_position == "center"}>
                        Center
                      </option>
                      <option value="bottom" selected={@widget_config.alert_position == "bottom"}>
                        Bottom
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Font size</label>
                    <select
                      name="font_size"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="small" selected={@widget_config.font_size == "small"}>
                        Small
                      </option>
                      <option value="medium" selected={@widget_config.font_size == "medium"}>
                        Medium
                      </option>
                      <option value="large" selected={@widget_config.font_size == "large"}>
                        Large
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Sound volume</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      name="sound_volume"
                      value={@widget_config.sound_volume}
                      class="w-full"
                    />
                    <p class="text-xs text-gray-500 mt-1">Volume: {@widget_config.sound_volume}%</p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
    <!-- Usage Instructions -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="text-lg font-medium text-blue-900 mb-4">How to use in OBS</h3>
          <div class="space-y-2 text-sm text-blue-800">
            <p><strong>1.</strong> Copy the browser source URL above</p>
            <p><strong>2.</strong> In OBS, add a "Browser Source"</p>
            <p><strong>3.</strong> Paste the URL and set dimensions to 800x600</p>
            <p><strong>4.</strong> Position the alertbox on your stream layout</p>
            <p><strong>5.</strong> Alerts will appear automatically when events occur</p>
          </div>

          <div class="mt-4 p-3 bg-white border border-blue-200 rounded">
            <p class="text-xs text-gray-600 font-mono break-all">
              {url(~p"/widgets/alertbox/display?user_id=#{@current_user.id}")}
            </p>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
