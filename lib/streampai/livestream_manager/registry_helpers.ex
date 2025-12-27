defmodule Streampai.LivestreamManager.RegistryHelpers do
  @moduledoc """
  Shared utilities for GenServer registry lookups in the LivestreamManager.

  This module consolidates the duplicated via_tuple and get_registry_name patterns
  that were scattered across multiple manager modules.
  """

  @default_registry Streampai.LivestreamManager.Registry

  @doc """
  Returns the appropriate registry module, supporting test mode overrides.

  In test mode, checks `Process.get(:test_registry_name)` for a per-test registry.
  This allows tests to run in isolation with their own registry.
  """
  @spec get_registry_name() :: module()
  def get_registry_name do
    if Application.get_env(:streampai, :test_mode, false) do
      case Process.get(:test_registry_name) do
        nil -> @default_registry
        test_registry -> test_registry
      end
    else
      @default_registry
    end
  end

  @doc """
  Creates a via tuple for registering a GenServer with the appropriate registry.

  ## Examples

      # For a manager with a simple key
      via_tuple(:cloudflare_manager, user_id)
      # Returns {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}}

      # For a platform manager with platform key
      via_tuple(:platform_manager, user_id, :twitch)
      # Returns {:via, Registry, {Streampai.LivestreamManager.Registry, {:platform_manager, user_id, :twitch}}}
  """
  @spec via_tuple(atom(), String.t()) :: {:via, Registry, {module(), {atom(), String.t()}}}
  def via_tuple(key, user_id) when is_atom(key) and is_binary(user_id) do
    {:via, Registry, {get_registry_name(), {key, user_id}}}
  end

  @spec via_tuple(atom(), String.t(), atom()) ::
          {:via, Registry, {module(), {atom(), String.t(), atom()}}}
  def via_tuple(key, user_id, platform) when is_atom(key) and is_binary(user_id) and is_atom(platform) do
    {:via, Registry, {get_registry_name(), {key, user_id, platform}}}
  end

  @doc """
  Looks up a process by its registry key.

  ## Examples

      lookup(:cloudflare_manager, user_id)
      # Returns {:ok, pid} or :error
  """
  @spec lookup(atom(), String.t()) :: {:ok, pid()} | :error
  def lookup(key, user_id) when is_atom(key) and is_binary(user_id) do
    case Registry.lookup(get_registry_name(), {key, user_id}) do
      [{pid, _}] -> {:ok, pid}
      [] -> :error
    end
  end

  @spec lookup(atom(), String.t(), atom()) :: {:ok, pid()} | :error
  def lookup(key, user_id, platform) when is_atom(key) and is_binary(user_id) and is_atom(platform) do
    case Registry.lookup(get_registry_name(), {key, user_id, platform}) do
      [{pid, _}] -> {:ok, pid}
      [] -> :error
    end
  end
end
