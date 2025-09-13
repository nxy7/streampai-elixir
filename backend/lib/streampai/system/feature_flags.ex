defmodule Streampai.System.FeatureFlags do
  @moduledoc """
  Convenience functions for feature flag operations.

  This module provides simple functions that handle atom-to-string conversion
  for the FeatureFlag resource.
  """

  alias Streampai.System.FeatureFlag

  @doc """
  Check if a feature flag is enabled.

  Returns true if the flag exists and is enabled, false otherwise.
  """
  def enabled?(flag_name) do
    normalized_name = normalize_name(flag_name)

    case FeatureFlag.enabled?(normalized_name, actor: system_actor()) do
      {:ok, _record} -> true
      {:error, _} -> false
    end
  end

  @doc """
  Enable a feature flag.
  """
  def enable(flag_name) do
    normalized_name = normalize_name(flag_name)
    FeatureFlag.enable(normalized_name, actor: system_actor())
  end

  @doc """
  Disable a feature flag.
  """
  def disable(flag_name) do
    normalized_name = normalize_name(flag_name)
    FeatureFlag.disable(normalized_name, actor: system_actor())
  end

  @doc """
  Toggle a feature flag.
  """
  def toggle(flag_name) do
    normalized_name = normalize_name(flag_name)
    FeatureFlag.toggle(normalized_name, actor: system_actor())
  end

  defp system_actor, do: %{role: :system}

  defp normalize_name(name) when is_atom(name), do: to_string(name)
  defp normalize_name(name) when is_binary(name), do: name
end