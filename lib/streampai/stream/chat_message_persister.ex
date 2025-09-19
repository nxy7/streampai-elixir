defmodule Streampai.Stream.ChatMessagePersister do
  @moduledoc """
  Persists chat messages from all platforms to the database in efficient batches.

  This process collects chat messages from various streaming platforms and
  periodically saves them to the database using bulk operations for optimal
  database performance and reduced load.
  """
  use GenServer

  alias Streampai.Stream.ChatMessage

  require Logger

  @batch_size 100
  @flush_interval 3_000

  defstruct [
    :messages,
    :last_flush,
    :flush_timer
  ]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, Keyword.put_new(opts, :name, __MODULE__))
  end

  @impl true
  def init(:ok) do
    state = %__MODULE__{
      messages: [],
      last_flush: :os.system_time(:millisecond),
      flush_timer: schedule_flush()
    }

    Logger.info("ChatMessagePersister started")
    {:ok, state}
  end

  @doc """
  Adds a chat message to the batch queue.

  ## Parameters
  - `message_data`: Map containing chat message fields

  ## Example
      ChatMessagePersister.add_message(%{
        id: "twitch_msg_123456",
        message: "Hello, world!",
        sender_username: "user123",
        sender_platform: :twitch,
        sender_channel_id: "channel_123",
        user_id: "user_uuid",
        livestream_id: "stream_uuid",
        sender_is_moderator: false,
        sender_is_patreon: false
      })
  """
  def add_message(message_data) do
    GenServer.cast(__MODULE__, {:add_message, message_data})
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
    chat_message = struct(ChatMessage, message_data)
    new_messages = [chat_message | state.messages]

    if length(new_messages) >= @batch_size do
      {_result, new_state} = do_flush(state, new_messages, "batch size reached")
      {:noreply, new_state}
    else
      {:noreply, %{state | messages: new_messages}}
    end
  end

  @impl true
  def handle_call(:flush_now, _from, state) do
    if length(state.messages) > 0 do
      {result, new_state} = do_flush(state, state.messages, "manual")
      {:reply, result, new_state}
    else
      {:reply, {:ok, []}, state}
    end
  end

  @impl true
  def handle_call(:get_stats, _from, state) do
    stats = %{
      pending_messages: length(state.messages),
      last_flush: state.last_flush,
      uptime: :os.system_time(:millisecond) - state.last_flush
    }

    {:reply, stats, state}
  end

  @impl true
  def handle_info(:flush_timer, state) do
    new_state =
      if length(state.messages) > 0 do
        {_result, updated_state} = do_flush(state, state.messages, "timer")
        updated_state
      else
        state
      end

    new_timer = schedule_flush()
    {:noreply, %{new_state | flush_timer: new_timer}}
  end

  @impl true
  def terminate(_reason, state) do
    if length(state.messages) > 0 do
      Logger.info("Flushing #{length(state.messages)} messages before shutdown")
      flush_messages(state.messages)
    end

    :ok
  end

  defp do_flush(state, messages, flush_type) do
    case flush_messages(messages) do
      {:ok, result} ->
        Logger.debug("#{String.capitalize(flush_type)} flush completed: #{length(messages)} messages")

        new_state = %{
          state
          | messages: [],
            last_flush: :os.system_time(:millisecond)
        }

        {{:ok, result}, new_state}

      {:error, reason} ->
        Logger.error("#{String.capitalize(flush_type)} flush failed: #{inspect(reason)}")
        {{:error, reason}, %{state | messages: messages}}
    end
  end

  defp flush_messages([]), do: {:ok, []}

  defp flush_messages(messages) do
    message_attrs = Enum.map(messages, &struct_to_attrs/1)
    result = Ash.bulk_create(message_attrs, ChatMessage, :create_batch)

    case result do
      %Ash.BulkResult{status: :success} -> {:ok, length(messages)}
      %Ash.BulkResult{status: :error, errors: errors} -> {:error, errors}
      error -> {:error, error}
    end
  rescue
    e -> {:error, e}
  end

  defp struct_to_attrs(%ChatMessage{} = message) do
    %{
      id: message.id,
      message: message.message,
      sender_username: message.sender_username,
      sender_platform: message.sender_platform,
      sender_channel_id: message.sender_channel_id,
      sender_is_moderator: message.sender_is_moderator,
      sender_is_patreon: message.sender_is_patreon,
      user_id: message.user_id,
      livestream_id: message.livestream_id
    }
  end

  defp schedule_flush do
    Process.send_after(self(), :flush_timer, @flush_interval)
  end
end
