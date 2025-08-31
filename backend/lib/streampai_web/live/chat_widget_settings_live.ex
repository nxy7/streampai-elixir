defmodule StreampaiWeb.ChatWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring the chat widget settings.

  Provides a dashboard interface for customizing chat widget display options
  and generates the browser source URL for OBS embedding.
  """
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout
  import StreampaiWeb.Components.ChatDisplayComponent
  alias StreampaiWeb.Utils.FakeChat

  def mount(_params, _session, socket) do
    # seems like
    if connected?(socket) do
      schedule_next_message()
    end

    {:ok,
     socket
     |> assign(:messages, FakeChat.initial_messages())
     |> assign(:widget_config, FakeChat.default_config()), layout: false}
  end

  def handle_info(:generate_message, socket) do
    new_message = FakeChat.generate_message()

    # Add new message and respect max_messages limit
    messages = socket.assigns.messages

    updated_messages =
      (messages ++ [new_message])
      |> Enum.take(-socket.assigns.widget_config.max_messages)

    # Schedule the next message
    schedule_next_message()

    {:noreply, assign(socket, :messages, updated_messages)}
  end

  # Handle presence updates (inherited from BaseLive)
  def handle_info(
        %Phoenix.Socket.Broadcast{topic: "users_presence", event: "presence_diff"},
        socket
      ) do
    {:noreply, socket}
  end

  # Handle copy URL action
  def handle_event("copy_browser_source_url", _params, socket) do
    {:noreply, put_flash(socket, :info, "Browser source URL copied to clipboard!")}
  end

  # Handle configuration changes for checkboxes (from form events)
  def handle_event("toggle_setting", params, socket) do
    current_config = socket.assigns.widget_config
    
    # Extract checkbox values from form params
    # Checkboxes not checked won't be in params, so default to false
    updated_config = %{
      current_config |
      show_badges: Map.get(params, "show_badges") == "on",
      show_emotes: Map.get(params, "show_emotes") == "on", 
      hide_bots: Map.get(params, "hide_bots") == "on",
      show_timestamps: Map.get(params, "show_timestamps") == "on",
      show_platform: Map.get(params, "show_platform") == "on"
    }

    # Broadcast to OBS widgets
    user_id = socket.assigns.current_user.id
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "widget_config:#{user_id}",
      %{config: updated_config}
    )

    {:noreply, assign(socket, :widget_config, updated_config)}
  end

  def handle_event("update_setting", params, socket) do
    current_config = socket.assigns.widget_config

    {setting, value} =
      case params do
        %{"setting" => setting, "value" => value} ->
          {setting, value}

        %{"_target" => [field]} = p when is_map_key(p, field) ->
          {field, Map.get(p, field)}

        _other ->
          # fallback
          {"max_messages", "25"}
      end

    atom_setting = String.to_existing_atom(setting)

    # Convert value to appropriate type and validate
    converted_value =
      case atom_setting do
        :max_messages ->
          num = String.to_integer(value)
          # Clamp between 1 and 100
          max(1, min(100, num))

        :message_fade_time ->
          String.to_integer(value)

        :font_size ->
          value

        _ ->
          value
      end

    updated_config = Map.put(current_config, atom_setting, converted_value)

    # Apply message limit if max_messages was changed
    updated_messages =
      if atom_setting == :max_messages do
        socket.assigns.messages |> Enum.take(-converted_value)
      else
        socket.assigns.messages
      end

    # Broadcast config update to all connected widgets for this user
    user_id = socket.assigns.current_user.id

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "widget_config:#{user_id}",
      %{config: updated_config}
    )

    {:noreply,
     socket
     |> assign(:widget_config, updated_config)
     |> assign(:messages, updated_messages)}
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
                phx-click="copy_browser_source_url"
                data-clipboard-text={url(~p"/widgets/chat/display?user_id=#{@current_user.id}")}
              >
                Copy Browser Source URL
              </button>
              <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                Configure
              </button>
            </div>
          </div>
          
    <!-- Chat Widget Display -->
          <div class="max-w-md mx-auto bg-gray-900 border border-gray-200 rounded p-4">
            <div class="text-xs text-gray-400 mb-2">Preview (actual widget is transparent)</div>
            <.chat_display id="preview-chat-widget" config={@widget_config} messages={@messages} />
          </div>
        </div>
        
    <!-- Configuration Options -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Widget Settings</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Display Options -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-700">Display Options</h4>

              <form phx-change="toggle_setting">
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
              </form>
            </div>
            
            <!-- Message Settings -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-700">Message Settings</h4>

              <form phx-change="update_setting">
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
                      <option value="0" selected={@widget_config.message_fade_time == 0}>Never</option>
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

  # Helper functions

  defp schedule_next_message do
    # 5000ms = once every 5 seconds (reasonable for demo)
    delay = 5000
    Process.send_after(self(), :generate_message, delay)
  end
end
