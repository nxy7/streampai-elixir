defmodule StreampaiWeb.Utils.ColorUtils do
  @moduledoc """
  Utilities for generating consistent colors based on input strings.

  Provides stable color generation using HSL color space where the hue
  is derived from the input string hash while keeping saturation and
  lightness optimized for readability.
  """

  @doc """
  Generates a stable HSL-based CSS color string for inline styles.

  The hue is derived from the string hash, ensuring the same input
  always produces the same color. Saturation and lightness are fixed
  for optimal readability on dark backgrounds.

  ## Examples

      iex> ColorUtils.username_color("Alice")
      "hsl(155, 70%, 65%)"

      iex> ColorUtils.username_color("Bob")
      "hsl(9, 70%, 65%)"
  """
  def username_color(username) when is_binary(username) do
    hue = username_to_hue(username)
    "hsl(#{hue}, 70%, 65%)"
  end

  @doc """
  Converts a username string to a stable hue value (0-359 degrees).

  Uses Erlang's :erlang.phash2/2 for consistent hashing across sessions.
  """
  def username_to_hue(username) when is_binary(username) do
    # Use phash2 for consistent hashing, modulo 360 for hue range
    :erlang.phash2(username, 360)
  end
end
