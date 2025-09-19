defmodule Streampai.Stream.ChatMessageBatcher do
  @moduledoc """
  Batches chat messages from all platforms and saves them to the database in bulk.

  This process collects chat messages from various streaming platforms and
  periodically saves them to the database using bulk operations for performance.
  """
  use GenServer

  require Logger

  alias Streampai.Stream.ChatMessage

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

    Logger.info("ChatMessageBatcher started")
    {:ok, state}
  end

  # Client API

  @doc """
  Adds a chat message to the batch queue.

  ## Parameters
  - `message_data`: Map containing chat message fields

  ## Example
      ChatMessageBatcher.add_message(%{
        message: "Hello, world!",
        username: "user123",
        platform: :twitch,
        channel_id: "channel_123",
        user_id: "user_uuid",
        livestream_id: "stream_uuid",
        is_moderator: false,
        is_patreon: false
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

  # Server callbacks

  @impl true
  def handle_cast({:add_message, message_data}, state) do
    chat_message = struct(ChatMessage, message_data)
    new_messages = [chat_message | state.messages]

    if length(new_messages) >= @batch_size do
      case flush_messages(new_messages) do
        {:ok, _result} ->
          Logger.debug("Flushed #{length(new_messages)} messages (batch size reached)")

          new_state = %{
            state |
            messages: [],
            last_flush: :os.system_time(:millisecond)
          }
          {:noreply, new_state}

        {:error, reason} ->
          Logger.error("Failed to flush messages: #{inspect(reason)}")
          {:noreply, %{state | messages: new_messages}}
      end
    else
      {:noreply, %{state | messages: new_messages}}
    end
  end

  @impl true
  def handle_call(:flush_now, _from, state) do
    if length(state.messages) > 0 do
      case flush_messages(state.messages) do
        {:ok, result} ->
          Logger.info("Manual flush completed: #{length(state.messages)} messages")

          new_state = %{
            state |
            messages: [],
            last_flush: :os.system_time(:millisecond)
          }
          {:reply, {:ok, result}, new_state}

        {:error, reason} ->
          Logger.error("Manual flush failed: #{inspect(reason)}")
          {:reply, {:error, reason}, state}
      end
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
        case flush_messages(state.messages) do
          {:ok, _result} ->
            Logger.debug("Timer flush completed: #{length(state.messages)} messages")

            %{
              state |
              messages: [],
              last_flush: :os.system_time(:millisecond)
            }

          {:error, reason} ->
            Logger.error("Timer flush failed: #{inspect(reason)}")
            state
        end
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

  # Private functions

  defp flush_messages([]), do: {:ok, []}

  defp flush_messages(messages) do
    try do
      # Convert struct messages to attribute maps for bulk creation
      message_attrs = Enum.map(messages, &struct_to_attrs/1)

      # Use Ash bulk create for efficient insertion
      result =
        ChatMessage
        |> Ash.Changeset.for_create(:create_batch, %{messages: message_attrs})
        |> Ash.create()

      case result do
        {:ok, _} -> {:ok, length(messages)}
        {:error, reason} -> {:error, reason}
      end
    rescue
      e -> {:error, e}
    end
  end

  defp struct_to_attrs(%ChatMessage{} = message) do
    message
    |> Map.from_struct()
    |> Map.drop([:__meta__])
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  defp schedule_flush do
    Process.send_after(self(), :flush_timer, @flush_interval)
  end
end