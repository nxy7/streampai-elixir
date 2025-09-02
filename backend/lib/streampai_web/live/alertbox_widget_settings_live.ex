defmodule StreampaiWeb.AlertboxWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring alertbox widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout
  alias StreampaiWeb.Utils.FakeAlert

  def mount(_params, _session, socket) do
    current_user = socket.assigns.current_user

    if connected?(socket) do
      schedule_next_event()
    end

    initial_events = FakeAlert.initial_events()

    {:ok, %{config: initial_config}} =
      Streampai.Accounts.WidgetConfig.get_by_user_and_type(%{
        user_id: current_user.id,
        type: :alertbox_widget
      })

    {:ok,
     socket
     |> stream(:events, initial_events)
     |> assign(:widget_config, initial_config)
     |> assign(:vue_events, initial_events), layout: false}
  end

  def handle_info(:generate_event, socket) do
    new_event = FakeAlert.generate_event()

    socket = socket |> stream_insert(:events, new_event, at: -1)

    current_vue_events = Map.get(socket.assigns, :vue_events, [])
    updated_vue_events = [new_event | current_vue_events]

    # Keep last 10 events for preview
    limited_vue_events = Enum.take(updated_vue_events, 10)

    socket = assign(socket, :vue_events, limited_vue_events)

    schedule_next_event()
    {:noreply, socket}
  end

  def handle_info(
        %Phoenix.Socket.Broadcast{topic: "users_presence", event: "presence_diff"},
        socket
      ) do
    {:noreply, socket}
  end

  def handle_event("toggle_setting", params, socket) do
    current_config = socket.assigns.widget_config

    updated_config = %{
      current_config
      | sound_enabled: Map.get(params, "sound_enabled") == "on",
        show_message: Map.get(params, "show_message") == "on",
        show_amount: Map.get(params, "show_amount") == "on"
    }

    broadcast_and_save_config(socket, updated_config)
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
          {"display_duration", "5"}
      end

    atom_setting = String.to_existing_atom(setting)

    converted_value =
      case atom_setting do
        :display_duration ->
          num = String.to_integer(value)
          max(1, min(30, num))

        :sound_volume ->
          num = String.to_integer(value)
          max(0, min(100, num))

        :animation_type ->
          value

        :alert_position ->
          value

        :font_size ->
          value

        _ ->
          value
      end

    updated_config = Map.put(current_config, atom_setting, converted_value)

    broadcast_and_save_config(socket, updated_config)
    {:noreply, assign(socket, :widget_config, updated_config)}
  end

  defp broadcast_and_save_config(socket, config) do
    current_user = socket.assigns.current_user

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "widget_config:#{current_user.id}",
      %{config: config, type: :alertbox_widget}
    )

    Streampai.Accounts.WidgetConfig.create(
      %{
        user_id: current_user.id,
        type: :alertbox_widget,
        config: config
      },
      actor: current_user
    )
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
              events={@vue_events}
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

              <form phx-change="toggle_setting">
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

              <form phx-change="update_setting">
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

  defp schedule_next_event, do: Process.send_after(self(), :generate_event, 7000)
end
