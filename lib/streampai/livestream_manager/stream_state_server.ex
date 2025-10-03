defmodule Streampai.LivestreamManager.StreamStateServer do
  @moduledoc """
  GenServer that maintains the current state of a user's livestream.
  Tracks stream status, metadata, statistics, and platform connections.
  """
  use GenServer

  alias Streampai.Accounts.StreamingAccount

  require Logger

  defstruct [
    :user_id,
    # :offline, :starting, :live, :ending
    :status,
    :title,
    :thumbnail_url,
    :started_at,
    :ended_at,
    # %{twitch: %{status: :connected, stream_key: "..."}, ...}
    :platforms,
    # %{total_viewers: 0, chat_messages: 0, ...}
    :statistics,
    # %{input_id: "...", rtmp_url: "...", stream_key: "..."}
    :cloudflare_input
  ]

  def start_link(user_id) when is_binary(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: via_tuple(user_id))
  end

  @impl true
  def init(user_id) do
    # Set Logger metadata once for this process
    Logger.metadata(user_id: user_id, component: :stream_state_server)

    # Load user's connected platforms from database
    platforms = load_user_platforms(user_id)

    state = %__MODULE__{
      user_id: user_id,
      status: :offline,
      platforms: platforms,
      statistics: %{
        total_viewers: 0,
        chat_messages: 0,
        donations_count: 0,
        follows_count: 0,
        subscribers_count: 0,
        raids_count: 0
      }
    }

    Logger.info("StreamStateServer started")
    {:ok, state}
  end

  # Client API

  def get_state(server) do
    GenServer.call(server, :get_state)
  end

  def update_status(server, status) when status in [:offline, :starting, :live, :ending] do
    GenServer.cast(server, {:update_status, status})
  end

  def update_metadata(server, metadata) do
    GenServer.cast(server, {:update_metadata, metadata})
  end

  def update_platform_status(server, platform, status) do
    GenServer.cast(server, {:update_platform_status, platform, status})
  end

  def update_statistics(server, stats_update) do
    GenServer.cast(server, {:update_statistics, stats_update})
  end

  def set_cloudflare_input(server, input_config) do
    GenServer.cast(server, {:set_cloudflare_input, input_config})
  end

  @doc """
  Starts a new streaming session with the given stream UUID.
  """
  def start_stream(server, stream_uuid) do
    GenServer.cast(server, {:start_stream, stream_uuid})
  end

  @doc """
  Stops the current streaming session.
  """
  def stop_stream(server) do
    GenServer.cast(server, :stop_stream)
  end

  @doc """
  Updates the input status from CloudflareLiveInputMonitor.
  """
  def update_input_status(user_id, status) do
    server = via_tuple(user_id)
    GenServer.cast(server, {:update_input_status, status})
  end

  # Server callbacks

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, state, state}
  end

  @impl true
  def handle_cast({:update_status, new_status}, state) do
    state = %{state | status: new_status}

    state =
      case new_status do
        :live -> %{state | started_at: DateTime.utc_now()}
        :offline -> %{state | ended_at: DateTime.utc_now()}
        _ -> state
      end

    broadcast_state_change(state)
    {:noreply, state}
  end

  @impl true
  def handle_cast({:update_metadata, metadata}, state) do
    state = Map.merge(state, Map.take(metadata, [:title, :thumbnail_url]))

    broadcast_state_change(state)
    {:noreply, state}
  end

  @impl true
  def handle_cast({:update_platform_status, platform, status_update}, state) do
    platforms =
      Map.update(state.platforms, platform, status_update, fn existing ->
        Map.merge(existing, status_update)
      end)

    state = %{state | platforms: platforms}
    broadcast_state_change(state)
    {:noreply, state}
  end

  @impl true
  def handle_cast({:update_statistics, stats_update}, state) do
    statistics =
      Map.merge(state.statistics, stats_update, fn _k, v1, v2 ->
        if is_number(v1) and is_number(v2), do: v2, else: v2
      end)

    state = %{state | statistics: statistics}

    # Broadcast statistics update (less frequently than full state)
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "user_stream:#{state.user_id}:statistics",
      {:stream_statistics_update, statistics}
    )

    {:noreply, state}
  end

  @impl true
  def handle_cast({:set_cloudflare_input, input_config}, state) do
    state = %{state | cloudflare_input: input_config}
    broadcast_state_change(state)
    {:noreply, state}
  end

  @impl true
  def handle_cast({:start_stream, stream_uuid}, state) do
    Logger.info("Starting stream", stream_uuid: stream_uuid)

    state = %{state | status: :starting, started_at: DateTime.utc_now()}

    broadcast_state_change(state)
    {:noreply, Map.put(state, :stream_uuid, stream_uuid)}
  end

  @impl true
  def handle_cast(:stop_stream, state) do
    Logger.info("Stopping stream")

    state = %{state | status: :offline, ended_at: DateTime.utc_now()}

    broadcast_state_change(state)
    {:noreply, Map.delete(state, :stream_uuid)}
  end

  @impl true
  def handle_cast({:update_input_status, status}, state) do
    Logger.debug("Input status updated", input_status: status)

    # Update cloudflare input status
    cloudflare_input = Map.put(state.cloudflare_input || %{}, :input_status, status)
    state = %{state | cloudflare_input: cloudflare_input}

    {:noreply, state}
  end

  # Helper functions

  defp via_tuple(user_id) do
    registry_name =
      if Application.get_env(:streampai, :test_mode, false) do
        # In test mode, check if there's a process dictionary with the registry name
        case Process.get(:test_registry_name) do
          nil -> Streampai.LivestreamManager.Registry
          test_registry -> test_registry
        end
      else
        Streampai.LivestreamManager.Registry
      end

    {:via, Registry, {registry_name, {:stream_state, user_id}}}
  end

  defp load_user_platforms(user_id) do
    # Load from database - for now return empty map
    # TODO: Query StreamingAccount table for user's connected platforms
    case StreamingAccount.for_user(user_id) do
      {:ok, accounts} ->
        Map.new(accounts, fn account ->
          {account.platform,
           %{
             status: :disconnected,
             access_token: account.access_token,
             refresh_token: account.refresh_token,
             expires_at: account.access_token_expires_at
           }}
        end)

      {:error, _} ->
        %{}
    end
  end

  defp broadcast_state_change(state) do
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "user_stream:#{state.user_id}",
      {:stream_state_changed, state}
    )
  end
end
