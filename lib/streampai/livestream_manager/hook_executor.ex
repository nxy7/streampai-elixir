defmodule Streampai.LivestreamManager.HookExecutor do
  @moduledoc """
  Per-user GenServer that evaluates stream hooks against incoming events.

  Started as a sibling of `StreamManager` under `UserSupervisor` when the
  user comes online (presence-based). Stays alive as long as the user's
  machinery is running.

  Uses two sync subscriptions:
  1. `Phoenix.Sync.Shape` for hook configs (bounded, needs full state)
  2. `Phoenix.Sync.Client.stream` for stream events (unbounded, no materialization)
  """
  use GenServer

  import Ecto.Query

  alias Electric.Client.Message
  alias Phoenix.Sync.Shape
  alias Streampai.LivestreamManager.HookActions
  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamHook
  alias Streampai.Stream.StreamHookLog

  require Logger

  defstruct [
    :user_id,
    :hooks_shape_pid,
    :hooks_shape_ref,
    :events_stream_pid,
    hooks: %{}
  ]

  # ── Client API ──────────────────────────────────────────────────

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: RegistryHelpers.via_tuple(:hook_executor, user_id))
  end

  def child_spec(user_id) do
    %{
      id: {:hook_executor, user_id},
      start: {__MODULE__, :start_link, [user_id]},
      restart: :transient,
      type: :worker
    }
  end

  @doc """
  Trigger a lifecycle event (stream_start/stream_end) from StreamManager.
  """
  def trigger_lifecycle_event(user_id, event_type, metadata \\ %{}) do
    case RegistryHelpers.lookup(:hook_executor, user_id) do
      {:ok, pid} -> GenServer.cast(pid, {:lifecycle_event, event_type, metadata})
      :error -> :ok
    end
  end

  # ── GenServer callbacks ─────────────────────────────────────────

  @impl true
  def init(user_id) do
    Logger.metadata(component: :hook_executor, user_id: user_id)
    Logger.info("[HookExecutor] started for user #{user_id}")

    state = %__MODULE__{user_id: user_id}
    state = load_initial_hooks(state)
    state = start_hooks_shape(state)
    state = start_events_stream(state)

    {:ok, state}
  end

  # ── Hook config shape messages ──────────────────────────────────

  @impl true
  def handle_info({:hooks_sync, _ref, {:insert, {_key, row}}}, state) do
    hook = normalize_hook(row)
    hooks = Map.put(state.hooks, hook.id, hook)
    Logger.debug("[HookExecutor] hook added: #{hook.name} (#{hook.trigger_type})")
    {:noreply, %{state | hooks: hooks}}
  end

  def handle_info({:hooks_sync, _ref, {:update, {_key, row}}}, state) do
    hook = normalize_hook(row)
    hooks = Map.put(state.hooks, hook.id, hook)
    Logger.debug("[HookExecutor] hook updated: #{hook.name}")
    {:noreply, %{state | hooks: hooks}}
  end

  def handle_info({:hooks_sync, _ref, {:delete, {_key, row}}}, state) do
    hook_id = extract_id(row)
    hooks = Map.delete(state.hooks, hook_id)
    Logger.debug("[HookExecutor] hook deleted: #{hook_id}")
    {:noreply, %{state | hooks: hooks}}
  end

  def handle_info({:hooks_sync, _ref, _control}, state) do
    {:noreply, state}
  end

  # ── Stream events from Client.stream ────────────────────────────

  def handle_info({:event_sync, %Message.ChangeMessage{headers: %{operation: :insert}, value: event}}, state) do
    evaluate_hooks(state, event)
    {:noreply, state}
  end

  def handle_info({:event_sync, %Message.ChangeMessage{}}, state) do
    # Ignore updates and deletes
    {:noreply, state}
  end

  def handle_info({:event_sync, %Message.ControlMessage{}}, state) do
    {:noreply, state}
  end

  # ── Lifecycle events from StreamManager ─────────────────────────

  @impl true
  def handle_cast({:lifecycle_event, event_type, metadata}, state) do
    synthetic_event = %{
      id: Ecto.UUID.generate(),
      type: event_type,
      data: metadata,
      platform: nil,
      user_id: state.user_id
    }

    evaluate_hooks(state, synthetic_event)
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.hooks_shape_pid, do: GenServer.stop(state.hooks_shape_pid, :normal)

    if state.events_stream_pid && Process.alive?(state.events_stream_pid),
      do: Process.exit(state.events_stream_pid, :normal)

    :ok
  end

  # ── Private: initialization ─────────────────────────────────────

  defp load_initial_hooks(state) do
    case StreamHook.get_enabled_for_user(state.user_id, authorize?: false) do
      {:ok, hooks} ->
        hooks_map = Map.new(hooks, &{&1.id, &1})
        Logger.info("[HookExecutor] loaded #{map_size(hooks_map)} enabled hooks")
        %{state | hooks: hooks_map}

      {:error, reason} ->
        Logger.error("[HookExecutor] failed to load hooks: #{inspect(reason)}")
        state
    end
  end

  defp start_hooks_shape(state) do
    query = from(h in StreamHook, where: h.user_id == ^state.user_id and h.enabled == true)

    case Shape.start_link(query, replica: :full) do
      {:ok, pid} ->
        ref = Shape.subscribe(pid, tag: :hooks_sync)
        %{state | hooks_shape_pid: pid, hooks_shape_ref: ref}

      {:error, reason} ->
        Logger.error("[HookExecutor] failed to start hooks shape: #{inspect(reason)}")
        state
    end
  end

  defp start_events_stream(state) do
    self_pid = self()
    user_id = state.user_id

    pid =
      spawn_link(fn ->
        stream =
          Phoenix.Sync.Client.stream(
            from(e in StreamEvent, where: e.user_id == ^user_id),
            replica: :full
          )

        Enum.each(stream, &send(self_pid, {:event_sync, &1}))
      end)

    %{state | events_stream_pid: pid}
  end

  # ── Private: hook evaluation ────────────────────────────────────

  defp evaluate_hooks(state, event) do
    event_type = extract_event_type(event)

    state.hooks
    |> Map.values()
    |> Enum.filter(&(&1.trigger_type == event_type))
    |> Enum.each(fn hook ->
      cond do
        not passes_conditions?(hook, event) ->
          log_execution(hook, event, :skipped_condition, nil, nil, 0)

        in_cooldown?(hook) ->
          log_execution(hook, event, :skipped_cooldown, nil, nil, 0)

        true ->
          execute_hook_async(hook, event, state.user_id)
      end
    end)
  end

  defp execute_hook_async(hook, event, user_id) do
    Task.start(fn ->
      context = %{user_id: user_id}

      case execute_action(hook, event, context) do
        {:ok, duration_ms} ->
          log_execution(hook, event, :success, nil, nil, duration_ms)
          mark_triggered(hook)

        {:error, reason} ->
          log_execution(hook, event, :failure, to_string(reason), nil, 0)
      end
    end)
  end

  defp execute_action(%{action_type: :webhook} = hook, event, ctx), do: HookActions.Webhook.execute(hook, event, ctx)

  defp execute_action(%{action_type: :chat_message} = hook, event, ctx),
    do: HookActions.ChatMessage.execute(hook, event, ctx)

  defp execute_action(%{action_type: :discord_message} = hook, event, ctx),
    do: HookActions.DiscordMessage.execute(hook, event, ctx)

  defp execute_action(%{action_type: :email}, _event, _ctx), do: {:error, "Email action not yet implemented"}

  defp execute_action(%{action_type: type}, _event, _ctx), do: {:error, "Unknown action type: #{type}"}

  # ── Private: conditions ─────────────────────────────────────────

  defp passes_conditions?(%{conditions: nil}, _event), do: true
  defp passes_conditions?(%{conditions: conditions}, _event) when conditions == %{}, do: true

  defp passes_conditions?(%{conditions: conditions, trigger_type: :donation}, event) do
    data = extract_event_data(event)
    amount = parse_number(data[:amount] || data["amount"])

    min_ok =
      case conditions["min_amount"] do
        nil -> true
        min -> amount != nil and amount >= min
      end

    currency_ok =
      case conditions["currency"] do
        nil -> true
        cur -> (data[:currency] || data["currency"]) == cur
      end

    min_ok and currency_ok
  end

  defp passes_conditions?(%{conditions: conditions, trigger_type: :chat_message}, event) do
    data = extract_event_data(event)
    message = to_string(data[:message] || data["message"] || "")

    contains_ok =
      case conditions["contains"] do
        nil -> true
        pattern -> String.contains?(String.downcase(message), String.downcase(pattern))
      end

    mod_ok =
      case conditions["is_moderator"] do
        nil -> true
        true -> data[:is_moderator] == true or data["is_moderator"] == true
        false -> true
      end

    contains_ok and mod_ok
  end

  defp passes_conditions?(%{conditions: conditions, trigger_type: :raid}, event) do
    data = extract_event_data(event)
    viewer_count = parse_number(data[:viewer_count] || data["viewer_count"])

    case conditions["min_viewers"] do
      nil -> true
      min -> viewer_count != nil and viewer_count >= min
    end
  end

  defp passes_conditions?(_hook, _event), do: true

  # ── Private: cooldown ───────────────────────────────────────────

  defp in_cooldown?(%{cooldown_seconds: 0}), do: false
  defp in_cooldown?(%{cooldown_seconds: nil}), do: false
  defp in_cooldown?(%{last_triggered_at: nil}), do: false

  defp in_cooldown?(%{cooldown_seconds: cooldown, last_triggered_at: last}) do
    DateTime.diff(DateTime.utc_now(), last, :second) < cooldown
  end

  # ── Private: logging & marking ──────────────────────────────────

  defp log_execution(hook, event, status, error_message, _metadata, duration_ms) do
    event_id = extract_id(event)

    StreamHookLog.create(
      %{
        hook_id: hook.id,
        user_id: hook.user_id,
        stream_event_id: if(is_binary(event_id) && Ecto.UUID.cast(event_id) != :error, do: event_id),
        trigger_type: hook.trigger_type,
        action_type: hook.action_type,
        status: status,
        error_message: error_message,
        executed_at: DateTime.utc_now(),
        duration_ms: duration_ms
      },
      authorize?: false
    )
  end

  defp mark_triggered(hook) do
    hook
    |> Ash.Changeset.for_update(:mark_triggered, %{})
    |> Ash.update(authorize?: false)
  end

  # ── Private: helpers ────────────────────────────────────────────

  defp extract_event_type(%{type: type}) when is_atom(type), do: type

  defp extract_event_type(%{type: type}) when is_binary(type) do
    String.to_existing_atom(type)
  rescue
    _ -> nil
  end

  defp extract_event_type(%{"type" => type}) when is_binary(type) do
    String.to_existing_atom(type)
  rescue
    _ -> nil
  end

  defp extract_event_type(_), do: nil

  defp extract_event_data(%{data: %Ash.Union{value: value}}) when is_struct(value), do: Map.from_struct(value)

  defp extract_event_data(%{data: %Ash.Union{value: value}}) when is_map(value), do: value
  defp extract_event_data(%{data: data}) when is_map(data), do: data
  defp extract_event_data(%{"data" => data}) when is_map(data), do: data
  defp extract_event_data(_), do: %{}

  defp extract_id(%{id: id}), do: id
  defp extract_id(%{"id" => id}), do: id
  defp extract_id(_), do: nil

  defp normalize_hook(%StreamHook{} = hook), do: hook

  defp normalize_hook(row) when is_map(row) do
    %{
      id: row["id"] || row[:id],
      user_id: row["user_id"] || row[:user_id],
      name: row["name"] || row[:name],
      enabled: to_bool(row["enabled"] || row[:enabled]),
      trigger_type: to_atom(row["trigger_type"] || row[:trigger_type]),
      conditions: row["conditions"] || row[:conditions] || %{},
      action_type: to_atom(row["action_type"] || row[:action_type]),
      action_config: row["action_config"] || row[:action_config] || %{},
      cooldown_seconds: row["cooldown_seconds"] || row[:cooldown_seconds] || 0,
      last_triggered_at: row["last_triggered_at"] || row[:last_triggered_at]
    }
  end

  defp to_bool(true), do: true
  defp to_bool("true"), do: true
  defp to_bool(_), do: false

  defp to_atom(val) when is_atom(val), do: val

  defp to_atom(val) when is_binary(val) do
    String.to_existing_atom(val)
  rescue
    _ -> nil
  end

  defp to_atom(_), do: nil

  defp parse_number(nil), do: nil
  defp parse_number(n) when is_number(n), do: n

  defp parse_number(s) when is_binary(s) do
    case Float.parse(s) do
      {f, _} -> f
      :error -> nil
    end
  end

  defp parse_number(_), do: nil
end
