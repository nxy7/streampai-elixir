defmodule StreampaiWeb.Components.GiveawayObsWidgetLive do
  @moduledoc """
  OBS display LiveView for the giveaway widget.
  Subscribes to configuration updates and displays giveaway status for OBS overlay.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Fake.Giveaway, as: FakeGiveaway
  alias StreampaiWeb.Utils.WidgetHelpers

  @widget_type :giveaway_widget

  defp subscribe_to_real_events(user_id) do
    # Subscribe to giveaway-specific events
    Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_events:#{user_id}:giveaway")
  end

  defp initialize_display_specific_assigns(socket, user_id) do
    socket
    |> assign(:user_id, user_id)
    |> assign(:current_event, nil)
    |> assign(:demo_mode, demo_mode?(user_id))
  end

  def handle_info({:giveaway_event, event}, socket) do
    # Handle real giveaway events from the system
    socket = assign(socket, :current_event, event)
    {:noreply, socket}
  end

  def handle_info(:generate_demo_event, socket) do
    if socket.assigns.demo_mode do
      # Generate demo giveaway events
      event = FakeGiveaway.generate_event()
      socket = assign(socket, :current_event, event)

      # Schedule next demo event
      schedule_demo_event()
      {:noreply, socket}
    else
      {:noreply, socket}
    end
  end

  def handle_info(%{config: config, type: @widget_type}, socket) do
    # Configuration updated from settings page
    {:noreply, assign(socket, :config, config)}
  end

  defp demo_mode?(user_id) do
    # Enable demo mode for development or specific test users
    Application.get_env(:streampai, :env) == :dev or String.contains?(user_id, "demo")
  end

  defp schedule_demo_event do
    # Schedule demo events every 8-12 seconds
    Process.send_after(self(), :generate_demo_event, Enum.random(8_000..12_000))
  end

  def mount(params, session, socket) do
    mount_with_user_id(params, session, socket)
  end

  defp mount_with_user_id(%{"user_id" => user_id}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(@widget_type, user_id)
      )

      subscribe_to_real_events(user_id)
    end

    config =
      case WidgetConfig.get_by_user_and_type(
             %{user_id: user_id, type: @widget_type},
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:error, _} ->
          FakeGiveaway.default_config()
      end

    socket =
      socket
      |> assign(:config, config)
      |> initialize_display_specific_assigns(user_id)

    # Start demo events if in demo mode
    if connected?(socket) and socket.assigns.demo_mode do
      schedule_demo_event()
    end

    {:ok, socket, layout: false}
  end

  defp mount_with_user_id(params, %{"user" => user_token}, socket) when is_binary(user_token) do
    # Extract user_id from session user token
    user_id = user_token |> String.split(":") |> List.first()
    mount_with_user_id(Map.put(params, "user_id", user_id), %{}, socket)
  end

  defp mount_with_user_id(_params, _session, socket) do
    # No user_id provided and no authenticated user - use demo mode
    demo_user_id = "demo_user_#{8 |> :crypto.strong_rand_bytes() |> Base.encode16(case: :lower)}"
    mount_with_user_id(%{"user_id" => demo_user_id}, %{}, socket)
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Giveaway Widget</title>
        <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
        <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
        </script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: transparent;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="giveaway-widget-container">
          <.vue
            v-component="GiveawayWidget"
            v-socket={@socket}
            config={@config}
            event={@current_event}
          />
        </div>
      </body>
    </html>
    """
  end
end
