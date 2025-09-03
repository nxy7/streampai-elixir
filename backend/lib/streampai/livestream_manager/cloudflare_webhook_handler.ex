defmodule Streampai.LivestreamManager.CloudflareWebhookHandler do
  @moduledoc """
  Handles webhooks from Cloudflare for live streaming events.
  Processes stream status changes, connection events, etc.
  """
  use GenServer
  require Logger

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, Keyword.put_new(opts, :name, __MODULE__))
  end

  @impl true
  def init(:ok) do
    Logger.info("CloudflareWebhookHandler started")
    {:ok, %{}}
  end

  # Client API

  @doc """
  Processes a webhook event from Cloudflare.
  """
  def handle_webhook(event_data) do
    GenServer.cast(__MODULE__, {:handle_webhook, event_data})
  end

  # Server callbacks

  @impl true
  def handle_cast({:handle_webhook, event_data}, state) do
    process_webhook_event(event_data)
    {:noreply, state}
  end

  # Helper functions

  defp process_webhook_event(%{"type" => "live_input.connected", "data" => data}) do
    Logger.info("Live input connected: #{inspect(data)}")
    
    # Find user by input ID and update stream state
    if input_id = data["uid"] do
      broadcast_stream_status_change(input_id, :connected)
    end
  end

  defp process_webhook_event(%{"type" => "live_input.disconnected", "data" => data}) do
    Logger.info("Live input disconnected: #{inspect(data)}")
    
    if input_id = data["uid"] do
      broadcast_stream_status_change(input_id, :disconnected)
    end
  end

  defp process_webhook_event(event_data) do
    Logger.debug("Unknown webhook event: #{inspect(event_data)}")
  end

  defp broadcast_stream_status_change(input_id, status) do
    # This would need to map input_id to user_id in a real implementation
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "cloudflare_events",
      {:input_status_changed, input_id, status}
    )
  end
end