defmodule StreampaiWeb.Components.FollowerCountObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone follower count widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own follower data state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Fake.FollowerCount
  alias StreampaiWeb.Utils.WidgetHelpers

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    if is_nil(user_id) do
      raise "user_id is required for follower count widget display"
    end

    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(:follower_count_widget, user_id)
      )

      subscribe_to_real_events(user_id)
    end

    # OBS widgets must bypass authorization as they're public endpoints
    # for browser sources with no authentication context
    config =
      case WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :follower_count_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:ok, widget_config} when is_map(widget_config) ->
          # Handle case where config is directly returned
          Map.get(widget_config, :config, FollowerCount.default_config())

        {:error, _reason} ->
          FollowerCount.default_config()

        _ ->
          FollowerCount.default_config()
      end

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> assign(:follower_data, FollowerCount.generate_follower_data())

    if connected?(socket) do
      # 7 seconds for demo
      schedule_data_update(7000)
    end

    {:ok, socket, layout: false}
  end

  def handle_info({:widget_config_updated, new_config}, socket) do
    socket = assign(socket, :widget_config, new_config)
    {:noreply, socket}
  end

  def handle_info(:update_follower_data, socket) do
    current_data = socket.assigns.follower_data
    new_data = FollowerCount.generate_follower_update(current_data)

    socket = assign(socket, :follower_data, new_data)

    # 7 seconds for demo
    schedule_data_update(7000)

    {:noreply, socket}
  end

  # Handle real follower count events (when available)
  def handle_info({:follower_count_update, data}, socket) do
    {:noreply, assign(socket, :follower_data, data)}
  end

  defp schedule_data_update(interval_ms) do
    Process.send_after(self(), :update_follower_data, interval_ms)
  end

  defp subscribe_to_real_events(_user_id) do
    # Future: Subscribe to actual follower count updates from streaming platforms
    # Phoenix.PubSub.subscribe(Streampai.PubSub, "follower_counts:#{user_id}")
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent">
      <.vue
        v-component="FollowerCountWidget"
        v-socket={@socket}
        config={@widget_config}
        data={@follower_data}
        class="w-full h-full"
        id="follower-count-obs-widget"
      />
    </div>
    """
  end
end
