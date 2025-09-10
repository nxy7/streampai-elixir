defmodule StreampaiWeb.ChatWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring chat widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :chat_widget,
    fake_module: Streampai.Fake.Chat

  alias StreampaiWeb.Utils.WidgetHelpers

  # Widget-specific implementations
  defp widget_title, do: "Live Chat Widget"

  defp initialize_widget_specific_assigns(socket) do
    initial_messages = @fake_module.initial_messages()

    socket
    |> stream(:messages, initial_messages)
    |> assign(:vue_messages, initial_messages)
  end

  defp update_widget_settings(config, params) do
    # Handle boolean settings (checkboxes that send "on" when checked)
    boolean_fields = [:show_badges, :show_emotes, :hide_bots, :show_timestamps, :show_platform]

    config_with_booleans =
      WidgetHelpers.update_boolean_settings(config, params, boolean_fields)

    # Handle other settings (numbers, selects, etc.)
    Enum.reduce(params, config_with_booleans, fn {key, value}, acc ->
      case key do
        key
        when key in [
               "show_badges",
               "show_emotes",
               "hide_bots",
               "show_timestamps",
               "show_platform"
             ] ->
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
    new_message = @fake_module.generate_message()

    # Add new message to stream and let stream handle limiting
    socket = socket |> stream_insert(:messages, new_message, at: -1)

    current_vue_messages = Map.get(socket.assigns, :vue_messages, [])
    updated_vue_messages = [new_message | current_vue_messages]

    # Limit messages to max_messages
    limited_vue_messages =
      Enum.take(updated_vue_messages, socket.assigns.widget_config.max_messages)

    assign(socket, :vue_messages, limited_vue_messages)
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 1000)

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
      :max_messages ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 100)

      :message_fade_time ->
        WidgetHelpers.parse_numeric_setting(value, min: 0, max: 300)

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
    <.dashboard_layout {assigns} current_page="widgets" page_title="Live Chat Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Live Chat Widget Preview</h3>
            <div class="flex items-center space-x-2">
              <button
                id="copy-url-button"
                class="text-sm text-purple-600 hover:text-purple-700 font-medium"
                phx-hook="CopyToClipboard"
                data-clipboard-text={url(~p"/widgets/chat/display?user_id=#{@current_user.id}")}
                data-clipboard-message="Browser source URL copied!"
              >
                Copy Browser Source URL
              </button>
              <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                Configure
              </button>
            </div>
          </div>
          
    <!-- Chat Widget Display -->
          <div class="max-w-md mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-96 overflow-hidden">
            <div class="text-xs text-gray-400 mb-2">Preview (actual widget is transparent)</div>
            <.vue
              v-component="ChatWidget"
              v-socket={@socket}
              config={@widget_config}
              messages={@vue_messages}
              class="w-full h-full"
              id="preview-chat-widget"
            />
          </div>
        </div>
        
    <!-- Configuration Options -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Widget Settings</h3>

          <form phx-change="update_settings">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Display Options -->
              <div class="space-y-4">
                <h4 class="font-medium text-gray-700">Display Options</h4>

                <div class="space-y-3">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="show_badges"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.show_badges}
                    />
                    <span class="ml-2 text-sm text-gray-700">Show user badges</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="show_emotes"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.show_emotes}
                    />
                    <span class="ml-2 text-sm text-gray-700">Show emotes</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="hide_bots"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.hide_bots}
                    />
                    <span class="ml-2 text-sm text-gray-700">Hide bot messages</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="show_timestamps"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.show_timestamps}
                    />
                    <span class="ml-2 text-sm text-gray-700">Show timestamps</span>
                  </label>

                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="show_platform"
                      class="rounded border-gray-300 text-purple-600"
                      checked={@widget_config.show_platform}
                    />
                    <span class="ml-2 text-sm text-gray-700">Show platform badges</span>
                  </label>
                </div>
              </div>
              
    <!-- Message Settings -->
              <div class="space-y-4">
                <h4 class="font-medium text-gray-700">Message Settings</h4>

                <div class="space-y-3">
                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Max messages displayed</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      name="max_messages"
                      value={@widget_config.max_messages}
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p class="text-xs text-gray-500 mt-1">Between 1 and 100 messages</p>
                  </div>

                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Message fade time</label>
                    <select
                      name="message_fade_time"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="0" selected={@widget_config.message_fade_time == 0}>
                        Never
                      </option>
                      <option value="30" selected={@widget_config.message_fade_time == 30}>
                        30 seconds
                      </option>
                      <option value="60" selected={@widget_config.message_fade_time == 60}>
                        60 seconds
                      </option>
                      <option value="120" selected={@widget_config.message_fade_time == 120}>
                        2 minutes
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
                </div>
              </div>
            </div>
          </form>
        </div>
        
    <!-- Usage Instructions -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="text-lg font-medium text-blue-900 mb-4">How to use in OBS</h3>
          <div class="space-y-2 text-sm text-blue-800">
            <p><strong>1.</strong> Copy the browser source URL above</p>
            <p><strong>2.</strong> In OBS, add a "Browser Source"</p>
            <p><strong>3.</strong> Paste the URL and set dimensions to 400x600</p>
            <p><strong>4.</strong> Position the widget on your stream layout</p>
          </div>

          <div class="mt-4 p-3 bg-white border border-blue-200 rounded">
            <p class="text-xs text-gray-600 font-mono break-all">
              {url(~p"/widgets/chat/display?user_id=#{@current_user.id}")}
            </p>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
