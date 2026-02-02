defmodule Streampai.LivestreamManager.ChatBotServer do
  @moduledoc """
  GenServer that provides chat bot functionality during a livestream.

  Started when a stream goes live, stopped when it ends. Subscribes to
  database changes via `Phoenix.Sync.Shape` for:

  1. **`chat_bot_configs`** — reacts to setting changes in real time
  2. **`stream_events`** — watches for new chat messages to handle commands

  ## Commands

  - `!hi` — replies with a random greeting
  - `!uptime` — shows how long the stream has been live
  - `!followage` — shows follow tracking info (coming soon)
  - `!socials` — links to streamer's socials
  - `!lurk` — announces the user is lurking
  - `!dice` — rolls a random number 1–6
  - `!quote` — shares a random quote
  - `!commands` — lists all available commands

  Also supports greeting on stream start (when `greeting_enabled` is true)
  and AI chat participation (when `ai_chat_enabled` is true).
  """
  use GenServer

  import Ecto.Query

  alias Phoenix.Sync.Shape
  alias Streampai.AiChat.Handler, as: AiHandler
  alias Streampai.AiChat.ProviderRegistry
  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Stream.ChatBotConfig

  require Logger

  @hello_messages [
    "Hello! 👋",
    "Hey there! 😄",
    "Hi! Welcome!",
    "What's up! 🎉",
    "Howdy! 🤠",
    "Hey hey! 👋",
    "Yo! What's good! 😎"
  ]

  @quotes [
    "Believe you can and you're halfway there. ✨",
    "The only way to do great work is to love what you do. 💪",
    "Stay hungry, stay foolish. 🚀",
    "GG goes a long way. Be kind in chat! 💜",
    "Every stream is a chance to make someone's day better. 🌟",
    "You miss 100% of the shots you don't take. 🎯",
    "Keep grinding, the results will come! 🔥"
  ]

  @command_names ~w(hi uptime followage socials lurk dice quote commands)

  # AI Chat constants
  @ai_eval_interval 2_500
  @ai_cooldown_ms 10_000
  @ai_context_size 10

  defstruct [
    :user_id,
    :stream_started_at,
    :config_shape_pid,
    :config_shape_ref,
    :events_shape_pid,
    :events_shape_ref,
    :ai_eval_timer,
    config: %{
      enabled: true,
      greeting_enabled: false,
      greeting_message: "Hello everyone! Welcome to the stream!",
      command_prefix: "!",
      ai_chat_enabled: false,
      ai_personality: nil,
      ai_bot_name: "Streampai",
      ai_provider: "openai"
    },
    ai_message_buffer: [],
    ai_pending_count: 0,
    ai_last_response_at: 0,
    ai_cooldown_batch_count: 0
  ]

  # ── Client API ──────────────────────────────────────────────────

  def start_link({user_id, stream_started_at}) do
    GenServer.start_link(
      __MODULE__,
      {user_id, stream_started_at},
      name: RegistryHelpers.via_tuple(:chat_bot_server, user_id)
    )
  end

  def child_spec({user_id, _stream_started_at} = args) do
    %{
      id: {:chat_bot_server, user_id},
      start: {__MODULE__, :start_link, [args]},
      restart: :transient,
      type: :worker
    }
  end

  # ── GenServer callbacks ─────────────────────────────────────────

  @impl true
  def init({user_id, stream_started_at}) do
    Logger.metadata(component: :chat_bot_server, user_id: user_id)
    Logger.info("[ChatBotServer] started for user #{user_id}")

    state = %__MODULE__{
      user_id: user_id,
      stream_started_at: stream_started_at
    }

    state = load_initial_config(state)
    state = start_config_shape(state)
    state = start_events_shape(state)

    # Send greeting if enabled (delayed to let platforms settle)
    if state.config.greeting_enabled do
      Process.send_after(self(), :send_greeting, 3_000)
    end

    # Start AI evaluation timer if AI chat is enabled
    state =
      if state.config.ai_chat_enabled do
        %{state | ai_eval_timer: schedule_ai_evaluation()}
      else
        state
      end

    {:ok, state}
  end

  @impl true
  def handle_info(:send_greeting, state) do
    if state.config.enabled and state.config.greeting_enabled do
      Logger.info("[ChatBotServer] sending stream greeting")

      Task.start(fn ->
        StreamManager.send_chat_message(state.user_id, state.config.greeting_message)
      end)
    end

    {:noreply, state}
  end

  # Config shape messages
  def handle_info({:config_sync, _ref, {:insert, {_key, row}}}, state) do
    Logger.info("[ChatBotServer] config inserted, updating")
    {:noreply, apply_config_update(state, row)}
  end

  def handle_info({:config_sync, _ref, {:update, {_key, row}}}, state) do
    Logger.info("[ChatBotServer] config updated, reloading")
    {:noreply, apply_config_update(state, row)}
  end

  def handle_info({:config_sync, _ref, _other}, state) do
    {:noreply, state}
  end

  # Stream events shape messages
  def handle_info({:events_sync, _ref, {:insert, {_key, event}}}, state) do
    state =
      if state.config.enabled do
        handle_chat_event(state, event)
      else
        state
      end

    {:noreply, state}
  end

  def handle_info({:events_sync, _ref, _other}, state) do
    {:noreply, state}
  end

  # AI evaluation timer
  def handle_info(:ai_evaluate, state) do
    state = maybe_evaluate_and_respond(state)

    state =
      if state.config.ai_chat_enabled do
        %{state | ai_eval_timer: schedule_ai_evaluation()}
      else
        state
      end

    {:noreply, state}
  end

  # Delayed AI response (from mention during cooldown)
  def handle_info({:ai_generate_response, batch_count}, state) do
    {:noreply, do_generate_ai_response(state, batch_count)}
  end

  def handle_info(msg, state) do
    Logger.debug("[ChatBotServer] unhandled message: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.config_shape_pid, do: GenServer.stop(state.config_shape_pid, :normal)
    if state.events_shape_pid, do: GenServer.stop(state.events_shape_pid, :normal)
    if state.ai_eval_timer, do: Process.cancel_timer(state.ai_eval_timer)
    :ok
  end

  # ── Private ─────────────────────────────────────────────────────

  defp load_initial_config(state) do
    case ChatBotConfig.get_for_user(state.user_id, actor: Streampai.SystemActor.system()) do
      {:ok, [config | _]} ->
        update_config_from_record(state, config)

      _ ->
        state
    end
  end

  defp start_config_shape(state) do
    query = from(c in ChatBotConfig, where: c.user_id == ^state.user_id)

    case Shape.start_link(query, replica: :full) do
      {:ok, pid} ->
        ref = Shape.subscribe(pid, tag: :config_sync)
        %{state | config_shape_pid: pid, config_shape_ref: ref}

      {:error, reason} ->
        Logger.error("[ChatBotServer] failed to start config shape: #{inspect(reason)}")
        state
    end
  end

  defp start_events_shape(state) do
    query =
      from(e in Streampai.Stream.StreamEvent,
        where: e.user_id == ^state.user_id and e.type == :chat_message
      )

    case Shape.start_link(query, replica: :full) do
      {:ok, pid} ->
        ref = Shape.subscribe(pid, tag: :events_sync, only: [:insert])
        %{state | events_shape_pid: pid, events_shape_ref: ref}

      {:error, reason} ->
        Logger.error("[ChatBotServer] failed to start events shape: #{inspect(reason)}")
        state
    end
  end

  # ── Chat event handling ─────────────────────────────────────────

  defp handle_chat_event(state, event) do
    message = extract_message(event)
    prefix = state.config.command_prefix

    if String.starts_with?(message, prefix) do
      command =
        message
        |> String.trim_leading(prefix)
        |> String.split(" ", parts: 2)
        |> hd()
        |> String.downcase()

      execute_command(command, event, state)
      state
    else
      if state.config.ai_chat_enabled do
        handle_ai_chat_message(state, event)
      else
        state
      end
    end
  end

  # ── Commands ────────────────────────────────────────────────────

  defp execute_command("hi", event, state) do
    reply = Enum.random(@hello_messages)
    Logger.info("[ChatBotServer] !hi → #{reply}")
    send_reply(state, event, reply)
  end

  defp execute_command("uptime", event, state) do
    reply =
      case state.stream_started_at do
        nil ->
          "Stream uptime is unknown."

        started_at ->
          diff = DateTime.diff(DateTime.utc_now(), started_at, :second)
          hours = div(diff, 3600)
          minutes = div(rem(diff, 3600), 60)

          cond do
            hours > 0 -> "Stream has been live for #{hours}h #{minutes}m ⏱️"
            minutes > 0 -> "Stream has been live for #{minutes}m ⏱️"
            true -> "Stream just started! ⏱️"
          end
      end

    Logger.info("[ChatBotServer] !uptime → #{reply}")
    send_reply(state, event, reply)
  end

  defp execute_command("followage", event, state) do
    reply = "Follow tracking coming soon! 🔜"
    Logger.info("[ChatBotServer] !followage → placeholder")
    send_reply(state, event, reply)
  end

  defp execute_command("socials", event, state) do
    reply = "Check out the streamer's socials! 🔗"
    Logger.info("[ChatBotServer] !socials → placeholder")
    send_reply(state, event, reply)
  end

  defp execute_command("lurk", event, state) do
    username = extract_username(event)
    reply = "@#{username} is now lurking. Enjoy! 👀"
    Logger.info("[ChatBotServer] !lurk → #{username}")
    send_reply(state, event, reply)
  end

  defp execute_command("dice", event, state) do
    username = extract_username(event)
    roll = :rand.uniform(6)
    reply = "🎲 #{username} rolled a #{roll}!"
    Logger.info("[ChatBotServer] !dice → #{username} rolled #{roll}")
    send_reply(state, event, reply)
  end

  defp execute_command("quote", event, state) do
    reply = Enum.random(@quotes)
    Logger.info("[ChatBotServer] !quote → #{reply}")
    send_reply(state, event, reply)
  end

  defp execute_command("commands", event, state) do
    prefix = state.config.command_prefix
    list = Enum.map_join(@command_names, ", ", &"#{prefix}#{&1}")
    reply = "Available commands: #{list}"
    Logger.info("[ChatBotServer] !commands")
    send_reply(state, event, reply)
  end

  defp execute_command(_unknown, _event, _state), do: :ok

  defp send_reply(state, event, reply) do
    platform = extract_platform(event)

    Task.start(fn ->
      platforms = if platform, do: [platform], else: :all
      StreamManager.send_chat_message(state.user_id, reply, platforms)
    end)
  end

  # ── AI Chat ─────────────────────────────────────────────────────

  defp handle_ai_chat_message(state, event) do
    message = extract_message(event)
    username = extract_username(event)
    platform = extract_platform(event)
    is_mod = extract_is_moderator(event)
    bot_name = state.config.ai_bot_name || "Streampai"

    # Skip messages from the bot itself
    if String.downcase(username) == String.downcase(bot_name) do
      state
    else
      msg = %{
        username: username,
        message: message,
        platform: platform,
        is_moderator: is_mod
      }

      buffer = Enum.take([msg | state.ai_message_buffer], @ai_context_size)

      if AiHandler.mentioned?(message, bot_name) do
        state = %{state | ai_message_buffer: buffer, ai_pending_count: 0}
        maybe_respond_to_mention(state)
      else
        %{
          state
          | ai_message_buffer: buffer,
            ai_pending_count: state.ai_pending_count + 1,
            ai_cooldown_batch_count: state.ai_cooldown_batch_count + 1
        }
      end
    end
  end

  defp maybe_respond_to_mention(state) do
    now = :os.system_time(:millisecond)
    elapsed = now - state.ai_last_response_at

    if elapsed >= @ai_cooldown_ms do
      do_generate_ai_response(state, 1)
    else
      delay = @ai_cooldown_ms - elapsed
      Process.send_after(self(), {:ai_generate_response, 1}, delay)
      state
    end
  end

  defp maybe_evaluate_and_respond(state) do
    if state.ai_pending_count > 0 and state.ai_message_buffer != [] do
      now = :os.system_time(:millisecond)
      elapsed = now - state.ai_last_response_at

      if elapsed >= @ai_cooldown_ms do
        provider = get_ai_provider(state)

        if provider do
          bot_name = state.config.ai_bot_name || "Streampai"

          case AiHandler.should_respond?(provider, state.ai_message_buffer, bot_name) do
            {:ok, true} ->
              batch_count = state.ai_cooldown_batch_count
              state = %{state | ai_pending_count: 0, ai_cooldown_batch_count: 0}
              do_generate_ai_response(state, batch_count)

            {:ok, false} ->
              %{state | ai_pending_count: 0}

            {:error, _reason} ->
              %{state | ai_pending_count: 0}
          end
        else
          Logger.warning("[ChatBotServer] No AI provider available")
          %{state | ai_pending_count: 0}
        end
      else
        state
      end
    else
      state
    end
  end

  defp do_generate_ai_response(state, batch_count) do
    provider = get_ai_provider(state)

    if provider do
      bot_name = state.config.ai_bot_name || "Streampai"
      personality = state.config.ai_personality
      messages = state.ai_message_buffer
      user_id = state.user_id

      Task.start(fn ->
        result =
          if batch_count > 1 do
            AiHandler.generate_batched_response(
              provider,
              messages,
              personality,
              bot_name,
              batch_count
            )
          else
            case AiHandler.generate_response(provider, messages, personality, bot_name) do
              {:ok, text} -> {:ok, [text]}
              error -> error
            end
          end

        case result do
          {:ok, responses} ->
            Enum.each(responses, fn response ->
              if String.trim(response) != "" do
                StreamManager.send_chat_message(user_id, response)

                if length(responses) > 1, do: Process.sleep(1_500)
              end
            end)

          {:error, reason} ->
            Logger.error("[ChatBotServer] AI response failed: #{inspect(reason)}")
        end
      end)

      %{
        state
        | ai_last_response_at: :os.system_time(:millisecond),
          ai_pending_count: 0,
          ai_cooldown_batch_count: 0
      }
    else
      Logger.warning("[ChatBotServer] No AI provider for response generation")
      state
    end
  end

  defp get_ai_provider(state) do
    provider_name = state.config.ai_provider || "openai"
    ProviderRegistry.get_provider_or_default(provider_name)
  end

  defp schedule_ai_evaluation do
    Process.send_after(self(), :ai_evaluate, @ai_eval_interval)
  end

  # ── Config management ───────────────────────────────────────────

  defp apply_config_update(state, row) do
    old_ai_enabled = state.config.ai_chat_enabled
    state = update_config_from_row(state, row)
    new_ai_enabled = state.config.ai_chat_enabled

    cond do
      new_ai_enabled and not old_ai_enabled ->
        %{state | ai_eval_timer: schedule_ai_evaluation()}

      not new_ai_enabled and old_ai_enabled ->
        if state.ai_eval_timer, do: Process.cancel_timer(state.ai_eval_timer)

        %{
          state
          | ai_eval_timer: nil,
            ai_message_buffer: [],
            ai_pending_count: 0,
            ai_cooldown_batch_count: 0
        }

      true ->
        state
    end
  end

  defp update_config_from_row(state, row) when is_struct(row) do
    update_config_from_record(state, row)
  end

  defp update_config_from_row(state, row) when is_map(row) do
    %{
      state
      | config: %{
          enabled: to_bool(row["enabled"] || row[:enabled], true),
          greeting_enabled: to_bool(row["greeting_enabled"] || row[:greeting_enabled], false),
          greeting_message:
            row["greeting_message"] || row[:greeting_message] ||
              "Hello everyone! Welcome to the stream!",
          command_prefix: row["command_prefix"] || row[:command_prefix] || "!",
          ai_chat_enabled: to_bool(row["ai_chat_enabled"] || row[:ai_chat_enabled], false),
          ai_personality: row["ai_personality"] || row[:ai_personality],
          ai_bot_name: row["ai_bot_name"] || row[:ai_bot_name] || "Streampai",
          ai_provider: row["ai_provider"] || row[:ai_provider] || "openai"
        }
    }
  end

  defp update_config_from_record(state, record) do
    %{
      state
      | config: %{
          enabled: record.enabled,
          greeting_enabled: record.greeting_enabled,
          greeting_message: record.greeting_message,
          command_prefix: record.command_prefix,
          ai_chat_enabled: record.ai_chat_enabled,
          ai_personality: Map.get(record, :ai_personality),
          ai_bot_name: Map.get(record, :ai_bot_name, "Streampai"),
          ai_provider: Map.get(record, :ai_provider, "openai")
        }
    }
  end

  # ── Event extraction helpers ────────────────────────────────────

  defp extract_message(%{data: %Ash.Union{value: value}}) when is_struct(value) do
    Map.get(value, :message, "")
  end

  defp extract_message(%{data: data}) when is_map(data) do
    data["message"] || data[:message] || ""
  end

  defp extract_message(_), do: ""

  defp extract_platform(%{platform: platform}) when is_atom(platform) and not is_nil(platform), do: platform

  defp extract_platform(%{platform: platform}) when is_binary(platform), do: String.to_existing_atom(platform)

  defp extract_platform(_), do: nil

  defp extract_username(%{data: %Ash.Union{value: value}}) when is_struct(value), do: Map.get(value, :username, "friend")

  defp extract_username(%{data: data}) when is_map(data), do: data["username"] || data[:username] || "friend"

  defp extract_username(_), do: "friend"

  defp extract_is_moderator(%{data: %Ash.Union{value: value}}) when is_struct(value) do
    Map.get(value, :is_moderator, false)
  end

  defp extract_is_moderator(%{data: data}) when is_map(data) do
    data["is_moderator"] || data[:is_moderator] || false
  end

  defp extract_is_moderator(_), do: false

  defp to_bool(true, _default), do: true
  defp to_bool(false, _default), do: false
  defp to_bool("true", _default), do: true
  defp to_bool("false", _default), do: false
  defp to_bool(nil, default), do: default
  defp to_bool(_, default), do: default
end
