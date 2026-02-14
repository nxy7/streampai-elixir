defmodule Streampai.LivestreamManager.BroadcastStrategy do
  @moduledoc """
  Behaviour for RTMP relay strategies.

  A broadcast strategy manages:
  1. RTMP ingest — accepting streams from OBS/encoders
  2. Encoder detection — knowing when an encoder connects/disconnects
  3. Output relay — forwarding the ingest to platform RTMP endpoints
  4. Cleanup — tearing down outputs and inputs on stop

  StreamManager has no polling loop. All strategies push status changes by
  sending `{:strategy_event, event}` messages to the StreamManager pid.
  How a strategy detects encoder status is its own internal concern.
  """

  @type strategy_state :: map()
  @type input_info :: %{
          input_id: String.t(),
          orientation: :horizontal | :vertical,
          rtmp_url: String.t(),
          stream_key: String.t(),
          srt_url: String.t() | nil,
          webrtc_url: String.t() | nil
        }
  @type output_handle :: String.t()
  @type streaming_status :: :live | :offline

  # -- Lifecycle --

  @doc """
  Initialize the strategy for a user. Called during StreamManager :initializing.

  The strategy receives the StreamManager pid so it can push status change
  notifications via `{:strategy_event, event}` messages. Each strategy manages
  its own detection internally (Cloudflare: poll timer + webhooks, Membrane:
  pipeline notifications).

  Returns strategy state and input info (RTMP URL + key for OBS).
  """
  @callback init(user_id :: String.t(), stream_manager_pid :: pid()) ::
              {:ok,
               %{
                 state: strategy_state(),
                 horizontal_input: input_info(),
                 vertical_input: input_info()
               }}
              | {:error, term()}

  @doc """
  Handle an external event (e.g. Cloudflare webhook) that arrives via the
  StreamManager. Returns an updated streaming status if the event is relevant.
  """
  @callback handle_event(strategy_state(), event :: term()) ::
              {:status_change, streaming_status(), strategy_state()}
              | :ignore

  # -- Output Management --

  @doc """
  Register a platform as a relay destination.
  Called by platform managers when they start streaming.
  Returns an opaque output handle for later cleanup.
  """
  @callback add_output(strategy_state(), %{
              rtmp_url: String.t(),
              stream_key: String.t(),
              platform: atom()
            }) ::
              {:ok, output_handle(), strategy_state()}
              | {:error, term()}

  @doc """
  Remove a platform relay destination.
  Called by platform managers when they stop streaming.
  """
  @callback remove_output(strategy_state(), output_handle()) ::
              :ok | {:error, term()}

  @doc """
  Remove all relay destinations. Called on stream stop and process termination.
  """
  @callback cleanup_all_outputs(strategy_state()) :: :ok

  # -- Configuration --

  @doc """
  Build the stream config map sent to the frontend.
  Contains RTMP URL, stream keys, and status information.
  """
  @callback build_stream_config(strategy_state(), state_name :: atom()) :: map()

  @doc """
  Return the ingest credentials (RTMP URL, stream key, etc.) for the given orientation.
  """
  @callback get_ingest_credentials(strategy_state(), orientation :: atom()) ::
              {:ok, map()} | {:error, term()}

  @doc """
  Regenerate the ingest credentials for the given orientation.
  Returns the new credentials and updated strategy state.
  """
  @callback regenerate_ingest_credentials(strategy_state(), orientation :: atom()) ::
              {:ok, map(), strategy_state()} | {:error, term()}

  @doc """
  Handle input deletion/recreation. Called when the ingest endpoint is lost.
  """
  @callback handle_input_deletion(strategy_state()) ::
              {:reinitialize, strategy_state()} | :ok

  # -- Teardown --

  @doc """
  Called when the StreamManager process terminates.
  """
  @callback terminate(strategy_state()) :: :ok

  # -- Strategy Resolution --

  @doc """
  Resolve which strategy module to use for a given user.

  Currently reads from app config `:default_broadcast_strategy` (defaults to
  `:cloudflare`). Later this can be extended to read per-user settings.
  """
  @spec strategy_for_user(String.t()) :: module()
  def strategy_for_user(_user_id) do
    strategy = Application.get_env(:streampai, :default_broadcast_strategy, :cloudflare)
    strategy_module(strategy)
  end

  defp strategy_module(:cloudflare), do: __MODULE__.Cloudflare
  defp strategy_module(:membrane), do: __MODULE__.Membrane
end
