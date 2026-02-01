defmodule Streampai.LivestreamManager.StreamServices do
  @moduledoc """
  DynamicSupervisor for stream service processes: platform managers, alert queue, etc.
  Each child restarts independently (one_for_one).
  """
  use DynamicSupervisor

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.LivestreamManager.AlertQueue
  alias Streampai.LivestreamManager.Platforms
  alias Streampai.LivestreamManager.RegistryHelpers
  alias Streampai.LivestreamManager.StreamTimerServer
  alias Streampai.Stream.EventPersister

  require Logger

  @initialization_delay 100

  def start_link(user_id) when is_binary(user_id) do
    DynamicSupervisor.start_link(__MODULE__, user_id, name: RegistryHelpers.via_tuple(:stream_services, user_id))
  end

  @impl true
  def init(user_id) do
    # Initialize platform managers and alert queue after supervisor is ready
    Task.start(fn -> initialize_services(user_id) end)

    DynamicSupervisor.init(strategy: :one_for_one)
  end

  # Client API

  @doc """
  Starts a platform manager for a specific platform.
  """
  def start_platform_manager(user_id, platform, config)
      when platform in ~w(twitch youtube facebook kick tiktok trovo instagram rumble)a do
    supervisor = RegistryHelpers.via_tuple(:stream_services, user_id)
    child_spec = platform_manager_spec(user_id, platform, config)

    case DynamicSupervisor.start_child(supervisor, child_spec) do
      {:ok, pid} -> {:ok, pid}
      {:error, {:already_started, pid}} -> {:ok, pid}
      error -> error
    end
  end

  @doc """
  Stops a platform manager.
  """
  def stop_platform_manager(user_id, platform) do
    case RegistryHelpers.lookup(:platform_manager, user_id, platform) do
      {:ok, pid} ->
        supervisor = RegistryHelpers.via_tuple(:stream_services, user_id)
        DynamicSupervisor.terminate_child(supervisor, pid)

      :error ->
        {:error, :not_found}
    end
  end

  @doc """
  Broadcasts a chat message to specified platforms or all platforms.
  """
  def broadcast_message(user_id, message, platforms \\ :all, sent_event_id \\ nil) do
    target_platforms = normalize_platforms(user_id, platforms)

    tasks =
      Enum.map(target_platforms, fn platform ->
        Task.async(fn ->
          try do
            case RegistryHelpers.lookup(:platform_manager, user_id, platform) do
              {:ok, _pid} ->
                platform_module = get_platform_module(platform)

                case platform_module.send_chat_message(user_id, message) do
                  {:ok, platform_message_id} ->
                    # Register immediately so echoes arriving before await_many are caught
                    if platform_message_id do
                      EventPersister.register_sent_message_id(user_id, platform_message_id)
                    end

                    {platform, :delivered, platform_message_id}

                  {:error, _} ->
                    {platform, :failed, nil}
                end

              :error ->
                {platform, :failed, nil}
            end
          rescue
            error ->
              Logger.error("Error sending message on #{platform}: #{inspect(error)}")
              {platform, :failed, nil}
          catch
            kind, value ->
              Logger.error("Caught #{kind} on #{platform}: #{inspect(value)}")
              {platform, :failed, nil}
          end
        end)
      end)

    results = Task.await_many(tasks, 20_000)

    # Update delivery status on the sent-message StreamEvent
    delivery_results = Enum.map(results, fn {platform, status, _id} -> {platform, status} end)

    if sent_event_id do
      update_delivery_status(sent_event_id, delivery_results)
    end

    :ok
  end

  @doc """
  Updates stream metadata on specified platforms.
  """
  def update_metadata(user_id, metadata, platforms \\ :all) do
    execute_on_platforms(user_id, platforms, fn platform_module, _pid ->
      platform_module.update_stream_metadata(user_id, metadata)
    end)
  end

  # Private helpers

  defp initialize_services(user_id) do
    Process.sleep(@initialization_delay)

    # Start alert queue
    start_alert_queue(user_id)

    # Start platform managers for connected accounts
    case StreamingAccount.for_user(user_id) do
      {:ok, accounts} ->
        Enum.each(accounts, fn account ->
          config = %{
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.access_token_expires_at,
            extra_data: account.extra_data
          }

          start_platform_manager(user_id, account.platform, config)
        end)

      {:error, _} ->
        :ok
    end
  end

  defp start_alert_queue(user_id) do
    supervisor = RegistryHelpers.via_tuple(:stream_services, user_id)

    child_spec = %{
      id: {:alert_queue, user_id},
      start: {AlertQueue, :start_link, [user_id]},
      restart: :permanent,
      type: :worker
    }

    case DynamicSupervisor.start_child(supervisor, child_spec) do
      {:ok, _pid} -> :ok
      {:error, {:already_started, _pid}} -> :ok
      error -> Logger.error("Failed to start AlertQueue: #{inspect(error)}")
    end
  end

  @doc """
  Starts the StreamTimerServer for a user's active stream.
  """
  def start_stream_timer_server(user_id, stream_started_at) do
    supervisor = RegistryHelpers.via_tuple(:stream_services, user_id)

    case DynamicSupervisor.start_child(
           supervisor,
           {StreamTimerServer, {user_id, stream_started_at}}
         ) do
      {:ok, _pid} ->
        Logger.info("[StreamServices] StreamTimerServer started for user #{user_id}")
        :ok

      {:error, {:already_started, _pid}} ->
        :ok

      error ->
        Logger.error("[StreamServices] Failed to start StreamTimerServer: #{inspect(error)}")
        error
    end
  end

  @doc """
  Stops the StreamTimerServer for a user.
  """
  def stop_stream_timer_server(user_id) do
    case RegistryHelpers.lookup(:stream_timer_server, user_id) do
      {:ok, pid} ->
        supervisor = RegistryHelpers.via_tuple(:stream_services, user_id)
        DynamicSupervisor.terminate_child(supervisor, pid)

      :error ->
        :ok
    end
  end

  defp execute_on_platforms(user_id, platforms, callback) do
    target_platforms = normalize_platforms(user_id, platforms)

    tasks =
      Enum.map(target_platforms, fn platform ->
        Task.async(fn ->
          try do
            case RegistryHelpers.lookup(:platform_manager, user_id, platform) do
              {:ok, _pid} ->
                platform_module = get_platform_module(platform)
                callback.(platform_module, nil)
                {platform, :ok}

              :error ->
                {platform, {:error, :not_found}}
            end
          rescue
            error ->
              Logger.error("Error executing on platform #{platform}: #{inspect(error)}")
              {platform, {:error, error}}
          catch
            kind, value ->
              Logger.error("Caught #{kind} on platform #{platform}: #{inspect(value)}")
              {platform, {:error, {kind, value}}}
          end
        end)
      end)

    Task.await_many(tasks, 10_000)
    :ok
  end

  defp normalize_platforms(user_id, :all), do: get_active_platforms(user_id)
  defp normalize_platforms(user_id, [:all]), do: get_active_platforms(user_id)
  defp normalize_platforms(_user_id, platforms) when is_list(platforms), do: platforms
  defp normalize_platforms(_user_id, platform) when is_atom(platform), do: [platform]

  defp get_active_platforms(user_id) do
    registry = RegistryHelpers.get_registry_name()

    Registry.select(registry, [
      {{{:platform_manager, user_id, :"$1"}, :_, :_}, [], [:"$1"]}
    ])
  end

  defp platform_manager_spec(user_id, platform, config) do
    %{
      id: {:platform_manager, user_id, platform},
      start: {get_platform_module(platform), :start_link, [user_id, config]},
      restart: :permanent,
      type: :worker
    }
  end

  defp get_platform_module(:twitch), do: Platforms.TwitchManager
  defp get_platform_module(:youtube), do: Platforms.YouTubeManager
  defp get_platform_module(:facebook), do: Platforms.FacebookManager
  defp get_platform_module(:kick), do: Platforms.KickManager
  defp get_platform_module(:tiktok), do: Platforms.TikTokManager
  defp get_platform_module(:trovo), do: Platforms.TrovoManager
  defp get_platform_module(:instagram), do: Platforms.InstagramManager
  defp get_platform_module(:rumble), do: Platforms.RumbleManager

  defp update_delivery_status(event_id, results) do
    alias Streampai.Stream.StreamEvent

    delivery_status =
      Map.new(results, fn {platform, status} -> {to_string(platform), to_string(status)} end)

    case Ash.get(StreamEvent, event_id, authorize?: false) do
      {:ok, event} ->
        updated_value = Map.put(event.data.value, :delivery_status, delivery_status)
        updated_data = %{event.data | value: updated_value}

        event
        |> Ash.Changeset.for_update(:update_data, %{data: updated_data})
        |> Ash.update(authorize?: false)

      _ ->
        :ok
    end
  end
end
