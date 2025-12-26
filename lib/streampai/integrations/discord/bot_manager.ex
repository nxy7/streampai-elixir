defmodule Streampai.Integrations.Discord.BotManager do
  @moduledoc """
  Manages Discord bot connections for users.

  Each user can have their own Discord bot. This module handles:
  - Starting/stopping bot connections
  - Fetching guild and channel information
  - Sending messages to Discord channels
  - Maintaining bot state

  Uses Nostrum for Discord API communication.
  """
  use GenServer

  alias Streampai.Integrations.DiscordActor

  require Logger

  @registry Streampai.Integrations.Discord.BotRegistry

  # Client API

  @doc """
  Starts the BotManager supervisor.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Starts a Discord bot for the given actor.
  """
  def start_bot(%DiscordActor{} = actor) do
    GenServer.call(__MODULE__, {:start_bot, actor})
  end

  @doc """
  Stops a Discord bot for the given actor.
  """
  def stop_bot(%DiscordActor{} = actor) do
    GenServer.call(__MODULE__, {:stop_bot, actor.id})
  end

  @doc """
  Fetches guilds (servers) the bot has access to.
  """
  def fetch_guilds(%DiscordActor{} = actor) do
    case get_bot_pid(actor.id) do
      {:ok, pid} ->
        GenServer.call(pid, :fetch_guilds)

      {:error, :not_running} ->
        # Try to fetch directly using the token
        fetch_guilds_direct(actor.bot_token)
    end
  end

  @doc """
  Fetches channels for a specific guild.
  """
  def fetch_channels(%DiscordActor{} = actor, guild_id) do
    case get_bot_pid(actor.id) do
      {:ok, pid} ->
        GenServer.call(pid, {:fetch_channels, guild_id})

      {:error, :not_running} ->
        fetch_channels_direct(actor.bot_token, guild_id)
    end
  end

  @doc """
  Sends a message to the configured announcement channel.
  """
  def send_announcement(%DiscordActor{} = actor, content, opts \\ []) do
    if actor.announcement_channel_id do
      send_message(actor, actor.announcement_channel_id, content, opts)
    else
      {:error, :no_channel_configured}
    end
  end

  @doc """
  Sends a message to a specific channel.
  """
  def send_message(%DiscordActor{} = actor, channel_id, content, opts \\ []) do
    embeds = Keyword.get(opts, :embeds, [])

    case get_bot_pid(actor.id) do
      {:ok, pid} ->
        GenServer.call(pid, {:send_message, channel_id, content, embeds})

      {:error, :not_running} ->
        send_message_direct(actor.bot_token, channel_id, content, embeds)
    end
  end

  @doc """
  Gets the PID of a running bot.
  """
  def get_bot_pid(actor_id) do
    case Registry.lookup(@registry, actor_id) do
      [{pid, _}] -> {:ok, pid}
      [] -> {:error, :not_running}
    end
  end

  @doc """
  Checks if a bot is currently running.
  """
  def bot_running?(actor_id) do
    case get_bot_pid(actor_id) do
      {:ok, _} -> true
      {:error, _} -> false
    end
  end

  # Server callbacks

  @impl true
  def init(_opts) do
    # Start the registry for tracking bot processes
    {:ok, %{bots: %{}}}
  end

  @impl true
  def handle_call({:start_bot, actor}, _from, state) do
    case start_bot_process(actor) do
      {:ok, pid} ->
        bots = Map.put(state.bots, actor.id, pid)
        {:reply, :ok, %{state | bots: bots}}

      {:error, reason} = error ->
        Logger.error("Failed to start bot for actor #{actor.id}: #{inspect(reason)}")
        {:reply, error, state}
    end
  end

  @impl true
  def handle_call({:stop_bot, actor_id}, _from, state) do
    case Map.get(state.bots, actor_id) do
      nil ->
        {:reply, :ok, state}

      pid ->
        Process.exit(pid, :shutdown)
        bots = Map.delete(state.bots, actor_id)
        {:reply, :ok, %{state | bots: bots}}
    end
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, reason}, state) do
    # Find and remove the bot that went down
    actor_id =
      Enum.find_value(state.bots, fn {id, p} ->
        if p == pid, do: id
      end)

    if actor_id do
      Logger.warning("Bot #{actor_id} went down: #{inspect(reason)}")
      bots = Map.delete(state.bots, actor_id)

      # Update actor status
      update_actor_status(actor_id, :disconnected, inspect(reason))

      {:noreply, %{state | bots: bots}}
    else
      {:noreply, state}
    end
  end

  # Private functions

  defp start_bot_process(actor) do
    # Start the bot worker
    case Streampai.Integrations.Discord.BotWorker.start_link(actor) do
      {:ok, pid} ->
        Process.monitor(pid)
        {:ok, pid}

      error ->
        error
    end
  end

  defp update_actor_status(actor_id, status, error \\ nil) do
    case Ash.get(DiscordActor, actor_id, authorize?: false) do
      {:ok, actor} ->
        attrs =
          if error do
            %{status: status, last_error: error, last_error_at: DateTime.utc_now()}
          else
            %{status: status}
          end

        Ash.update(actor, attrs, action: :update_status, authorize?: false)

      _ ->
        :ok
    end
  end

  # Direct API calls (without running bot process)

  defp fetch_guilds_direct(bot_token) do
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

  defp fetch_channels_direct(bot_token, guild_id) do
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

  defp send_message_direct(bot_token, channel_id, content, embeds) do
    headers = [
      {"Authorization", "Bot #{bot_token}"},
      {"Content-Type", "application/json"}
    ]

    body = maybe_add_embeds(%{content: content}, embeds)

    case Req.post("https://discord.com/api/v10/channels/#{channel_id}/messages",
           headers: headers,
           json: body
         ) do
      {:ok, %{status: status}} when status in 200..299 ->
        {:ok, :sent}

      {:ok, %{status: 429, body: body}} ->
        retry_after = body["retry_after"] || 5
        {:error, {:rate_limited, retry_after}}

      {:ok, %{status: status, body: body}} ->
        {:error, {:api_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp maybe_add_embeds(body, []), do: body
  defp maybe_add_embeds(body, embeds), do: Map.put(body, :embeds, embeds)
end
