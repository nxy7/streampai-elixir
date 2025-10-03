defmodule Streampai.YouTube.TokenSupervisor do
  @moduledoc """
  DynamicSupervisor for YouTube token managers.

  Manages TokenManager processes, one per user with YouTube integration.
  """

  use DynamicSupervisor

  require Logger

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @doc """
  Starts a token manager for a user.
  """
  def start_token_manager(user_id, config) do
    child_spec = {Streampai.YouTube.TokenManager, {user_id, config}}

    case DynamicSupervisor.start_child(__MODULE__, child_spec) do
      {:ok, pid} ->
        Logger.info("Started token manager for user #{user_id}")
        {:ok, pid}

      {:error, {:already_started, pid}} ->
        Logger.debug("Token manager already running for user #{user_id}")
        {:ok, pid}

      {:error, reason} = error ->
        Logger.error("Failed to start token manager: #{inspect(reason)}")
        error
    end
  end

  @doc """
  Stops a token manager for a user.
  """
  def stop_token_manager(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:youtube_token, user_id}) do
      [{pid, _}] ->
        DynamicSupervisor.terminate_child(__MODULE__, pid)

      [] ->
        :ok
    end
  end

  @doc """
  Gets or starts a token manager for a user.
  """
  def ensure_token_manager(user_id, config) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:youtube_token, user_id}) do
      [{pid, _}] ->
        {:ok, pid}

      [] ->
        start_token_manager(user_id, config)
    end
  end
end
