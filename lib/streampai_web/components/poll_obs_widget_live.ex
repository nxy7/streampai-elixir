defmodule StreampaiWeb.Components.PollObsWidgetLive do
  @moduledoc """
  LiveView for displaying the standalone poll widget for OBS embedding.

  This is the public endpoint that OBS will embed as a browser source.
  Manages its own poll data state and subscribes to configuration changes.
  """
  use StreampaiWeb, :live_view

  alias Streampai.Accounts.WidgetConfig
  alias StreampaiWeb.Utils.FakePoll
  alias StreampaiWeb.Utils.WidgetHelpers

  # Demo timing constants
  @demo_start_delay 3000
  @demo_active_duration 8000
  @demo_vote_update_delay 5000
  @demo_results_duration 10_000
  @demo_wait_duration 5000

  def mount(params, _session, socket) do
    user_id = params["user_id"] || Map.get(socket.assigns, :live_action_params, %{})["user_id"]

    cond do
      is_nil(user_id) ->
        raise "user_id is required for poll widget display"

      not valid_uuid?(user_id) ->
        raise "user_id must be a valid UUID"

      true ->
        :ok
    end

    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        Streampai.PubSub,
        WidgetHelpers.widget_config_topic(:poll_widget, user_id)
      )

      subscribe_to_real_events(user_id)
    end

    # OBS widgets must bypass authorization as they're public endpoints
    # for browser sources with no authentication context
    config =
      case WidgetConfig.get_by_user_and_type(
             %{
               user_id: user_id,
               type: :poll_widget
             },
             authorize?: false
           ) do
        {:ok, %{config: config}} ->
          config

        {:ok, widget_config} when is_map(widget_config) ->
          # Handle case where config is directly returned
          Map.get(widget_config, :config, FakePoll.default_config())

        {:error, _reason} ->
          FakePoll.default_config()

        _ ->
          FakePoll.default_config()
      end

    socket =
      socket
      |> assign(:user_id, user_id)
      |> assign(:widget_config, config)
      |> assign(:poll_status, nil)
      |> assign(:demo_cycle_state, "waiting")

    if connected?(socket) do
      # Start demo cycle after delay
      schedule_demo_event(@demo_start_delay)
    end

    {:ok, socket, layout: false}
  end

  def handle_info({:widget_config_updated, new_config}, socket) do
    socket = assign(socket, :widget_config, new_config)
    {:noreply, socket}
  end

  def handle_info(:demo_poll_cycle, socket) do
    # Cycle through different poll states for demo
    new_state =
      case socket.assigns.demo_cycle_state do
        "waiting" ->
          # Start with an active poll
          poll_status = FakePoll.generate_active_poll()
          # Show active poll for 8 seconds
          schedule_demo_event(@demo_active_duration)
          assign(socket, poll_status: poll_status, demo_cycle_state: "active")

        "active" ->
          # Add some votes to the current poll
          current_poll = socket.assigns.poll_status

          if current_poll do
            updated_poll = FakePoll.simulate_vote_update(current_poll)
            # Show more votes in 5 seconds
            schedule_demo_event(@demo_vote_update_delay)
            assign(socket, poll_status: updated_poll, demo_cycle_state: "active_with_votes")
          else
            # Fallback if no current poll
            poll_status = FakePoll.generate_active_poll()
            schedule_demo_event(@demo_vote_update_delay)
            assign(socket, poll_status: poll_status, demo_cycle_state: "active_with_votes")
          end

        "active_with_votes" ->
          # End the poll and show results
          current_poll = socket.assigns.poll_status

          if current_poll do
            ended_poll = %{current_poll | status: "ended"}
            # Show results for 10 seconds
            schedule_demo_event(@demo_results_duration)
            assign(socket, poll_status: ended_poll, demo_cycle_state: "ended")
          else
            # Fallback
            poll_status = FakePoll.generate_ended_poll()
            schedule_demo_event(@demo_results_duration)
            assign(socket, poll_status: poll_status, demo_cycle_state: "ended")
          end

        "ended" ->
          # Clear poll and wait before starting new cycle
          schedule_demo_event(@demo_wait_duration)
          assign(socket, poll_status: nil, demo_cycle_state: "waiting")
      end

    {:noreply, new_state}
  end

  # Handle real poll events (when available)
  def handle_info({:poll_started, poll_data}, socket) do
    {:noreply, assign(socket, :poll_status, poll_data)}
  end

  def handle_info({:poll_updated, poll_data}, socket) do
    {:noreply, assign(socket, :poll_status, poll_data)}
  end

  def handle_info({:poll_ended, poll_data}, socket) do
    poll_data = %{poll_data | status: "ended"}
    socket = assign(socket, :poll_status, poll_data)

    # Auto-hide if configured
    if socket.assigns.widget_config[:auto_hide_after_end] do
      hide_delay = (socket.assigns.widget_config[:hide_delay] || 10) * 1000
      Process.send_after(self(), :hide_poll, hide_delay)
    end

    {:noreply, socket}
  end

  def handle_info({:new_vote, vote_data}, socket) do
    # Update poll with new vote
    if socket.assigns.poll_status do
      updated_poll = update_poll_with_vote(socket.assigns.poll_status, vote_data)
      {:noreply, assign(socket, :poll_status, updated_poll)}
    else
      {:noreply, socket}
    end
  end

  def handle_info(:hide_poll, socket) do
    {:noreply, assign(socket, :poll_status, nil)}
  end

  defp schedule_demo_event(interval_ms) do
    Process.send_after(self(), :demo_poll_cycle, interval_ms)
  end

  defp subscribe_to_real_events(user_id) do
    # Subscribe to real poll events from streaming platforms
    Phoenix.PubSub.subscribe(Streampai.PubSub, "polls:#{user_id}")
  end

  defp valid_uuid?(user_id) when is_binary(user_id) do
    case UUID.info(user_id) do
      {:ok, _} -> true
      {:error, _} -> false
    end
  end

  defp valid_uuid?(_), do: false

  defp update_poll_with_vote(poll_status, vote_data) do
    # Find the option that was voted for and increment its count
    option_id = vote_data[:option_id]

    updated_options =
      Enum.map(poll_status.options, fn option ->
        if option.id == option_id do
          %{option | votes: option.votes + 1}
        else
          option
        end
      end)

    total_votes = Enum.reduce(updated_options, 0, fn option, acc -> acc + option.votes end)

    %{poll_status | options: updated_options, total_votes: total_votes}
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen bg-transparent">
      <.vue
        v-component="PollWidget"
        v-socket={@socket}
        config={@widget_config}
        poll-status={@poll_status}
        class="w-full h-full"
        id="poll-obs-widget"
      />
    </div>
    """
  end
end
