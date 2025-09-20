defmodule StreampaiWeb.Components.EventlistObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone eventlist widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own event state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias StreampaiWeb.Utils.FakeEventlist
  alias StreampaiWeb.Utils.PlatformColors
  alias StreampaiWeb.Utils.WidgetHelpers

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    if is_nil(user_id) do
      raise "user_id is required for eventlist widget display"
    end

    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(:eventlist_widget, user_id)
      )

      subscribe_to_real_events(user_id)
      schedule_demo_event()
    end

    config =
      case WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :eventlist_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:error, _} ->
          FakeEventlist.default_config()
      end

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> initialize_display_assigns()

    {:ok, socket, layout: false}
  end

  defp initialize_display_assigns(socket) do
    max_events = socket.assigns.widget_config.max_events || 10
    initial_events = FakeEventlist.generate_events(max_events)
    assign(socket, :current_events, initial_events)
  end

  defp subscribe_to_real_events(user_id) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "stream_events:#{user_id}")
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 8000)

  def handle_info(%{config: new_config, type: type}, socket) when type == :eventlist_widget do
    {:noreply, assign(socket, :widget_config, new_config)}
  end

  def handle_info(%{config: _config, type: _other_type}, socket) do
    {:noreply, socket}
  end

  def handle_info(:generate_demo_event, socket) do
    # Add a new demo event to the top of the list
    new_event = FakeEventlist.generate_event()
    current_events = socket.assigns.current_events || []
    max_events = socket.assigns.widget_config.max_events || 10

    updated_events = Enum.take([new_event | current_events], max_events)

    schedule_demo_event()
    {:noreply, assign(socket, :current_events, updated_events)}
  end

  def handle_info({:stream_event, event}, socket) do
    handle_real_event(socket, event)
  end

  def handle_info({:new_event, event}, socket) do
    handle_real_event(socket, event)
  end

  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  defp handle_real_event(socket, event) do
    transformed_event = transform_stream_event(event)
    current_events = socket.assigns.current_events || []
    max_events = socket.assigns.widget_config.max_events || 10

    updated_events = Enum.take([transformed_event | current_events], max_events)

    {:noreply, assign(socket, :current_events, updated_events)}
  end

  defp transform_stream_event(event) do
    %{
      id: Map.get(event, :id, generate_event_id()),
      type: normalize_event_type(Map.get(event, :type)),
      username: Map.get(event, :username, Map.get(event, :author_id, "Unknown")),
      message: extract_message(event),
      amount: Map.get(event, :amount),
      currency: Map.get(event, :currency, "$"),
      timestamp: Map.get(event, :timestamp, DateTime.utc_now()),
      platform: get_platform_info(event),
      data: Map.get(event, :data, %{})
    }
  end

  defp generate_event_id, do: "event_#{System.unique_integer([:positive])}"

  defp normalize_event_type(type) when is_atom(type), do: Atom.to_string(type)
  defp normalize_event_type(type) when is_binary(type), do: type
  defp normalize_event_type(_), do: "chat_message"

  defp extract_message(event) do
    Map.get(event, :message) ||
      get_in(event, [:data, "message"]) ||
      get_in(event, [:data, :message]) ||
      ""
  end

  defp get_platform_info(%{platform: platform}) when is_atom(platform) do
    %{
      icon: Atom.to_string(platform),
      color: PlatformColors.get_platform_color(platform)
    }
  end

  defp get_platform_info(%{platform: platform}) when is_binary(platform) do
    safe_platform =
      case platform do
        "twitch" -> :twitch
        "youtube" -> :youtube
        "facebook" -> :facebook
        "kick" -> :kick
        _ -> :twitch
      end

    %{
      icon: platform,
      color: PlatformColors.get_platform_color(safe_platform)
    }
  end

  defp get_platform_info(_event) do
    %{icon: "twitch", color: PlatformColors.get_platform_color(:twitch)}
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent">
      <.vue
        v-component="EventListWidget"
        v-socket={@socket}
        config={@widget_config}
        events={@current_events}
        class="w-full h-full"
        id="live-eventlist-widget"
      />
    </div>
    """
  end
end
