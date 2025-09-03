defmodule Streampai.LivestreamManager.EventBroadcaster do
  @moduledoc """
  Central event broadcasting system for livestream events.
  Receives events from platform managers and broadcasts them to interested parties
  (alertbox, dashboard, analytics, etc.).
  """
  use GenServer
  require Logger

  @event_types [
    :donation,
    :follow,
    :subscription,
    :raid,
    :chat_message,
    :viewer_count_update,
    :stream_start,
    :stream_end
  ]

  defstruct [
    :event_history,    # Recent events for replay/debugging
    :event_counters    # Counters for different event types
  ]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, Keyword.put_new(opts, :name, __MODULE__))
  end

  @impl true
  def init(:ok) do
    state = %__MODULE__{
      event_history: :queue.new(),
      event_counters: Map.new(@event_types, &{&1, 0})
    }
    
    Logger.info("EventBroadcaster started")
    {:ok, state}
  end

  # Client API

  @doc """
  Broadcasts a livestream event to all subscribers.
  """
  def broadcast_event(event) do
    GenServer.cast(__MODULE__, {:broadcast_event, event})
  end

  @doc """
  Gets recent event history for debugging or replay.
  """
  def get_event_history(limit \\ 100) do
    GenServer.call(__MODULE__, {:get_event_history, limit})
  end

  @doc """
  Gets event counters/statistics.
  """
  def get_event_stats do
    GenServer.call(__MODULE__, :get_event_stats)
  end

  # Server callbacks

  @impl true
  def handle_cast({:broadcast_event, event}, state) do
    # Validate event structure
    case validate_event(event) do
      :ok ->
        # Add timestamp if not present
        event = Map.put_new(event, :timestamp, DateTime.utc_now())
        
        # Update state
        state = state
        |> add_to_history(event)
        |> increment_counter(event.type)
        
        # Broadcast to different channels based on event type
        broadcast_to_channels(event)
        
        {:noreply, state}

      {:error, reason} ->
        Logger.warning("Invalid event rejected: #{inspect(reason)}, event: #{inspect(event)}")
        {:noreply, state}
    end
  end

  @impl true
  def handle_call({:get_event_history, limit}, _from, state) do
    history = state.event_history
    |> :queue.to_list()
    |> Enum.take(-limit)
    |> Enum.reverse()
    
    {:reply, history, state}
  end

  @impl true
  def handle_call(:get_event_stats, _from, state) do
    stats = %{
      event_counters: state.event_counters,
      history_size: :queue.len(state.event_history),
      uptime: :erlang.statistics(:wall_clock) |> elem(0)
    }
    
    {:reply, stats, state}
  end

  # Helper functions

  defp validate_event(%{type: type, user_id: user_id} = event) 
    when type in @event_types and is_binary(user_id) do
    
    case type do
      :donation ->
        if Map.has_key?(event, :amount) and Map.has_key?(event, :currency), do: :ok, else: {:error, :missing_amount_or_currency}
      
      :follow ->
        if Map.has_key?(event, :username), do: :ok, else: {:error, :missing_username}
      
      :subscription ->
        if Map.has_key?(event, :username) and Map.has_key?(event, :tier), do: :ok, else: {:error, :missing_subscription_data}
      
      :raid ->
        if Map.has_key?(event, :username) and Map.has_key?(event, :viewer_count), do: :ok, else: {:error, :missing_raid_data}
      
      :chat_message ->
        if Map.has_key?(event, :username) and Map.has_key?(event, :message), do: :ok, else: {:error, :missing_chat_data}
      
      :viewer_count_update ->
        if Map.has_key?(event, :count), do: :ok, else: {:error, :missing_count}
      
      _ ->
        :ok
    end
  end

  defp validate_event(_event), do: {:error, :invalid_structure}

  defp add_to_history(state, event) do
    # Keep last 1000 events in memory
    max_history = 1000
    history = :queue.in(event, state.event_history)
    
    history = if :queue.len(history) > max_history do
      :queue.drop(history)
    else
      history
    end
    
    %{state | event_history: history}
  end

  defp increment_counter(state, event_type) do
    counters = Map.update(state.event_counters, event_type, 1, &(&1 + 1))
    %{state | event_counters: counters}
  end

  defp broadcast_to_channels(event) do
    user_id = event.user_id
    
    # Broadcast to user-specific channels
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "user_stream:#{user_id}:events",
      {:stream_event, event}
    )
    
    # Broadcast to alertbox (for donation/follow/sub/raid events)
    if event.type in [:donation, :follow, :subscription, :raid] do
      # Add display_time based on event type
      display_time = get_display_time(event.type)
      alertbox_event = Map.put(event, :display_time, display_time)
      
      Phoenix.PubSub.broadcast(
        Streampai.PubSub,
        "widget_events:#{user_id}:alertbox",
        {:widget_event, alertbox_event}
      )
    end
    
    # Broadcast to dashboard for real-time updates
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "dashboard:#{user_id}:stream",
      {:dashboard_event, event}
    )
    
    # Broadcast to system-wide event stream (for analytics)
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "livestream_events",
      {:global_stream_event, event}
    )
  end

  defp get_display_time(:donation), do: 8
  defp get_display_time(:follow), do: 5
  defp get_display_time(:subscription), do: 7
  defp get_display_time(:raid), do: 10
  defp get_display_time(_), do: 5
end