defmodule StreampaiWeb.FollowerCountWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring follower count widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :follower_count_widget,
    fake_module: Streampai.Fake.FollowerCount

  alias StreampaiWeb.Utils.WidgetHelpers

  # Widget-specific implementations

  defp widget_title, do: "Follower Count Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Generate initial follower data for preview
    initial_data = @fake_module.generate_follower_data()
    assign(socket, :current_data, initial_data)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:show_total, :show_platforms, :animation_enabled]
    color_fields = ["icon_color"]

    # Normalize color picker parameters
    normalized_params = WidgetHelpers.normalize_color_params(params, color_fields)

    WidgetHelpers.update_unified_settings(config, normalized_params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate update based on current data for realistic changes
    current_data = socket.assigns[:current_data]

    new_data =
      if current_data do
        @fake_module.generate_follower_update(current_data)
      else
        @fake_module.generate_follower_data()
      end

    assign(socket, :current_data, new_data)
  end

  defp schedule_demo_event do
    # Use a reasonable default that matches our widget's typical interval
    Process.send_after(self(), :generate_demo_event, 3000)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :display_style ->
        WidgetHelpers.validate_config_value(
          :display_style,
          value,
          ["minimal", "detailed", "cards"],
          "detailed"
        )

      :font_size ->
        WidgetHelpers.validate_config_value(
          :font_size,
          value,
          ["small", "medium", "large"],
          "medium"
        )

      :icon_color ->
        WidgetHelpers.validate_hex_color(value, "#9333ea")

      _ ->
        value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Follower Count Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Follower Count Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:follower_count_widget}
          url_path={~p"/widgets/follower-count/display"}
          dimensions="800x200"
          copy_button_id="copy-follower-count-url-button"
          vue_component="FollowerCountWidget"
          container_class="max-w-2xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-64 overflow-hidden relative"
        >
          <.vue
            v-component="FollowerCountWidget"
            v-socket={@socket}
            config={@widget_config}
            data={@current_data}
            class="w-full h-full"
            id="preview-follower-count-widget"
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Configuration Options -->
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Display Options -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Options">
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_total"
              label="Show total follower count"
              checked={@widget_config.show_total}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_platforms"
              label="Show platform breakdown"
              checked={@widget_config.show_platforms}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="animation_enabled"
              label="Enable smooth number animations"
              checked={@widget_config.animation_enabled}
            />
            <StreampaiWeb.WidgetSettingsComponents.text_input_setting
              name="total_label"
              label="Total followers label"
              value={@widget_config.total_label}
              placeholder="Total followers"
              help_text="Text displayed next to the total follower count"
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Appearance Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Appearance">
            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="display_style"
              label="Display style"
              value={@widget_config.display_style}
              options={[
                {"minimal", "Minimal (total only)"},
                {"detailed", "Detailed (list view)"},
                {"cards", "Cards (grid view)"}
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

            <StreampaiWeb.WidgetSettingsComponents.color_picker_setting
              name="icon_color"
              label="Icon Color"
              value={@widget_config.icon_color}
              default_color="#9333ea"
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Follower Count Widget"
          socket={@socket}
          url_path={~p"/widgets/follower-count/display"}
          current_user={@current_user}
          dimensions="800x200"
          instructions={["Follower counts update automatically based on your stream platforms"]}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
