defmodule Streampai.Stream.EventPersister do
  @moduledoc """
  Persists chat messages and stream events from all platforms to the database in efficient batches.

  This process collects chat messages and events (donations, subscriptions, etc.) from various
  streaming platforms and periodically saves them to the database using bulk operations for
  optimal database performance and reduced load.
  """
  use GenServer

  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamViewer

  require Logger

  @batch_size 100
  @flush_interval 50
  @sent_message_ttl_ms 30_000
  @sent_message_ids_table :event_persister_sent_message_ids

  defstruct [
    :chat_messages,
    :stream_events,
    :author_details,
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
      author_details: %{},
      last_flush: :os.system_time(:millisecond),
      flush_timer: schedule_flush()
    }

    ensure_sent_message_ids_table()
    Logger.info("EventPersister started")
    {:ok, state}
  end

  @doc """
  Registers a platform message ID for a message sent by the streamer
  through Streampai, so the platform echo can be identified and skipped.
  """
  def register_sent_message_id(user_id, platform_message_id) when is_binary(user_id) and is_binary(platform_message_id) do
    ensure_sent_message_ids_table()
    now = :os.system_time(:millisecond)
    :ets.insert(@sent_message_ids_table, {{user_id, platform_message_id}, now})
    :ok
  end

  @doc """
  Adds a chat message to the batch queue.

  ## Parameters
  - `message_data`: Tuple of {message_attrs, author_attrs} or legacy map
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
  def handle_cast({:add_message, {message_attrs, author_attrs}}, state) do
    if echo_message?(message_attrs) do
      Logger.debug("Skipping echo message from #{message_attrs.sender_username} on #{message_attrs.platform}")

      {:noreply, state}
    else
      new_messages = [message_attrs | state.chat_messages]

      author_key = {author_attrs.viewer_id, author_attrs.user_id}
      new_author_details = Map.put(state.author_details, author_key, author_attrs)

      maybe_flush_on_batch_size(
        %{state | author_details: new_author_details},
        new_messages,
        state.stream_events,
        :messages
      )
    end
  end

  @impl true
  def handle_cast({:add_event, event_data}, state) do
    new_events = [struct(StreamEvent, event_data) | state.stream_events]

    maybe_flush_on_batch_size(state, state.chat_messages, new_events, :events)
  end

  defp maybe_flush_on_batch_size(state, messages, events, type) do
    count = if type == :messages, do: length(messages), else: length(events)
    should_flush = count >= @batch_size

    if should_flush do
      {_result, new_state} =
        do_flush(%{state | chat_messages: messages, stream_events: events}, "batch size reached")

      {:noreply, new_state}
    else
      {:noreply, %{state | chat_messages: messages, stream_events: events}}
    end
  end

  @impl true
  def handle_call(:flush_now, _from, state) do
    if has_pending_items?(state) do
      {result, new_state} = do_flush(state, "manual")
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
    state.chat_messages != [] or state.stream_events != []
  end

  @impl true
  def handle_info(:flush_timer, state) do
    new_state =
      if has_pending_items?(state) do
        {_result, updated_state} = do_flush(state, "timer")
        updated_state
      else
        state
      end

    purge_expired_sent_messages()
    {:noreply, %{new_state | flush_timer: schedule_flush()}}
  end

  @impl true
  def terminate(_reason, state) do
    if has_pending_items?(state) do
      Logger.info(
        "Flushing pending items before shutdown: #{length(state.chat_messages)} messages, #{length(state.stream_events)} events"
      )

      upsert_viewers_from_author_details(state.author_details)

      if !Enum.empty?(state.chat_messages) do
        chat_events = Enum.map(state.chat_messages, &message_to_stream_event/1)
        bulk_upsert(chat_events, StreamEvent, &event_to_attrs/1)
      end

      if !Enum.empty?(state.stream_events) do
        bulk_upsert(state.stream_events, StreamEvent, &event_to_attrs/1)
      end
    end

    :ok
  end

  defp do_flush(state, flush_type) do
    message_result =
      flush_if_present(state.chat_messages, state.author_details, &flush_messages/2)

    event_result = flush_if_present(state.stream_events, &flush_stream_events/1)

    handle_flush_results(state, message_result, event_result, flush_type)
  end

  defp flush_if_present([], _author_details, _flush_fn), do: {:ok, 0}
  defp flush_if_present(items, author_details, flush_fn), do: flush_fn.(items, author_details)

  defp flush_if_present([], _flush_fn), do: {:ok, 0}
  defp flush_if_present(items, flush_fn), do: flush_fn.(items)

  defp handle_flush_results(state, {:ok, msg_count}, {:ok, event_count}, flush_type) do
    total = msg_count + event_count

    Logger.debug("#{String.capitalize(flush_type)} flush completed: #{msg_count} messages, #{event_count} events")

    new_state = %{
      state
      | chat_messages: [],
        stream_events: [],
        author_details: %{},
        last_flush: :os.system_time(:millisecond)
    }

    {{:ok, total}, new_state}
  end

  defp handle_flush_results(state, {:error, reason}, _, flush_type) do
    Logger.error("#{String.capitalize(flush_type)} flush failed (messages): #{inspect(reason)}")
    {{:error, reason}, %{state | stream_events: []}}
  end

  defp handle_flush_results(state, _, {:error, reason}, flush_type) do
    Logger.error("#{String.capitalize(flush_type)} flush failed (events): #{inspect(reason)}")
    {{:error, reason}, %{state | chat_messages: [], author_details: %{}}}
  end

  defp flush_messages(messages, author_details) do
    upsert_viewers_from_author_details(author_details)

    chat_events = Enum.map(messages, &message_to_stream_event/1)
    bulk_upsert(chat_events, StreamEvent, &event_to_attrs/1)
  end

  defp upsert_viewers_from_author_details(author_details) do
    result =
      author_details
      |> Map.values()
      |> Ash.bulk_create(StreamViewer, :upsert, return_errors?: true)

    if result.status == :error do
      Logger.error("Failed to upsert viewers: #{inspect(result.errors)}")
    end

    result
  end

  defp flush_stream_events(events) do
    bulk_upsert(events, StreamEvent, &event_to_attrs/1)
  end

  defp bulk_upsert(items, resource, attrs_fn) do
    item_attrs = Enum.map(items, attrs_fn)

    item_attrs
    |> Ash.bulk_create(resource, :upsert, return_errors?: true)
    |> handle_bulk_result(length(items))
  rescue
    e -> {:error, e}
  end

  defp handle_bulk_result(%Ash.BulkResult{status: :success}, count), do: {:ok, count}

  defp handle_bulk_result(%Ash.BulkResult{status: :error, errors: errors}, _count), do: {:error, errors}

  defp handle_bulk_result(error, _count), do: {:error, error}

  defp message_to_stream_event(msg) when is_map(msg) do
    # Use UUID v5 to derive a deterministic StreamEvent ID from the chat message ID
    event_id = deterministic_uuid("chat_message:#{msg.id}")

    struct(StreamEvent, %{
      id: event_id,
      type: :chat_message,
      data: %{
        "type" => "chat_message",
        "message" => msg.message,
        "username" => msg.sender_username,
        "sender_channel_id" => msg.sender_channel_id,
        "is_moderator" => msg.sender_is_moderator,
        "is_patreon" => msg.sender_is_patreon,
        "is_sent_by_streamer" => false
      },
      author_id: msg.sender_channel_id || "unknown",
      platform: msg.platform,
      user_id: msg.user_id,
      livestream_id: msg.livestream_id,
      viewer_id: Map.get(msg, :viewer_id) || msg.sender_channel_id,
      inserted_at: parse_platform_timestamp(msg[:platform_timestamp])
    })
  end

  defp parse_platform_timestamp(nil), do: DateTime.utc_now()

  defp parse_platform_timestamp(%DateTime{} = dt), do: dt

  defp parse_platform_timestamp(ts) when is_binary(ts) do
    case DateTime.from_iso8601(ts) do
      {:ok, dt, _offset} -> dt
      _ -> DateTime.utc_now()
    end
  end

  defp parse_platform_timestamp(_), do: DateTime.utc_now()

  defp event_to_attrs(%StreamEvent{} = event) do
    %{
      id: event.id,
      type: event.type,
      data: event.data,
      author_id: event.author_id,
      platform: event.platform,
      user_id: event.user_id,
      livestream_id: event.livestream_id,
      viewer_id: event.viewer_id,
      inserted_at: event.inserted_at
    }
  end

  defp schedule_flush do
    Process.send_after(self(), :flush_timer, @flush_interval)
  end

  # Echo detection: check if the incoming message's platform ID was registered as sent by us
  defp echo_message?(msg) do
    id = to_string(msg.id)
    user_id = msg.user_id
    key = {user_id, id}

    case :ets.lookup(@sent_message_ids_table, key) do
      [{^key, _timestamp}] ->
        :ets.delete(@sent_message_ids_table, key)
        true

      [] ->
        false
    end
  end

  defp purge_expired_sent_messages do
    now = :os.system_time(:millisecond)

    :ets.select_delete(@sent_message_ids_table, [
      {{:_, :"$1"}, [{:<, :"$1", now - @sent_message_ttl_ms}], [true]}
    ])
  end

  defp ensure_sent_message_ids_table do
    case :ets.whereis(@sent_message_ids_table) do
      :undefined -> :ets.new(@sent_message_ids_table, [:set, :public, :named_table])
      _ref -> @sent_message_ids_table
    end
  end

  # UUID v5 (SHA-1, URL namespace) — deterministic UUID from a string.
  # Replaces the `uuid` hex package's UUID.uuid5/2.
  @uuid_url_namespace <<0x6B, 0xA7, 0xB8, 0x10, 0x9D, 0xAD, 0x11, 0xD1, 0x80, 0xB4, 0x00, 0xC0, 0x4F, 0xD4, 0x30, 0xC8>>

  defp deterministic_uuid(name) do
    <<u0::48, _::4, u1::12, _::2, u2::62>> =
      :sha
      |> :crypto.hash(@uuid_url_namespace <> name)
      |> binary_part(0, 16)

    <<u0::48, 5::4, u1::12, 2::2, u2::62>>
    |> Base.encode16(case: :lower)
    |> then(fn hex ->
      <<a::binary-8, b::binary-4, c::binary-4, d::binary-4, e::binary-12>> = hex
      "#{a}-#{b}-#{c}-#{d}-#{e}"
    end)
  end
end
