defmodule StreampaiWeb.AlertboxChannel do
  @moduledoc """
  Phoenix Channel for real-time alert events to alertbox widgets.

  Widgets join the channel with their user_id and receive alert events
  that include donation, follow, subscription, raid, and other events
  with TTS audio URLs when available.

  ## Topics

  - "alertbox:<user_id>" - Alert events for a specific user's alertbox widget

  ## Events

  Outgoing events pushed to clients:
  - "alert_event" - New alert to display (donation, follow, etc.)
  - "queue_update" - Queue state changes (paused, cleared, etc.)
  """
  use Phoenix.Channel

  alias Phoenix.PubSub
  alias Streampai.LivestreamManager.AlertQueue
  alias Streampai.LivestreamManager.RegistryHelpers

  require Logger

  @impl true
  def join("alertbox:" <> user_id, _params, socket) do
    Logger.info("Alertbox widget connected", user_id: user_id)

    # Subscribe to PubSub topics for this user's alerts
    :ok = PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")
    :ok = PubSub.subscribe(Streampai.PubSub, "alertqueue:#{user_id}")

    # Ensure AlertQueue is started for this user
    ensure_alert_queue_started(user_id)

    socket = assign(socket, :user_id, user_id)
    {:ok, socket}
  end

  # Handle alert events from PubSub (from AlertQueue)
  @impl true
  def handle_info({:alert_event, event}, socket) do
    Logger.info("Pushing alert event to widget",
      user_id: socket.assigns.user_id,
      event_type: event[:type],
      has_tts: event[:tts_url] != nil
    )

    push(socket, "alert_event", transform_event(event))
    {:noreply, socket}
  end

  # Handle queue updates from PubSub
  @impl true
  def handle_info({:queue_update, queue_data}, socket) do
    push(socket, "queue_update", queue_data)
    {:noreply, socket}
  end

  # Handle donation events directly broadcasted to alertbox topic
  # This happens from DonationTtsJob
  @impl true
  def handle_info({:new_donation, event}, socket) do
    Logger.info("Pushing donation event to widget",
      user_id: socket.assigns.user_id,
      donor: event[:donor_name],
      has_tts: event[:tts_url] != nil
    )

    push(socket, "alert_event", transform_event(event))
    {:noreply, socket}
  end

  # Catch-all for other PubSub messages
  @impl true
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  # Client can request to skip current alert
  @impl true
  def handle_in("skip", _params, socket) do
    user_id = socket.assigns.user_id

    case get_alert_queue(user_id) do
      {:ok, pid} ->
        AlertQueue.skip_event(pid)
        {:reply, :ok, socket}

      :error ->
        {:reply, {:error, %{reason: "queue_not_found"}}, socket}
    end
  end

  # Client can pause the queue
  @impl true
  def handle_in("pause", _params, socket) do
    user_id = socket.assigns.user_id

    case get_alert_queue(user_id) do
      {:ok, pid} ->
        AlertQueue.pause_queue(pid)
        {:reply, :ok, socket}

      :error ->
        {:reply, {:error, %{reason: "queue_not_found"}}, socket}
    end
  end

  # Client can resume the queue
  @impl true
  def handle_in("resume", _params, socket) do
    user_id = socket.assigns.user_id

    case get_alert_queue(user_id) do
      {:ok, pid} ->
        AlertQueue.resume_queue(pid)
        {:reply, :ok, socket}

      :error ->
        {:reply, {:error, %{reason: "queue_not_found"}}, socket}
    end
  end

  # Client can clear the queue
  @impl true
  def handle_in("clear", _params, socket) do
    user_id = socket.assigns.user_id

    case get_alert_queue(user_id) do
      {:ok, pid} ->
        AlertQueue.clear_queue(pid)
        {:reply, :ok, socket}

      :error ->
        {:reply, {:error, %{reason: "queue_not_found"}}, socket}
    end
  end

  # Private helpers

  defp ensure_alert_queue_started(user_id) do
    case get_alert_queue(user_id) do
      {:ok, _pid} ->
        :ok

      :error ->
        # Start the AlertQueue for this user via the DynamicSupervisor
        case Streampai.LivestreamManager.DynamicSupervisor.start_alert_queue(user_id) do
          {:ok, _pid} -> :ok
          {:error, {:already_started, _pid}} -> :ok
          {:error, reason} -> Logger.error("Failed to start AlertQueue: #{inspect(reason)}")
        end
    end
  end

  defp get_alert_queue(user_id) do
    RegistryHelpers.lookup(:alert_queue, user_id)
  end

  defp transform_event(event) when is_map(event) do
    # Convert atom keys to strings and ensure consistent format
    %{
      "id" => to_string(event[:id] || generate_event_id()),
      "type" => to_string(event[:type] || "donation"),
      "username" => event[:donor_name] || event[:username] || "Anonymous",
      "message" => event[:message],
      "amount" => event[:amount],
      "currency" => event[:currency],
      "ttsUrl" => event[:tts_url],
      "timestamp" => format_timestamp(event[:timestamp]),
      "platform" => %{
        "icon" => to_string(event[:platform] || "twitch"),
        "color" => get_platform_color(event[:platform])
      }
    }
  end

  defp generate_event_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode16() |> String.downcase()
  end

  defp format_timestamp(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_timestamp(_), do: DateTime.to_iso8601(DateTime.utc_now())

  defp get_platform_color(:twitch), do: "#9146FF"
  defp get_platform_color(:youtube), do: "#FF0000"
  defp get_platform_color(:paypal), do: "#003087"
  defp get_platform_color(:web), do: "#10B981"
  defp get_platform_color(_), do: "#6B7280"
end
