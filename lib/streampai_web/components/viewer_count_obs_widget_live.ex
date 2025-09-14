defmodule StreampaiWeb.Components.ViewerCountObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone viewer count widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own viewer data state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Fake.ViewerCount
  alias StreampaiWeb.Utils.WidgetHelpers

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    if is_nil(user_id) do
      raise "user_id is required for viewer count widget display"
    end

    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(:viewer_count_widget, user_id)
      )

      subscribe_to_real_events(user_id)
    end

    # OBS widgets must bypass authorization as they're public endpoints
    # for browser sources with no authentication context
    config =
      case WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :viewer_count_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:ok, widget_config} when is_map(widget_config) ->
          # Handle case where config is directly returned
          Map.get(widget_config, :config, ViewerCount.default_config())

        {:error, _reason} ->
          ViewerCount.default_config()

        _ ->
          ViewerCount.default_config()
      end

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> assign(:viewer_data, ViewerCount.generate_viewer_data())

    if connected?(socket) do
      schedule_data_update(config.update_interval)
    end

    {:ok, socket, layout: false}
  end

  def handle_info({:widget_config_updated, new_config}, socket) do
    old_interval = socket.assigns.widget_config.update_interval
    new_interval = new_config.update_interval

    socket = assign(socket, :widget_config, new_config)

    # Reschedule if update interval changed
    if old_interval != new_interval do
      schedule_data_update(new_interval)
    end

    {:noreply, socket}
  end

  def handle_info(:update_viewer_data, socket) do
    current_data = socket.assigns.viewer_data
    new_data = ViewerCount.generate_viewer_update(current_data)

    socket = assign(socket, :viewer_data, new_data)

    schedule_data_update(socket.assigns.widget_config.update_interval)

    {:noreply, socket}
  end

  # Handle real viewer count events (when available)
  def handle_info({:viewer_count_update, data}, socket) do
    {:noreply, assign(socket, :viewer_data, data)}
  end

  defp schedule_data_update(interval_seconds) do
    Process.send_after(self(), :update_viewer_data, interval_seconds * 1000)
  end

  # Subscribe to real viewer count events (placeholder for future implementation)
  defp subscribe_to_real_events(_user_id) do
    # TODO: Subscribe to actual viewer count updates from streaming platforms
    # Phoenix.PubSub.subscribe(Streampai.PubSub, "viewer_counts:#{user_id}")
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent">
      <.vue
        v-component="ViewerCountWidget"
        v-socket={@socket}
        config={@widget_config}
        data={@viewer_data}
        class="w-full h-full"
        id="viewer-count-obs-widget"
      />
    </div>
    """
  end
end
