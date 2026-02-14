defmodule Streampai.YouTube.TokenManager do
  @moduledoc """
  Centralized OAuth token management for YouTube integration.

  This GenServer maintains access tokens in memory and automatically refreshes
  them when needed. Multiple processes can request tokens without managing
  refresh logic themselves.

  ## Usage

      # Get current valid token (auto-refreshes if needed)
      {:ok, token} = TokenManager.get_token(user_id)

      # Subscribe to token updates
      TokenManager.subscribe(user_id)
      # Receives: {:token_updated, user_id, new_token}
  """

  use GenServer

  alias Streampai.Accounts.StreamingAccount

  require Logger

  defstruct [
    :user_id,
    :access_token,
    :refresh_token,
    :expires_at,
    :refresh_timer
  ]

  # Refresh 5 minutes before expiry
  @refresh_buffer_seconds 300

  ## Public API

  @doc """
  Starts a token manager for a specific user.
  """
  def start_link({user_id, config}) do
    GenServer.start_link(__MODULE__, {user_id, config}, name: via_tuple(user_id))
  end

  @doc """
  Gets the current valid token for a user, refreshing if necessary.
  """
  def get_token(user_id) do
    GenServer.call(via_tuple(user_id), :get_token)
  end

  @doc """
  Subscribes to token updates for a user.
  Subscriber will receive {:token_updated, user_id, new_token} messages.
  """
  def subscribe(user_id) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "youtube_token:#{user_id}")
  end

  @doc """
  Unsubscribes from token updates.
  """
  def unsubscribe(user_id) do
    Phoenix.PubSub.unsubscribe(Streampai.PubSub, "youtube_token:#{user_id}")
  end

  @doc """
  Forces an immediate token refresh.
  """
  def refresh_token(user_id) do
    GenServer.call(via_tuple(user_id), :refresh_token)
  end

  ## GenServer Callbacks

  @impl true
  def init({user_id, config}) do
    Logger.metadata(user_id: user_id, component: :youtube_token_manager)

    state = %__MODULE__{
      user_id: user_id,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_at: config.expires_at
    }

    # Schedule refresh if token needs it
    state = schedule_refresh_if_needed(state)

    Logger.info("Token manager started")
    {:ok, state}
  end

  @impl true
  def handle_call(:get_token, _from, state) do
    if token_needs_refresh?(state.expires_at) do
      Logger.info("Token needs refresh, refreshing now...")

      case do_refresh_token(state) do
        {:ok, new_state} ->
          {:reply, {:ok, new_state.access_token}, new_state}

        {:error, reason} = error ->
          Logger.error("Failed to refresh token: #{inspect(reason)}")
          {:reply, error, state}
      end
    else
      {:reply, {:ok, state.access_token}, state}
    end
  end

  @impl true
  def handle_call(:refresh_token, _from, state) do
    case do_refresh_token(state) do
      {:ok, new_state} ->
        Logger.info("Returning refreshed token (length: #{String.length(new_state.access_token)})")

        {:reply, {:ok, new_state.access_token}, new_state}

      {:error, _reason} = error ->
        {:reply, error, state}
    end
  end

  @impl true
  def handle_info(:refresh_token, state) do
    Logger.info("Automatic token refresh triggered")

    case do_refresh_token(state) do
      {:ok, new_state} ->
        {:noreply, new_state}

      {:error, {:http_error, 400, %{"error" => "invalid_grant"}}} ->
        Logger.error("Token permanently revoked, stopping auto-refresh")
        {:noreply, %{state | refresh_timer: nil}}

      {:error, reason} ->
        Logger.error("Automatic token refresh failed: #{inspect(reason)}")
        # Schedule retry in 1 minute
        timer = Process.send_after(self(), :refresh_token, 60_000)
        {:noreply, %{state | refresh_timer: timer}}
    end
  end

  @impl true
  def terminate(_reason, state) do
    if state.refresh_timer do
      Process.cancel_timer(state.refresh_timer)
    end

    :ok
  end

  ## Private Functions

  defp do_refresh_token(state) do
    Logger.info("Refreshing OAuth token...")

    case refresh_google_token(state.refresh_token) do
      {:ok, new_config} ->
        # Update database
        update_streaming_account_tokens(state.user_id, new_config)

        # Broadcast token update
        broadcast_token_update(state.user_id, new_config.access_token)

        new_state = %{
          state
          | access_token: new_config.access_token,
            refresh_token: new_config.refresh_token,
            expires_at: new_config.expires_at
        }

        # Schedule next refresh
        new_state = schedule_refresh_if_needed(new_state)

        Logger.info("Token refreshed successfully")
        {:ok, new_state}

      {:error, {:http_error, 400, %{"error" => "invalid_grant"}} = reason} ->
        Logger.error("Refresh token revoked or expired (invalid_grant)")
        mark_account_needs_reauth(state.user_id)
        broadcast_token_revoked(state.user_id)
        {:error, reason}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp refresh_google_token(refresh_token) do
    client_id = System.get_env("GOOGLE_CLIENT_ID")
    client_secret = System.get_env("GOOGLE_CLIENT_SECRET")

    case Req.post("https://oauth2.googleapis.com/token",
           json: %{
             client_id: client_id,
             client_secret: client_secret,
             refresh_token: refresh_token,
             grant_type: "refresh_token"
           }
         ) do
      {:ok, %{status: 200, body: body}} ->
        new_access_token = body["access_token"]
        new_refresh_token = Map.get(body, "refresh_token", refresh_token)
        expires_at = DateTime.add(DateTime.utc_now(), body["expires_in"], :second)

        token_preview = if new_access_token, do: String.slice(new_access_token, 0..9), else: "nil"

        Logger.info(
          "Received new access token from Google (length: #{String.length(new_access_token || "")}, preview: #{token_preview}...)"
        )

        {:ok,
         %{
           access_token: new_access_token,
           refresh_token: new_refresh_token,
           expires_at: expires_at
         }}

      {:ok, %{status: status, body: body}} ->
        {:error, {:http_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp update_streaming_account_tokens(user_id, new_config) do
    require Ash.Query

    # Use authorize?: false for background token updates
    StreamingAccount
    |> Ash.Query.filter(user_id: user_id, platform: :youtube)
    |> Ash.read_one!(authorize?: false)
    |> case do
      nil ->
        Logger.warning("No streaming account found for user #{user_id}")

      account ->
        account
        |> Ash.Changeset.for_update(:refresh_token, %{
          access_token: new_config.access_token,
          refresh_token: new_config.refresh_token,
          access_token_expires_at: new_config.expires_at
        })
        |> Ash.update!(authorize?: false)
    end
  end

  defp schedule_refresh_if_needed(state) do
    # Cancel existing timer
    if state.refresh_timer do
      Process.cancel_timer(state.refresh_timer)
    end

    if state.expires_at do
      # Calculate when to refresh (5 minutes before expiry)
      now = DateTime.utc_now()
      refresh_at = DateTime.add(state.expires_at, -@refresh_buffer_seconds, :second)
      delay_ms = max(0, DateTime.diff(refresh_at, now, :millisecond))

      Logger.info("Scheduling token refresh in #{div(delay_ms, 1000)} seconds")
      timer = Process.send_after(self(), :refresh_token, delay_ms)

      %{state | refresh_timer: timer}
    else
      state
    end
  end

  defp token_needs_refresh?(nil), do: true

  defp token_needs_refresh?(expires_at) do
    DateTime.diff(expires_at, DateTime.utc_now(), :second) < @refresh_buffer_seconds
  end

  defp broadcast_token_update(user_id, new_token) do
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "youtube_token:#{user_id}",
      {:token_updated, user_id, new_token}
    )
  end

  defp mark_account_needs_reauth(user_id) do
    require Ash.Query

    StreamingAccount
    |> Ash.Query.filter(user_id: user_id, platform: :youtube)
    |> Ash.read_one!(authorize?: false)
    |> case do
      nil -> :ok
      account -> Ash.update!(account, action: :mark_needs_reauth, authorize?: false)
    end
  end

  defp broadcast_token_revoked(user_id) do
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "youtube_token:#{user_id}",
      {:token_revoked, user_id}
    )
  end

  defp via_tuple(user_id) do
    {:via, Registry, {Streampai.LivestreamManager.Registry, {:youtube_token, user_id}}}
  end
end
