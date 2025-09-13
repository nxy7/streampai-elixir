defmodule StreampaiWeb.AlertboxWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring alertbox widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :alertbox_widget,
    fake_module: Streampai.Fake.Alert

  alias StreampaiWeb.Utils.WidgetHelpers

  # Widget-specific implementations

  defp widget_title, do: "Alertbox Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Generate initial event for preview
    initial_event = @fake_module.generate_event()
    display_time = Enum.random(3..8)
    initial_event_with_time = Map.put(initial_event, :display_time, display_time)

    assign(socket, :current_event, initial_event_with_time)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:sound_enabled, :show_message, :show_amount]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    new_event = @fake_module.generate_event()
    display_time = Enum.random(3..8)
    event_with_display_time = Map.put(new_event, :display_time, display_time)

    assign(socket, :current_event, event_with_display_time)
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 7000)

  # Handle presence updates (inherited from BaseLive)
  def handle_info(%Phoenix.Socket.Broadcast{topic: "users_presence", event: "presence_diff"}, socket) do
    {:noreply, socket}
  end

  # Let WidgetBehaviour handle other messages
  def handle_info(msg, socket) do
    super(msg, socket)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :display_duration ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 30)

      :sound_volume ->
        WidgetHelpers.parse_numeric_setting(value, min: 0, max: 100)

      :animation_type ->
        WidgetHelpers.validate_config_value(
          :animation_type,
          value,
          ["fade", "slide", "bounce"],
          "fade"
        )

      :alert_position ->
        WidgetHelpers.validate_config_value(
          :alert_position,
          value,
          ["top", "center", "bottom"],
          "center"
        )

      :font_size ->
        WidgetHelpers.validate_config_value(
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
          <StreampaiWeb.WidgetSettingsComponents.widget_preview_header
            title="Alertbox Widget"
            current_user={@current_user}
            socket={@socket}
            widget_type={:alertbox_widget}
            url_path={~p"/widgets/alertbox/display"}
            dimensions="800x600"
            copy_button_id="copy-alertbox-url-button"
          />
          
    <!-- Alertbox Widget Display -->
          <div class="max-w-2xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-[32rem] overflow-hidden relative">
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
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Display Options -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Options">
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_amount"
              label="Show donation amounts"
              checked={@widget_config.show_amount}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_message"
              label="Show alert messages"
              checked={@widget_config.show_message}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="sound_enabled"
              label="Enable alert sounds"
              checked={@widget_config.sound_enabled}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Alert Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Alert Settings">
            <StreampaiWeb.WidgetSettingsComponents.number_input_setting
              name="display_duration"
              label="Display duration (seconds)"
              value={@widget_config.display_duration}
              min={1}
              max={30}
              help_text="How long alerts stay visible (1-30 seconds)"
            />

            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="animation_type"
              label="Animation type"
              value={@widget_config.animation_type}
              options={[
                {"fade", "Fade In"},
                {"slide", "Slide In"},
                {"bounce", "Bounce In"}
              ]}
            />

            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="alert_position"
              label="Alert position"
              value={@widget_config.alert_position}
              options={[
                {"top", "Top"},
                {"center", "Center"},
                {"bottom", "Bottom"}
              ]}
            />

            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="font_size"
              label="Font size"
              value={@widget_config.font_size}
              options={[
                {"small", "Small"},
                {"medium", "Medium"},
                {"large", "Large"}
              ]}
            />

            <StreampaiWeb.WidgetSettingsComponents.range_setting
              name="sound_volume"
              label="Sound volume"
              value={@widget_config.sound_volume}
              min={0}
              max={100}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Alertbox Widget"
          socket={@socket}
          url_path={~p"/widgets/alertbox/display"}
          current_user={@current_user}
          dimensions="800x600"
          instructions={["Alerts will appear automatically when events occur"]}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
