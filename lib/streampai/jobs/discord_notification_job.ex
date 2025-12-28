defmodule Streampai.Jobs.DiscordNotificationJob do
  @moduledoc """
  Oban job that sends Discord webhook notifications asynchronously.

  This job handles sending notifications to Discord webhooks with:
  - Automatic retries with exponential backoff
  - Rate limit handling
  - Error tracking and logging
  - Delivery statistics updates
  """
  use Oban.Worker,
    queue: :default,
    max_attempts: 5,
    tags: ["discord", "notification"],
    unique: [period: 30, keys: [:webhook_id, :event_type, :event_id]]

  alias Ash.Error.Query.NotFound
  alias Streampai.Integrations.Discord.Client
  alias Streampai.Integrations.DiscordWebhook
  alias Streampai.SystemActor

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt}) do
    %{
      "webhook_id" => webhook_id,
      "event_type" => event_type,
      "data" => data
    } = args

    event_type_atom = String.to_existing_atom(event_type)
    event_id = Map.get(args, "event_id", "unknown")

    Logger.info("Processing Discord notification",
      webhook_id: webhook_id,
      event_type: event_type,
      event_id: event_id,
      attempt: attempt
    )

    case Ash.get(DiscordWebhook, webhook_id, actor: SystemActor.oban()) do
      {:ok, webhook} ->
        if webhook.is_enabled do
          send_and_track(webhook, event_type_atom, atomize_keys(data), attempt)
        else
          Logger.info("Webhook disabled, skipping notification", webhook_id: webhook_id)
          :ok
        end

      {:error, %Ash.Error.Invalid{errors: [%NotFound{} | _]}} ->
        Logger.warning("Webhook not found, skipping notification", webhook_id: webhook_id)
        :ok

      {:error, %NotFound{}} ->
        Logger.warning("Webhook not found, skipping notification", webhook_id: webhook_id)
        :ok

      {:error, error} ->
        Logger.error("Failed to fetch webhook", webhook_id: webhook_id, error: inspect(error))
        {:error, error}
    end
  end

  defp send_and_track(webhook, event_type, data, attempt) do
    case Client.send_notification(webhook, event_type, data) do
      {:ok, :sent} ->
        increment_success_counter(webhook)

        Logger.info("Discord notification sent successfully",
          webhook_id: webhook.id,
          event_type: event_type
        )

        :ok

      {:error, {:rate_limited, retry_after}} ->
        Logger.warning("Discord rate limited, will retry",
          webhook_id: webhook.id,
          retry_after: retry_after,
          attempt: attempt
        )

        # Schedule retry after the rate limit period
        {:snooze, retry_after}

      {:error, {:http_error, status, body}} ->
        record_error(webhook, "HTTP #{status}: #{inspect(body)}")

        if status in [400, 401, 403, 404] do
          # Don't retry client errors
          Logger.error("Discord notification failed with client error",
            webhook_id: webhook.id,
            status: status
          )

          :ok
        else
          {:error, "HTTP error: #{status}"}
        end

      {:error, reason} ->
        record_error(webhook, inspect(reason))
        {:error, reason}
    end
  end

  defp increment_success_counter(webhook) do
    Ash.update(
      webhook,
      %{
        successful_deliveries: webhook.successful_deliveries + 1,
        last_error: nil,
        last_error_at: nil
      },
      actor: SystemActor.oban()
    )
  rescue
    error ->
      Logger.warning("Failed to update success counter",
        webhook_id: webhook.id,
        error: inspect(error)
      )
  end

  defp record_error(webhook, error_message) do
    Ash.update(
      webhook,
      %{
        failed_deliveries: webhook.failed_deliveries + 1,
        last_error: String.slice(error_message, 0, 1000),
        last_error_at: DateTime.utc_now()
      },
      actor: SystemActor.oban()
    )
  rescue
    error ->
      Logger.warning("Failed to update error counter",
        webhook_id: webhook.id,
        error: inspect(error)
      )
  end

  @doc """
  Schedules a Discord notification job.

  ## Parameters
  - webhook_id: The ID of the DiscordWebhook to send to
  - event_type: The type of event (e.g., :donation, :stream_start)
  - data: A map of event data to include in the notification
  - opts: Optional parameters (e.g., event_id for deduplication)

  ## Examples

      DiscordNotificationJob.schedule("webhook-uuid", :donation, %{
        donor_name: "John",
        amount: "10.00",
        currency: "USD",
        message: "Great stream!"
      })
  """
  def schedule(webhook_id, event_type, data, opts \\ []) do
    event_id = Keyword.get(opts, :event_id, generate_event_id())

    %{
      webhook_id: webhook_id,
      event_type: to_string(event_type),
      data: stringify_keys(data),
      event_id: event_id
    }
    |> new()
    |> Oban.insert()
  end

  @doc """
  Schedules Discord notifications for all enabled webhooks of a user that are subscribed to the event type.

  ## Parameters
  - user_id: The user's ID
  - event_type: The type of event
  - data: Event data to include in notifications

  ## Examples

      DiscordNotificationJob.broadcast_to_user("user-uuid", :donation, %{
        donor_name: "John",
        amount: "10.00",
        currency: "USD"
      })
  """
  def broadcast_to_user(user_id, event_type, data) do
    case DiscordWebhook.get_enabled_by_user(user_id, actor: SystemActor.oban()) do
      {:ok, webhooks} ->
        event_id = generate_event_id()

        webhooks
        |> Enum.filter(fn webhook -> event_type in webhook.event_types end)
        |> Enum.map(fn webhook -> schedule(webhook.id, event_type, data, event_id: event_id) end)

      {:error, error} ->
        Logger.error("Failed to get webhooks for user", user_id: user_id, error: inspect(error))
        {:error, error}
    end
  end

  defp generate_event_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode16() |> String.downcase()
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn {k, v} ->
      key = if is_atom(k), do: Atom.to_string(k), else: k
      {key, stringify_keys(v)}
    end)
  end

  defp stringify_keys(list) when is_list(list), do: Enum.map(list, &stringify_keys/1)
  defp stringify_keys(value), do: value

  defp atomize_keys(map) when is_map(map) do
    Map.new(map, fn {k, v} ->
      key = if is_binary(k), do: String.to_existing_atom(k), else: k
      {key, atomize_keys(v)}
    end)
  rescue
    ArgumentError ->
      # If atom doesn't exist, keep as string map
      map
  end

  defp atomize_keys(list) when is_list(list), do: Enum.map(list, &atomize_keys/1)
  defp atomize_keys(value), do: value
end
