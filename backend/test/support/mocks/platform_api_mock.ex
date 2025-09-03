defmodule StreampaiTest.Mocks.PlatformAPIMock do
  @moduledoc """
  Mock implementation for platform APIs (Twitch, YouTube, etc.).
  Provides predictable responses for testing.
  """
  use GenServer

  @doc """
  Starts the mock API server.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    state = %{
      responses: %{},
      call_log: [],
      delays: %{}
    }
    {:ok, state}
  end

  # Client API

  @doc """
  Sets a mock response for a specific API call.
  """
  def set_response(server \\ __MODULE__, platform, method, response) do
    GenServer.cast(server, {:set_response, platform, method, response})
  end

  @doc """
  Sets a delay for API calls to simulate network latency.
  """
  def set_delay(server \\ __MODULE__, platform, method, delay_ms) do
    GenServer.cast(server, {:set_delay, platform, method, delay_ms})
  end

  @doc """
  Gets the call log for testing assertions.
  """
  def get_call_log(server \\ __MODULE__) do
    GenServer.call(server, :get_call_log)
  end

  @doc """
  Clears call log and responses.
  """
  def reset(server \\ __MODULE__) do
    GenServer.cast(server, :reset)
  end

  @doc """
  Simulates a platform API call.
  """
  def call_api(server \\ __MODULE__, platform, method, params \\ %{}) do
    GenServer.call(server, {:call_api, platform, method, params}, 10_000)
  end

  # Server callbacks

  @impl true
  def handle_cast({:set_response, platform, method, response}, state) do
    key = {platform, method}
    responses = Map.put(state.responses, key, response)
    {:noreply, %{state | responses: responses}}
  end

  @impl true
  def handle_cast({:set_delay, platform, method, delay_ms}, state) do
    key = {platform, method}
    delays = Map.put(state.delays, key, delay_ms)
    {:noreply, %{state | delays: delays}}
  end

  @impl true
  def handle_cast(:reset, state) do
    {:noreply, %{state | responses: %{}, call_log: [], delays: %{}}}
  end

  @impl true
  def handle_call(:get_call_log, _from, state) do
    {:reply, Enum.reverse(state.call_log), state}
  end

  @impl true
  def handle_call({:call_api, platform, method, params}, _from, state) do
    # Log the call
    call_entry = %{
      platform: platform,
      method: method,
      params: params,
      timestamp: DateTime.utc_now()
    }
    call_log = [call_entry | state.call_log]
    
    # Apply delay if configured
    key = {platform, method}
    if delay = state.delays[key] do
      Process.sleep(delay)
    end
    
    # Return configured response or default
    response = case state.responses[key] do
      nil -> default_response(platform, method, params)
      response -> response
    end
    
    {:reply, response, %{state | call_log: call_log}}
  end

  # Default responses for different platforms/methods
  defp default_response(:twitch, :send_chat, _params) do
    {:ok, %{message_id: "msg_#{:rand.uniform(10000)}"}}
  end

  defp default_response(:twitch, :get_stream_info, _params) do
    {:ok, %{
      viewer_count: :rand.uniform(1000),
      title: "Mock Stream Title",
      game_name: "Software Development",
      started_at: DateTime.utc_now() |> DateTime.add(-3600)
    }}
  end

  defp default_response(:twitch, :update_stream_info, params) do
    {:ok, %{
      title: params[:title] || "Updated Title",
      game_name: params[:game_name] || "Just Chatting"
    }}
  end

  defp default_response(:youtube, :send_chat, _params) do
    {:ok, %{message_id: "yt_msg_#{:rand.uniform(10000)}"}}
  end

  defp default_response(:youtube, :get_stream_info, _params) do
    {:ok, %{
      concurrent_viewers: :rand.uniform(500),
      title: "YouTube Mock Stream"
    }}
  end

  defp default_response(platform, method, _params) do
    {:error, {:not_implemented, platform, method}}
  end
end