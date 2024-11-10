defmodule Streampai.LivestreamManager.AlertQueue do
  @moduledoc """
  GenServer that manages a priority queue of alert events for a user's alertbox.

  Handles event queuing, prioritization, and cross-device synchronization.
  Supports control commands like pause, skip, and clear.
  """
  use GenServer
  require Logger

  defstruct [
    :user_id,
    # Priority queue of events (lower number = higher priority)
    :event_queue,
    # :playing, :paused, :clearing
    :queue_state,
    # Timer for automatic event processing
    :processing_timer,
    # Processing interval in milliseconds
    :processing_interval,
    # Maximum queue size before dropping low-priority events
    :max_queue_size,
    # Event history for debugging/recovery
    :event_history,
    # Last time an event was processed (for minimum spacing)
    :last_processed_at,
    # Display time of the last processed event (for dynamic timing)
    :last_event_display_time
  ]

  # Event priorities (lower number = higher priority)
  @control_priority 0
  # donations, raids, big follows
  @high_priority 1
  # follows, subs, cheers
  @medium_priority 2
  # chat messages
  @low_priority 3

  # Public API

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @doc """
  Enqueues an alert event with automatic priority assignment.
  """
  def enqueue_event(server, event) do
    GenServer.cast(server, {:enqueue_event, event})
  end

  @doc """
  Enqueues a control command (pause, skip, clear).
  """
  def enqueue_control(server, command) do
    GenServer.cast(server, {:enqueue_control, command})
  end

  @doc """
  Gets the current queue state and next few events.
  """
  def get_queue_status(server) do
    GenServer.call(server, :get_queue_status)
  end

  @doc """
  Manually triggers processing the next event.
  """
  def process_next_event(server) do
    GenServer.call(server, :process_next_event)
  end

  @doc """
  Pauses the queue processing.
  """
  def pause_queue(server) do
    enqueue_control(server, :pause)
  end

  @doc """
  Resumes the queue processing.
  """
  def resume_queue(server) do
    enqueue_control(server, :resume)
  end

  @doc """
  Skips the current/next event.
  """
  def skip_event(server) do
    enqueue_control(server, :skip)
  end

  @doc """
  Clears all non-control events from the queue.
  """
  def clear_queue(server) do
    enqueue_control(server, :clear)
  end

  # Server callbacks

  @impl true
  def init(user_id) do
    config = load_config()

    state = %__MODULE__{
      user_id: user_id,
      event_queue: :queue.new(),
      queue_state: :playing,
      processing_timer: nil,
      processing_interval: config.processing_interval,
      max_queue_size: config.max_queue_size,
      event_history: [],
      last_processed_at: nil,
      last_event_display_time: nil
    }

    # Subscribe to donation and other alert events for this user
    Logger.info("AlertQueue subscribing to PubSub channels for user #{user_id}")

    :ok = Phoenix.PubSub.subscribe(Streampai.PubSub, "donations:#{user_id}")
    :ok = Phoenix.PubSub.subscribe(Streampai.PubSub, "follows:#{user_id}")
    :ok = Phoenix.PubSub.subscribe(Streampai.PubSub, "subscriptions:#{user_id}")
    :ok = Phoenix.PubSub.subscribe(Streampai.PubSub, "raids:#{user_id}")
    :ok = Phoenix.PubSub.subscribe(Streampai.PubSub, "cheers:#{user_id}")

    Logger.info("AlertQueue PubSub subscription results", %{
      user_id: user_id
    })

    # Start processing timer
    state = schedule_next_processing(state)

    Logger.info("AlertQueue started for user #{user_id} - subscribed to alert channels")
    {:ok, state}
  end

  @impl true
  def handle_cast({:enqueue_event, event}, state) do
    priority = determine_event_priority(event)

    prioritized_event = %{
      id: generate_event_id(),
      priority: priority,
      event: event,
      timestamp: DateTime.utc_now(),
      type: :event
    }

    state = add_to_queue(state, prioritized_event)
    broadcast_queue_update(state)

    {:noreply, state}
  end

  @impl true
  def handle_cast({:enqueue_control, command}, state) do
    control_event = %{
      id: generate_event_id(),
      priority: @control_priority,
      command: command,
      timestamp: DateTime.utc_now(),
      type: :control
    }

    state = add_to_queue(state, control_event)
    broadcast_queue_update(state)

    # Process control commands immediately
    {_result, state} = process_next_event_internal(state)

    {:noreply, state}
  end

  @impl true
  def handle_call(:get_queue_status, _from, state) do
    queue_list = :queue.to_list(state.event_queue)

    status = %{
      queue_state: state.queue_state,
      queue_length: length(queue_list),
      next_events: Enum.take(queue_list, 5),
      recent_history: Enum.take(state.event_history, 10)
    }

    {:reply, status, state}
  end

  @impl true
  def handle_call(:process_next_event, _from, state) do
    {result, new_state} = process_next_event_internal(state)
    {:reply, result, new_state}
  end

  @impl true
  def handle_info(:process_next_event, state) do
    Logger.debug("AlertQueue timer triggered", %{
      user_id: state.user_id,
      queue_length: :queue.len(state.event_queue),
      queue_state: state.queue_state
    })

    {_result, state} = process_next_event_internal(state)
    state = schedule_next_processing(state)
    {:noreply, state}
  end

  # Handle donation events from PubSub
  @impl true
  def handle_info({:new_donation, donation_data}, state) do
    Logger.info("AlertQueue received donation PubSub message", %{
      user_id: state.user_id,
      donation_data: donation_data
    })

    # Transform donation data to AlertQueue event format
    event = %{
      type: :donation,
      username: donation_data.donor_name || "Anonymous",
      message: donation_data.message,
      amount: donation_data.amount,
      currency: donation_data.currency,
      # Donations from web interface
      platform: :web,
      timestamp: donation_data.timestamp
    }

    Logger.info("AlertQueue transformed donation event", %{
      user_id: state.user_id,
      event: event
    })

    # Add to queue
    state = add_event_to_queue(state, event)
    broadcast_queue_update(state)

    Logger.info("AlertQueue queued donation event", %{
      user_id: state.user_id,
      queue_length: :queue.len(state.event_queue)
    })

    {:noreply, state}
  end

  # Handle other event types
  @impl true
  def handle_info({:new_follow, follow_data}, state) do
    event = %{
      type: :follow,
      username: follow_data.username,
      platform: follow_data.platform || :twitch,
      timestamp: follow_data.timestamp || DateTime.utc_now()
    }

    state = add_event_to_queue(state, event)
    broadcast_queue_update(state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:new_subscription, sub_data}, state) do
    event = %{
      type: :subscription,
      username: sub_data.username,
      tier: sub_data.tier,
      months: sub_data.months,
      message: sub_data.message,
      platform: sub_data.platform || :twitch,
      timestamp: sub_data.timestamp || DateTime.utc_now()
    }

    state = add_event_to_queue(state, event)
    broadcast_queue_update(state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:new_raid, raid_data}, state) do
    event = %{
      type: :raid,
      username: raid_data.username,
      viewer_count: raid_data.viewer_count,
      platform: raid_data.platform || :twitch,
      timestamp: raid_data.timestamp || DateTime.utc_now()
    }

    state = add_event_to_queue(state, event)
    broadcast_queue_update(state)
    {:noreply, state}
  end

  @impl true
  def handle_info({:new_cheer, cheer_data}, state) do
    event = %{
      type: :cheer,
      username: cheer_data.username,
      bits: cheer_data.bits,
      message: cheer_data.message,
      platform: cheer_data.platform || :twitch,
      timestamp: cheer_data.timestamp || DateTime.utc_now()
    }

    state = add_event_to_queue(state, event)
    broadcast_queue_update(state)
    {:noreply, state}
  end

  # Catch-all for other messages
  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # Helper functions

  defp via_tuple(user_id) do
    registry_name =
      if Application.get_env(:streampai, :test_mode, false) do
        case Process.get(:test_registry_name) do
          nil -> Streampai.LivestreamManager.Registry
          test_registry -> test_registry
        end
      else
        Streampai.LivestreamManager.Registry
      end

    {:via, Registry, {registry_name, {:alert_queue, user_id}}}
  end

  defp load_config do
    %{
      processing_interval: Application.get_env(:streampai, :alert_processing_interval, 5000),
      max_queue_size: Application.get_env(:streampai, :max_alert_queue_size, 50)
    }
  end

  defp determine_event_priority(event) do
    case event.type do
      # High priority events
      :donation when event.amount >= 10.00 -> @high_priority
      :raid when event.viewer_count >= 10 -> @high_priority
      :follow when event.is_verified or event.follower_count >= 1000 -> @high_priority
      # Medium priority events
      :donation -> @medium_priority
      :subscription -> @medium_priority
      :cheer when event.bits >= 100 -> @medium_priority
      :follow -> @medium_priority
      :raid -> @medium_priority
      # Low priority events
      :chat_message -> @low_priority
      :cheer -> @low_priority
      # Default to medium priority
      _ -> @medium_priority
    end
  end

  defp add_to_queue(state, item) do
    # Check if queue is at capacity
    queue_size = :queue.len(state.event_queue)

    state =
      if queue_size >= state.max_queue_size do
        # Remove lowest priority items to make room
        drop_low_priority_events(state)
      else
        state
      end

    # Insert item in priority order
    new_queue = insert_by_priority(state.event_queue, item)

    %{state | event_queue: new_queue}
  end

  defp insert_by_priority(queue, new_item) do
    queue_list = :queue.to_list(queue)

    # Find insertion point (sort by priority, then by timestamp)
    {before, remaining} =
      Enum.split_while(queue_list, fn item ->
        item.priority < new_item.priority or
          (item.priority == new_item.priority and
             DateTime.compare(item.timestamp, new_item.timestamp) != :gt)
      end)

    # Rebuild queue with new item inserted
    (before ++ [new_item] ++ remaining)
    |> Enum.reduce(:queue.new(), fn item, acc -> :queue.in(item, acc) end)
  end

  defp drop_low_priority_events(state) do
    queue_list = :queue.to_list(state.event_queue)

    # Keep control and high-priority events, drop some low-priority ones
    kept_events =
      queue_list
      |> Enum.sort_by(fn item -> {item.priority, item.timestamp} end)
      # Leave room for new event
      |> Enum.take(state.max_queue_size - 1)

    new_queue =
      Enum.reduce(kept_events, :queue.new(), fn item, acc ->
        :queue.in(item, acc)
      end)

    dropped_count = length(queue_list) - length(kept_events)

    if dropped_count > 0 do
      Logger.info("Dropped #{dropped_count} low-priority events for user #{state.user_id}")
    end

    %{state | event_queue: new_queue}
  end

  defp process_next_event_internal(state) do
    case :queue.out(state.event_queue) do
      {{:value, item}, new_queue} ->
        state = %{state | event_queue: new_queue}

        case item.type do
          :control ->
            handle_control_command(state, item.command)

          :event ->
            if state.queue_state == :playing do
              process_event(state, item)
            else
              # Queue is paused, put event back
              new_queue = :queue.in_r(item, state.event_queue)
              state = %{state | event_queue: new_queue}
              {:paused, state}
            end
        end

      {:empty, _} ->
        {:empty_queue, state}
    end
  end

  defp handle_control_command(state, command) do
    case command do
      :pause ->
        state = %{state | queue_state: :paused}

        Logger.info("AlertQueue control: PAUSE", %{
          user_id: state.user_id,
          queue_length: :queue.len(state.event_queue)
        })

        broadcast_queue_update(state)
        {:paused, state}

      :resume ->
        state = %{state | queue_state: :playing}

        Logger.info("AlertQueue control: RESUME", %{
          user_id: state.user_id,
          queue_length: :queue.len(state.event_queue)
        })

        broadcast_queue_update(state)
        {:resumed, state}

      :skip ->
        # Skip the next event (if any)
        case :queue.out(state.event_queue) do
          {{:value, skipped_item}, new_queue} ->
            state = %{state | event_queue: new_queue}
            add_to_history(state, skipped_item, :skipped)

            Logger.info("AlertQueue control: SKIP", %{
              user_id: state.user_id,
              skipped_event_id: skipped_item.id,
              skipped_event_type: skipped_item.event.type,
              queue_length_after: :queue.len(new_queue)
            })

            broadcast_queue_update(state)
            {:skipped, state}

          {:empty, _} ->
            Logger.info("AlertQueue control: SKIP (nothing to skip)", %{
              user_id: state.user_id
            })

            {:nothing_to_skip, state}
        end

      :clear ->
        # Remove all non-control events
        queue_list = :queue.to_list(state.event_queue)
        control_events = Enum.filter(queue_list, fn item -> item.type == :control end)

        new_queue =
          Enum.reduce(control_events, :queue.new(), fn item, acc ->
            :queue.in(item, acc)
          end)

        cleared_count = length(queue_list) - length(control_events)
        state = %{state | event_queue: new_queue}

        Logger.info("AlertQueue control: CLEAR", %{
          user_id: state.user_id,
          cleared_count: cleared_count,
          remaining_count: length(control_events)
        })

        broadcast_queue_update(state)
        {:cleared, state}
    end
  end

  defp process_event(state, item) do
    # Log the event processing with details
    Logger.info("AlertQueue processing event for user #{state.user_id}", %{
      event_id: item.id,
      event_type: item.event.type,
      priority: item.priority,
      username: Map.get(item.event, :username, "unknown"),
      queue_length_after: :queue.len(state.event_queue)
    })

    # Broadcast the event to alertbox subscribers
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "alertbox:#{state.user_id}",
      {:alert_event, item.event}
    )

    # Get display time for this event (use event's display_time or default to 8)
    display_time = Map.get(item.event, :display_time, 10)

    # Add to history and update last processed time + display time
    state =
      state
      |> add_to_history(item, :processed)
      |> Map.put(:last_processed_at, DateTime.utc_now())
      |> Map.put(:last_event_display_time, display_time)

    # Log successful processing
    Logger.debug("Successfully processed alert event", %{
      user_id: state.user_id,
      event_id: item.id,
      event_type: item.event.type
    })

    broadcast_queue_update(state)

    {:processed, state}
  end

  defp add_to_history(state, item, status) do
    history_entry = %{
      id: item.id,
      event: item.event,
      status: status,
      processed_at: DateTime.utc_now()
    }

    # Keep last 50 entries
    new_history = [history_entry | state.event_history] |> Enum.take(50)

    %{state | event_history: new_history}
  end

  defp schedule_next_processing(state) do
    if state.processing_timer do
      Process.cancel_timer(state.processing_timer)
    end

    # Calculate delay based on last processed time to ensure minimum spacing
    delay = calculate_processing_delay(state)

    Logger.debug("AlertQueue scheduling next processing", %{
      user_id: state.user_id,
      delay: delay,
      queue_length: :queue.len(state.event_queue),
      last_processed_at: state.last_processed_at,
      last_event_display_time: state.last_event_display_time
    })

    timer = Process.send_after(self(), :process_next_event, delay)
    %{state | processing_timer: timer}
  end

  defp calculate_processing_delay(state) do
    case state.last_processed_at do
      nil ->
        # No previous event, process immediately if queue has items
        if :queue.len(state.event_queue) > 0, do: 100, else: state.processing_interval

      last_processed ->
        # Use the last processed event's display_time to determine when next event can start
        # Default to 8 seconds
        last_display_time = state.last_event_display_time || 8
        # Add 3 second buffer, convert to ms
        required_delay = (last_display_time + 3) * 1000

        time_since_last = DateTime.diff(DateTime.utc_now(), last_processed, :millisecond)

        if time_since_last >= required_delay do
          # Enough time has passed based on last event's display time, process soon
          100
        else
          # Not enough time, wait for the remaining delay
          remaining_delay = required_delay - time_since_last
          # At least 100ms delay
          max(remaining_delay, 100)
        end
    end
  end

  defp broadcast_queue_update(state) do
    queue_length = :queue.len(state.event_queue)

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "alertqueue:#{state.user_id}",
      {:queue_update,
       %{
         queue_state: state.queue_state,
         queue_length: queue_length,
         timestamp: DateTime.utc_now()
       }}
    )
  end

  defp add_event_to_queue(state, event) do
    priority = determine_event_priority(event)

    prioritized_event = %{
      id: generate_event_id(),
      priority: priority,
      event: event,
      timestamp: DateTime.utc_now(),
      type: :event
    }

    add_to_queue(state, prioritized_event)
  end

  defp generate_event_id do
    "alert_#{:crypto.strong_rand_bytes(8) |> Base.encode64() |> String.slice(0, 12)}"
  end
end
