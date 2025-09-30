defmodule StreampaiWeb.ChatWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring chat widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :chat_widget,
    fake_module: Streampai.Fake.Chat

  alias StreampaiWeb.Utils.WidgetHelpers
  alias StreampaiWeb.Utils.WidgetValidators

  defp widget_title, do: "Live Chat Widget"

  defp initialize_widget_specific_assigns(socket) do
    initial_messages = @fake_module.initial_messages()

    assign(socket, vue_messages: initial_messages)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:show_badges, :show_emotes, :hide_bots, :show_timestamps, :show_platform]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    new_message = @fake_module.generate_message()
    current_messages = socket.assigns.vue_messages

    # Keep only the last 10 messages
    updated_messages = Enum.take([new_message | current_messages], 10)

    assign(socket, vue_messages: updated_messages)
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 1000)

  defp convert_setting_value(setting, value) do
    case setting do
      :max_messages -> WidgetValidators.validate_numeric(value, min: 1, max: 100)
      :message_fade_time -> WidgetValidators.validate_numeric(value, min: 0, max: 300)
      :font_size -> WidgetValidators.validate_font_size(value)
      _ -> value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Live Chat Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Live Chat Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:chat_widget}
          url_path={~p"/widgets/chat/display"}
          dimensions="400x600"
          copy_button_id="copy-url-button"
          vue_component="ChatWidget"
        >
          <.vue
            v-component="ChatWidget"
            v-socket={@socket}
            config={@widget_config}
            messages={@vue_messages}
            class="w-full h-full"
            id="preview-chat-widget"
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Configuration Options -->
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Display Options -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Options">
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_badges"
              label="Show user badges"
              checked={@widget_config.show_badges}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_emotes"
              label="Show emotes"
              checked={@widget_config.show_emotes}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="hide_bots"
              label="Hide bot messages"
              checked={@widget_config.hide_bots}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_timestamps"
              label="Show timestamps"
              checked={@widget_config.show_timestamps}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_platform"
              label="Show platform badges"
              checked={@widget_config.show_platform}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Message Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Message Settings">
            <StreampaiWeb.WidgetSettingsComponents.number_input_setting
              name="max_messages"
              label="Max messages displayed"
              value={@widget_config.max_messages}
              min={1}
              max={100}
              help_text="Between 1 and 100 messages"
            />

            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="message_fade_time"
              label="Message fade time"
              value={@widget_config.message_fade_time}
              options={[
                {0, "Never"},
                {30, "30 seconds"},
                {60, "60 seconds"},
                {120, "2 minutes"}
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
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Live Chat Widget"
          socket={@socket}
          url_path={~p"/widgets/chat/display"}
          current_user={@current_user}
          dimensions="400x600"
        />
      </div>
    </.dashboard_layout>
    """
  end
end
