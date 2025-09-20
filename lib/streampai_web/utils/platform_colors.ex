defmodule StreampaiWeb.Utils.PlatformColors do
  @moduledoc """
  Utilities for getting platform brand colors.
  """

  @doc """
  Returns the brand color for a given platform.
  """
  def get_platform_color(:twitch), do: "#9146FF"
  def get_platform_color(:youtube), do: "#FF0000"
  def get_platform_color(:facebook), do: "#1877F2"
  def get_platform_color(:kick), do: "#53FC18"
  def get_platform_color(_), do: "#6B7280"
end
