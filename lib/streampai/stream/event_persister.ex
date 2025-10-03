defmodule Streampai.Stream.EventPersister do
  @moduledoc """
  Persists chat messages and stream events from all platforms to the database in efficient batches.

  This process collects chat messages and events (donations, subscriptions, etc.) from various
  streaming platforms and periodically saves them to the database using bulk operations for
  optimal database performance and reduced load.
  """
  use GenServer

  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.StreamEvent

  require Logger

  @batch_size 100
  @flush_interval 3_000

  defstruct [
    :chat_messages,
    :stream_events,
    :last_flush,
    :flush_timer
  ]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, Keyword.put_new(opts, :name, __MODULE__))
  end

  @impl true
  def init(:ok) do
    state = %__MODULE__{
      chat_messages: [],
      stream_events: [],
      last_flush: :os.system_time(:millisecond),
      flush_timer: schedule_flush()
    }

    Logger.info("EventPersister started")
    {:ok, state}
  end

  @doc """
  Adds a chat message to the batch queue.

  ## Parameters
  - `message_data`: Map containing chat message fields
  """
  def add_message(message_data) do
    GenServer.cast(__MODULE__, {:add_message, message_data})
  end

  @doc """
  Adds a stream event to the batch queue.

  ## Parameters
  - `event_data`: Map containing stream event fields (donations, subscriptions, etc.)
  """
  def add_event(event_data) do
    GenServer.cast(__MODULE__, {:add_event, event_data})
  end

  @doc """
  Forces an immediate flush of all pending messages.
  """
  def flush_now do
    GenServer.call(__MODULE__, :flush_now)
  end

  @doc """
  Gets current batch statistics.
  """
  def get_stats do
    GenServer.call(__MODULE__, :get_stats)
  end

  @impl true
  def handle_cast({:add_message, message_data}, state) do
    new_messages = [struct(ChatMessage, message_data) | state.chat_messages]

    maybe_flush_on_batch_size(state, new_messages, state.stream_events, :messages)
  end

  @impl true
  def handle_cast({:add_event, event_data}, state) do
    new_events = [struct(StreamEvent, event_data) | state.stream_events]

    maybe_flush_on_batch_size(state, state.chat_messages, new_events, :events)
  end

  defp maybe_flush_on_batch_size(state, messages, events, type) do
    should_flush =
      (type == :messages and length(messages) >= @batch_size) or
        (type == :events and length(events) >= @batch_size)

    if should_flush do
      {_result, new_state} = do_flush(state, messages, events, "batch size reached")
      {:noreply, new_state}
    else
      {:noreply, %{state | chat_messages: messages, stream_events: events}}
    end
  end

  @impl true
  def handle_call(:flush_now, _from, state) do
    if has_pending_items?(state) do
      {result, new_state} = do_flush(state, state.chat_messages, state.stream_events, "manual")
      {:reply, result, new_state}
    else
      {:reply, {:ok, []}, state}
    end
  end

  @impl true
  def handle_call(:get_stats, _from, state) do
    stats = %{
      pending_messages: length(state.chat_messages),
      pending_events: length(state.stream_events),
      last_flush: state.last_flush,
      uptime: :os.system_time(:millisecond) - state.last_flush
    }

    {:reply, stats, state}
  end

  defp has_pending_items?(state) do
    length(state.chat_messages) > 0 or length(state.stream_events) > 0
  end

  @impl true
  def handle_info(:flush_timer, state) do
    new_state =
      if has_pending_items?(state) do
        {_result, updated_state} =
          do_flush(state, state.chat_messages, state.stream_events, "timer")

        updated_state
      else
        state
      end

    {:noreply, %{new_state | flush_timer: schedule_flush()}}
  end

  @impl true
  def terminate(_reason, state) do
    flush_on_shutdown(state.chat_messages, &flush_messages/1, "chat messages")
    flush_on_shutdown(state.stream_events, &flush_stream_events/1, "stream events")
    :ok
  end

  defp flush_on_shutdown([], _flush_fn, _type), do: :ok

  defp flush_on_shutdown(items, flush_fn, type) do
    Logger.info("Flushing #{length(items)} #{type} before shutdown")
    flush_fn.(items)
  end

  defp do_flush(state, messages, events, flush_type) do
    message_result = flush_if_present(messages, &flush_messages/1)
    event_result = flush_if_present(events, &flush_stream_events/1)

    handle_flush_results(state, messages, events, message_result, event_result, flush_type)
  end

  defp flush_if_present([], _flush_fn), do: {:ok, 0}
  defp flush_if_present(items, flush_fn), do: flush_fn.(items)

  defp handle_flush_results(state, _messages, _events, {:ok, msg_count}, {:ok, event_count}, flush_type) do
    total = msg_count + event_count

    Logger.debug("#{String.capitalize(flush_type)} flush completed: #{msg_count} messages, #{event_count} events")

    new_state = %{
      state
      | chat_messages: [],
        stream_events: [],
        last_flush: :os.system_time(:millisecond)
    }

    {{:ok, total}, new_state}
  end

  defp handle_flush_results(state, messages, _events, {:error, reason}, _, flush_type) do
    Logger.error("#{String.capitalize(flush_type)} flush failed (messages): #{inspect(reason)}")
    {{:error, reason}, %{state | chat_messages: messages, stream_events: []}}
  end

  defp handle_flush_results(state, _messages, events, _, {:error, reason}, flush_type) do
    Logger.error("#{String.capitalize(flush_type)} flush failed (events): #{inspect(reason)}")
    {{:error, reason}, %{state | chat_messages: [], stream_events: events}}
  end

  defp flush_messages(messages) do
    bulk_upsert(messages, ChatMessage, &message_to_attrs/1)
  end

  defp flush_stream_events(events) do
    bulk_upsert(events, StreamEvent, &event_to_attrs/1)
  end

  defp bulk_upsert(items, resource, attrs_fn) do
    item_attrs = Enum.map(items, attrs_fn)

    item_attrs
    |> Ash.bulk_create(resource, :upsert)
    |> handle_bulk_result(length(items))
  rescue
    e -> {:error, e}
  end

  defp handle_bulk_result(%Ash.BulkResult{status: :success}, count), do: {:ok, count}

  defp handle_bulk_result(%Ash.BulkResult{status: :error, errors: errors}, _count), do: {:error, errors}

  defp handle_bulk_result(error, _count), do: {:error, error}

  defp message_to_attrs(%ChatMessage{} = message) do
    %{
      id: message.id,
      message: message.message,
      sender_username: message.sender_username,
      platform: message.platform,
      sender_channel_id: message.sender_channel_id,
      sender_is_moderator: message.sender_is_moderator,
      sender_is_patreon: message.sender_is_patreon,
      user_id: message.user_id,
      livestream_id: message.livestream_id
    }
  end

  defp event_to_attrs(%StreamEvent{} = event) do
    %{
      id: event.id,
      type: event.type,
      data: event.data,
      data_raw: event.data_raw,
      author_id: event.author_id,
      platform: event.platform,
      user_id: event.user_id,
      livestream_id: event.livestream_id,
      viewer_id: event.viewer_id
    }
  end

  defp schedule_flush do
    Process.send_after(self(), :flush_timer, @flush_interval)
  end
end
