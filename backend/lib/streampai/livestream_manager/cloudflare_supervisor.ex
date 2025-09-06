defmodule Streampai.LivestreamManager.CloudflareSupervisor do
  @moduledoc """
  Supervisor for Cloudflare-related processes.
  Manages global Cloudflare connections and API rate limiting.
  """
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    children = [
      # Global Cloudflare API client with rate limiting
      Streampai.Cloudflare.APIClient,

      # Cloudflare webhook handler for live stream events
      Streampai.LivestreamManager.CloudflareWebhookHandler
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
