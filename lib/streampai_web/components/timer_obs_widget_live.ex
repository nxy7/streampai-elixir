defmodule StreampaiWeb.Components.TimerObsWidgetLive do
  @moduledoc """
  OBS display LiveView for the timer widget.
  Manages timer state through TimerManager GenServer and handles real-time updates.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.LivestreamManager.TimerManager
  alias Streampai.Fake.Timer, as: FakeTimer
  alias StreampaiWeb.Utils.WidgetHelpers

  @widget_type :timer_widget

  defp subscribe_to_real_events(user_id) do
    # Subscribe to timer-specific events
    Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_events:#{user_id}:timer")
  end

  defp initialize_display_specific_assigns(socket, user_id) do
    # Ensure TimerManager is running for this user
    case ensure_timer_manager_started(user_id) do
      :ok ->
        # Get initial timer state
        timer_state = TimerManager.get_state(user_id)

        socket
        |> assign(:user_id, user_id)
        |> assign(:current_event, nil)
        |> assign(:timer_state, timer_state)
        |> assign(:demo_mode, demo_mode?(user_id))

      {:error, _reason} ->
        # Fall back to default state if TimerManager can't be started
        default_state = %{
          current_time: 300,
          total_duration: 300,
          is_running: false,
          is_paused: false,
          count_direction: "down"
        }

        socket
        |> assign(:user_id, user_id)
        |> assign(:current_event, nil)
        |> assign(:timer_state, default_state)
        |> assign(:demo_mode, demo_mode?(user_id))
    end
  end

  def handle_info({:timer_event, event}, socket) do
    # Handle timer control events
    socket = assign(socket, :current_event, event)

    # Update local timer state
    timer_state = %{
      current_time: event[:current_time],
      total_duration: event[:total_duration],
      is_running: event[:is_running],
      is_paused: event[:is_paused]
    }

    {:noreply, assign(socket, :timer_state, timer_state)}
  end

  def handle_info({:timer_tick, tick_data}, socket) do
    # Update timer display on each tick
    {:noreply, assign(socket, :timer_state, tick_data)}
  end

  def handle_info(:generate_demo_extension, socket) do
    if socket.assigns.demo_mode do
      user_id = socket.assigns.user_id
      event_type = Enum.random([:donation, :subscription, :raid, :patreon])

      {amount, username} = case event_type do
        :donation ->
          {Enum.random(5..50), FakeTimer.generate_extension_event(:donation).username}
        :subscription ->
          {nil, FakeTimer.generate_extension_event(:subscription).username}
        :raid ->
          {Enum.random(10..200), FakeTimer.generate_extension_event(:raid).username}
        :patreon ->
          {nil, FakeTimer.generate_extension_event(:patreon).username}
      end

      extension_amount = calculate_extension_for_demo(event_type, amount, socket.assigns.config)

      TimerManager.extend_timer(user_id, extension_amount, username, event_type)

      # Schedule next demo extension
      schedule_demo_extension()
    end

    {:noreply, socket}
  end

  def handle_info(:start_demo_timer, socket) do
    if socket.assigns.demo_mode do
      TimerManager.start_timer(socket.assigns.user_id, 300)
      # Start scheduling demo extensions
      schedule_demo_extension()
    end
    {:noreply, socket}
  end

  def handle_info(%{config: config, type: @widget_type}, socket) do
    # Update TimerManager with new config
    TimerManager.update_config(socket.assigns.user_id, config)
    {:noreply, assign(socket, :config, config)}
  end

  defp ensure_timer_manager_started(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:timer_manager, user_id}) do
      [] ->
        # Start the timer manager if it's not running
        case DynamicSupervisor.start_child(
          Streampai.LivestreamManager.Supervisor,
          TimerManager.child_spec(user_id)
        ) do
          {:ok, _pid} -> :ok
          {:error, {:already_started, _pid}} -> :ok
          {:error, reason} -> {:error, reason}
        end
      [{_pid, _}] ->
        # Timer manager is already running
        :ok
    end
  end

  defp demo_mode?(user_id) do
    # Enable demo mode for development or specific test users
    Application.get_env(:streampai, :env) == :dev or String.contains?(user_id, "demo")
  end

  defp schedule_demo_extension do
    # Schedule random extensions between 10-20 seconds
    Process.send_after(self(), :generate_demo_extension, Enum.random(10_000..20_000))
  end

  defp calculate_extension_for_demo(event_type, amount, config) do
    case event_type do
      :donation ->
        donation_amount = amount || Enum.random(5..50)
        extension_per_dollar = config[:donation_extension_amount] || 30
        round(donation_amount * extension_per_dollar / 10)  # Divide by 10 for demo

      :subscription ->
        config[:subscription_extension_amount] || 60

      :raid ->
        viewers = amount || Enum.random(10..200)
        per_viewer = config[:raid_extension_per_viewer] || 1
        round(viewers * per_viewer)

      :patreon ->
        config[:patreon_extension_amount] || 120
    end
  end

  def mount(%{"user_id" => user_id}, _session, socket) do
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
          FakeTimer.default_config()
      end

    socket =
      socket
      |> assign(:config, config)
      |> initialize_display_specific_assigns(user_id)

    # Start demo timer if in demo mode
    if connected?(socket) and socket.assigns.demo_mode do
      Process.send_after(self(), :start_demo_timer, 1000)
    end

    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Timer Widget</title>
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
        <div id="timer-widget-container">
          <.vue
            v-component="TimerWidget"
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