defmodule Streampai.Integrations.Discord.BotWorker do
  @moduledoc """
  Individual bot worker that manages a single Discord bot connection.

  Each user's bot runs as a separate process, allowing independent
  connection management and message handling.
  """
  use GenServer

  alias Streampai.Integrations.DiscordActor

  require Logger

  @registry Streampai.Integrations.Discord.BotRegistry

  # Client API

  def start_link(%DiscordActor{} = actor) do
    GenServer.start_link(__MODULE__, actor, name: via_tuple(actor.id))
  end

  def via_tuple(actor_id) do
    {:via, Registry, {@registry, actor_id}}
  end

  # Server callbacks

  @impl true
  def init(actor) do
    Logger.info("Starting Discord bot worker for actor #{actor.id}")

    bot_token = DiscordActor.get_bot_token(actor)

    state = %{
      actor_id: actor.id,
      bot_token: bot_token,
      status: :connecting,
      guilds: [],
      channels: %{}
    }

    # Fetch initial guild data
    send(self(), :initial_sync)

    {:ok, state}
  end

  @impl true
  def handle_info(:initial_sync, state) do
    case fetch_guilds_with_channels(state.bot_token) do
      {:ok, guilds, channels} ->
        update_actor_state(state.actor_id, guilds, channels)

        {:noreply, %{state | status: :connected, guilds: guilds, channels: channels}}

      {:error, reason} ->
        Logger.error("Failed to sync guilds for actor #{state.actor_id}: #{inspect(reason)}")
        update_actor_error(state.actor_id, inspect(reason))
        {:noreply, %{state | status: :error}}
    end
  end

  @impl true
  def handle_call(:fetch_guilds, _from, state) do
    case fetch_guilds_api(state.bot_token) do
      {:ok, guilds} ->
        {:reply, {:ok, guilds}, %{state | guilds: guilds}}

      error ->
        {:reply, error, state}
    end
  end

  @impl true
  def handle_call({:fetch_channels, guild_id}, _from, state) do
    case fetch_channels_api(state.bot_token, guild_id) do
      {:ok, channels} ->
        updated_channels = Map.put(state.channels, guild_id, channels)
        {:reply, {:ok, channels}, %{state | channels: updated_channels}}

      error ->
        {:reply, error, state}
    end
  end

  @impl true
  def handle_call({:send_message, channel_id, content, embeds}, _from, state) do
    result = send_message_api(state.bot_token, channel_id, content, embeds)

    if match?({:ok, _}, result) do
      increment_message_count(state.actor_id)
    end

    {:reply, result, state}
  end

  @impl true
  def handle_call(:get_status, _from, state) do
    {:reply, state.status, state}
  end

  # Private functions

  defp fetch_guilds_with_channels(bot_token) do
    with {:ok, guilds} <- fetch_guilds_api(bot_token) do
      channels =
        Enum.reduce(guilds, %{}, fn guild, acc ->
          case fetch_channels_api(bot_token, guild["id"]) do
            {:ok, guild_channels} -> Map.put(acc, guild["id"], guild_channels)
            _ -> acc
          end
        end)

      {:ok, guilds, channels}
    end
  end

  defp fetch_guilds_api(bot_token) do
    headers = [{"Authorization", "Bot #{bot_token}"}]

    case Req.get("https://discord.com/api/v10/users/@me/guilds", headers: headers) do
      {:ok, %{status: 200, body: guilds}} ->
        formatted =
          Enum.map(guilds, fn g ->
            %{
              "id" => g["id"],
              "name" => g["name"],
              "icon" => g["icon"]
            }
          end)

        {:ok, formatted}

      {:ok, %{status: status, body: body}} ->
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch_channels_api(bot_token, guild_id) do
    headers = [{"Authorization", "Bot #{bot_token}"}]

    case Req.get("https://discord.com/api/v10/guilds/#{guild_id}/channels", headers: headers) do
      {:ok, %{status: 200, body: channels}} ->
        # Filter to text channels only (type 0)
        formatted =
          channels
          |> Enum.filter(fn c -> c["type"] == 0 end)
          |> Enum.map(fn c ->
            %{
              "id" => c["id"],
              "name" => c["name"],
              "type" => c["type"],
              "position" => c["position"]
            }
          end)
          |> Enum.sort_by(& &1["position"])

        {:ok, formatted}

      {:ok, %{status: status, body: body}} ->
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp send_message_api(bot_token, channel_id, content, embeds) do
    headers = [
      {"Authorization", "Bot #{bot_token}"},
      {"Content-Type", "application/json"}
    ]

    body =
      %{}
      |> maybe_add_content(content)
      |> maybe_add_embeds(embeds)

    case Req.post("https://discord.com/api/v10/channels/#{channel_id}/messages",
           headers: headers,
           json: body
         ) do
      {:ok, %{status: status, body: response}} when status in 200..299 ->
        {:ok, response}

      {:ok, %{status: 429, body: body}} ->
        retry_after = body["retry_after"] || 5
        {:error, {:rate_limited, retry_after}}

      {:ok, %{status: status, body: body}} ->
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp maybe_add_content(body, nil), do: body
  defp maybe_add_content(body, ""), do: body
  defp maybe_add_content(body, content), do: Map.put(body, :content, content)

  defp maybe_add_embeds(body, nil), do: body
  defp maybe_add_embeds(body, []), do: body
  defp maybe_add_embeds(body, embeds), do: Map.put(body, :embeds, embeds)

  defp update_actor_state(actor_id, guilds, channels) do
    case Ash.get(DiscordActor, actor_id, authorize?: false) do
      {:ok, actor} ->
        Ash.update(
          actor,
          %{guilds: guilds, channels: channels, last_synced_at: DateTime.utc_now()},
          action: :update_actor_state,
          authorize?: false
        )

      _ ->
        :ok
    end
  end

  defp update_actor_error(actor_id, error) do
    case Ash.get(DiscordActor, actor_id, authorize?: false) do
      {:ok, actor} ->
        Ash.update(actor, %{status: :error, last_error: error, last_error_at: DateTime.utc_now()},
          action: :update_status,
          authorize?: false
        )

      _ ->
        :ok
    end
  end

  defp increment_message_count(actor_id) do
    case Ash.get(DiscordActor, actor_id, authorize?: false) do
      {:ok, actor} ->
        Ash.update(actor, %{},
          action: :record_message_sent,
          authorize?: false
        )

      _ ->
        :ok
    end
  end
end
