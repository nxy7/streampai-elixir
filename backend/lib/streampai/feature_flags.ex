defmodule Streampai.FeatureFlags do
  @moduledoc """
  Helper module for checking feature flags.

  Feature flags control system-wide features that can be enabled or disabled
  without requiring code deployment. This module provides a simple interface
  for checking if features are enabled.
  """

  alias Streampai.System.FeatureFlag

  @doc """
  Check if a feature flag is enabled.

  Returns true if the feature flag exists and is enabled, false otherwise.
  Uses atoms for convenience but internally converts to strings for database storage.

  ## Examples

      iex> Streampai.FeatureFlags.enabled?(:donation_module)
      true

      iex> Streampai.FeatureFlags.enabled?(:non_existent_feature)
      false
  """
  @spec enabled?(atom() | String.t()) :: boolean()
  def enabled?(feature_name) when is_atom(feature_name) do
    enabled?(to_string(feature_name))
  end

  def enabled?(feature_name) when is_binary(feature_name) do
    case FeatureFlag.get_by_id(feature_name) do
      {:ok, feature_flag} -> feature_flag.enabled
      {:error, _} -> false
    end
  end

  @doc """
  Enable a feature flag.

  Creates the feature flag if it doesn't exist, or updates it to enabled if it does.

  ## Examples

      iex> Streampai.FeatureFlags.enable(:donation_module)
      {:ok, %FeatureFlag{id: "donation_module", enabled: true}}
  """
  @spec enable(atom() | String.t()) :: {:ok, FeatureFlag.t()} | {:error, any()}
  def enable(feature_name) when is_atom(feature_name) do
    enable(to_string(feature_name))
  end

  def enable(feature_name) when is_binary(feature_name) do
    case FeatureFlag.get_by_id(feature_name) do
      {:ok, feature_flag} ->
        FeatureFlag.update(feature_flag, %{enabled: true})

      {:error, _} ->
        FeatureFlag.create(%{id: feature_name, enabled: true})
    end
  end

  @doc """
  Disable a feature flag.

  Updates the feature flag to disabled if it exists.
  Does nothing if the feature flag doesn't exist.

  ## Examples

      iex> Streampai.FeatureFlags.disable(:donation_module)
      {:ok, %FeatureFlag{id: "donation_module", enabled: false}}
  """
  @spec disable(atom() | String.t()) :: {:ok, FeatureFlag.t()} | {:error, any()}
  def disable(feature_name) when is_atom(feature_name) do
    disable(to_string(feature_name))
  end

  def disable(feature_name) when is_binary(feature_name) do
    case FeatureFlag.get_by_id(feature_name) do
      {:ok, feature_flag} ->
        FeatureFlag.update(feature_flag, %{enabled: false})

      {:error, _} ->
        {:ok, nil}
    end
  end

  @doc """
  Toggle a feature flag.

  Enables the flag if it's disabled (or doesn't exist), disables it if it's enabled.

  ## Examples

      iex> Streampai.FeatureFlags.toggle(:donation_module)
      {:ok, %FeatureFlag{id: "donation_module", enabled: true}}
  """
  @spec toggle(atom() | String.t()) :: {:ok, FeatureFlag.t()} | {:error, any()}
  def toggle(feature_name) do
    if enabled?(feature_name) do
      disable(feature_name)
    else
      enable(feature_name)
    end
  end

  @doc """
  Get all feature flags.

  Returns a list of all feature flags in the system.

  ## Examples

      iex> Streampai.FeatureFlags.list()
      [%FeatureFlag{id: "donation_module", enabled: true}]
  """
  @spec list() :: [FeatureFlag.t()]
  def list do
    case FeatureFlag.read() do
      {:ok, flags} -> flags
      {:error, _} -> []
    end
  end
end