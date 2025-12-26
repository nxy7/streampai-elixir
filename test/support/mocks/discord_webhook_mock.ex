defmodule StreampaiTest.Mocks.DiscordWebhookMock do
  @moduledoc """
  Mock implementation for Discord webhook API.
  Provides predictable responses for testing without hitting Discord's servers.
  """
  use Agent

  @doc """
  Starts the mock agent with default state.
  """
  def start_link(_opts \\ []) do
    Agent.start_link(
      fn ->
        %{
          responses: %{},
          call_log: [],
          default_response: {:ok, :sent}
        }
      end,
      name: __MODULE__
    )
  end

  @doc """
  Sets the response that will be returned for webhook calls.

  ## Examples

      # Success response
      DiscordWebhookMock.set_response({:ok, :sent})

      # Rate limited response
      DiscordWebhookMock.set_response({:error, {:rate_limited, 5}})

      # HTTP error
      DiscordWebhookMock.set_response({:error, {:http_error, 400, %{"message" => "Invalid"}}})
  """
  def set_response(response) do
    Agent.update(__MODULE__, fn state ->
      %{state | default_response: response}
    end)
  end

  @doc """
  Sets a specific response for a specific webhook URL.
  """
  def set_response_for_url(url, response) do
    Agent.update(__MODULE__, fn state ->
      responses = Map.put(state.responses, url, response)
      %{state | responses: responses}
    end)
  end

  @doc """
  Gets the call log to verify what was sent.
  """
  def get_call_log do
    Agent.get(__MODULE__, fn state -> Enum.reverse(state.call_log) end)
  end

  @doc """
  Gets the last call made to the mock.
  """
  def get_last_call do
    Agent.get(__MODULE__, fn state ->
      case state.call_log do
        [last | _] -> last
        [] -> nil
      end
    end)
  end

  @doc """
  Resets all state.
  """
  def reset do
    Agent.update(__MODULE__, fn _state ->
      %{
        responses: %{},
        call_log: [],
        default_response: {:ok, :sent}
      }
    end)
  end

  @doc """
  Simulates sending a webhook. Called by the Discord client when mocking is enabled.
  """
  def send_webhook(url, payload) do
    call = %{
      url: url,
      payload: payload,
      timestamp: DateTime.utc_now()
    }

    Agent.get_and_update(__MODULE__, fn state ->
      call_log = [call | state.call_log]

      response =
        case Map.get(state.responses, url) do
          nil -> state.default_response
          specific -> specific
        end

      {response, %{state | call_log: call_log}}
    end)
  end

  @doc """
  Returns whether the mock is currently running.
  """
  def running? do
    case Process.whereis(__MODULE__) do
      nil -> false
      _pid -> true
    end
  end
end
