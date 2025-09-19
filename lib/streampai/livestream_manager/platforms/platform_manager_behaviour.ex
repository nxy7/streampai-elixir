defmodule Streampai.LivestreamManager.Platforms.PlatformManagerBehaviour do
  @moduledoc """
  Shared behaviour for platform managers in the livestream system.

  This module provides common functionality that all platform managers need:
  - Standard GenServer setup and callbacks
  - Registry management with test support
  - Common client API functions
  - State management patterns
  - Activity logging

  Usage:

      defmodule MyPlatformManager do
        use Streampai.LivestreamManager.Platforms.PlatformManagerBehaviour,
          platform: :my_platform,
          activity_interval: 30_000

        # Implement required callbacks
        def handle_start_streaming(state, stream_uuid), do: {:ok, state}
        def handle_stop_streaming(state), do: {:ok, state}
        def handle_send_chat_message(state, message), do: {:ok, state}
        def handle_update_stream_metadata(state, metadata), do: {:ok, state}
      end
  """

  @doc """
  Called when streaming should start.
  Should return {:ok, new_state} or {:error, reason}
  """
  @callback handle_start_streaming(state :: map(), stream_uuid :: String.t()) ::
              {:ok, map()} | {:error, term()}

  @doc """
  Called when streaming should stop.
  Should return {:ok, new_state}
  """
  @callback handle_stop_streaming(state :: map()) :: {:ok, map()}

  @doc """
  Called when a chat message should be sent.
  Should return {:ok, new_state} or {:error, reason}
  """
  @callback handle_send_chat_message(state :: map(), message :: String.t()) ::
              {:ok, map()} | {:error, term()}

  @doc """
  Called when stream metadata should be updated.
  Should return {:ok, new_state} or {:error, reason}
  """
  @callback handle_update_stream_metadata(state :: map(), metadata :: map()) ::
              {:ok, map()} | {:error, term()}

  defmacro __using__(opts) do
    platform = Keyword.fetch!(opts, :platform)
    activity_interval = Keyword.get(opts, :activity_interval, 30_000)

    quote do
      @behaviour unquote(__MODULE__)

      use GenServer

      require Logger

      @platform unquote(platform)
      @activity_interval unquote(activity_interval)

      # Client API

      def start_link(user_id, config) when is_binary(user_id) do
        GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
      end

      def start_streaming(user_id, stream_uuid) do
        GenServer.call(via_tuple(user_id), {:start_streaming, stream_uuid})
      end

      def stop_streaming(user_id) do
        GenServer.call(via_tuple(user_id), :stop_streaming)
      end

      def send_chat_message(pid, message) when is_pid(pid) do
        GenServer.call(pid, {:send_chat_message, message})
      end

      def send_chat_message(user_id, message) when is_binary(user_id) do
        GenServer.call(via_tuple(user_id), {:send_chat_message, message})
      end

      def update_stream_metadata(pid, metadata) when is_pid(pid) do
        GenServer.call(pid, {:update_stream_metadata, metadata})
      end

      def update_stream_metadata(user_id, metadata) when is_binary(user_id) do
        GenServer.call(via_tuple(user_id), {:update_stream_metadata, metadata})
      end

      # GenServer callbacks

      @impl true
      def init({user_id, config}) do
        schedule_activity_log()

        state = %{
          user_id: user_id,
          platform: @platform,
          config: config,
          is_active: false,
          started_at: DateTime.utc_now()
        }

        Logger.info("[#{platform_name()}:#{user_id}] Started - #{DateTime.utc_now()}")
        {:ok, state}
      end

      @impl true
      def handle_call({:start_streaming, stream_uuid}, _from, state) do
        Logger.info("[#{platform_name()}:#{state.user_id}] Starting stream: #{stream_uuid}")

        case handle_start_streaming(state, stream_uuid) do
          {:ok, new_state} ->
            Logger.info("[#{platform_name()}:#{state.user_id}] Stream started successfully")
            {:reply, :ok, new_state}

          {:error, reason} ->
            Logger.error("[#{platform_name()}:#{state.user_id}] Failed to start stream: #{inspect(reason)}")

            {:reply, {:error, reason}, state}
        end
      end

      @impl true
      def handle_call(:stop_streaming, _from, state) do
        Logger.info("[#{platform_name()}:#{state.user_id}] Stopping stream")

        {:ok, new_state} = handle_stop_streaming(state)
        Logger.info("[#{platform_name()}:#{state.user_id}] Stream stopped successfully")
        {:reply, :ok, new_state}
      end

      @impl true
      def handle_call({:send_chat_message, message}, _from, state) do
        Logger.info("[#{platform_name()}:#{state.user_id}] Sending chat message: #{message}")

        case handle_send_chat_message(state, message) do
          {:ok, new_state} ->
            {:reply, :ok, new_state}

          {:error, reason} ->
            Logger.error("[#{platform_name()}:#{state.user_id}] Failed to send chat message: #{inspect(reason)}")

            {:reply, {:error, reason}, state}
        end
      end

      @impl true
      def handle_call({:update_stream_metadata, metadata}, _from, state) do
        Logger.info("[#{platform_name()}:#{state.user_id}] Updating metadata: #{inspect(metadata)}")

        case handle_update_stream_metadata(state, metadata) do
          {:ok, new_state} ->
            {:reply, :ok, new_state}

          {:error, reason} ->
            Logger.error("[#{platform_name()}:#{state.user_id}] Failed to update metadata: #{inspect(reason)}")

            {:reply, {:error, reason}, state}
        end
      end

      @impl true
      def handle_info(:log_activity, state) do
        if state.is_active do
          Logger.info("[#{platform_name()}:#{state.user_id}] Streaming active")
        else
          Logger.debug("[#{platform_name()}:#{state.user_id}] Standby - #{DateTime.utc_now()}")
        end

        schedule_activity_log()
        {:noreply, state}
      end

      @impl true
      def handle_info(msg, state) do
        Logger.debug("[#{platform_name()}:#{state.user_id}] Unknown message: #{inspect(msg)}")
        {:noreply, state}
      end

      @impl true
      def handle_cast(request, state) do
        Logger.debug("[#{platform_name()}:#{state.user_id}] Unhandled cast: #{inspect(request)}")
        {:noreply, state}
      end

      # Private helper functions

      defp schedule_activity_log do
        Process.send_after(self(), :log_activity, @activity_interval)
      end

      defp platform_name do
        (@platform |> to_string() |> String.capitalize()) <> "Manager"
      end

      defp via_tuple(user_id) do
        registry_name = get_registry_name()
        {:via, Registry, {registry_name, {:platform_manager, user_id, @platform}}}
      end

      defp get_registry_name do
        if Application.get_env(:streampai, :test_mode, false) do
          case Process.get(:test_registry_name) do
            nil -> Streampai.LivestreamManager.Registry
            test_registry -> test_registry
          end
        else
          Streampai.LivestreamManager.Registry
        end
      end

      # Allow overriding any of these functions
      defoverridable handle_info: 2, handle_cast: 2, init: 1
    end
  end
end
