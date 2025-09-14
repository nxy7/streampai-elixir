defmodule Streampai.Fake.ViewerCount do
  @moduledoc """
  Utility module for generating fake viewer count data for testing and demonstration purposes.
  Provides realistic viewer counts with platform breakdown.
  """

  alias Streampai.Fake.Base
  alias StreampaiWeb.Utils.PlatformUtils

  @platforms [:twitch, :youtube, :kick, :facebook]

  def default_config do
    %{
      show_total: true,
      show_platforms: true,
      font_size: "medium",
      display_style: "detailed",
      animation_enabled: true
    }
  end

  def generate_viewer_data do
    active_platforms = generate_active_platforms()

    platform_breakdown =
      Enum.reduce(active_platforms, %{}, fn platform, acc ->
        viewer_count = generate_platform_viewer_count()
        platform_name = Atom.to_string(platform)

        platform_data = %{
          icon: platform_name,
          color: PlatformUtils.platform_color(platform),
          viewers: viewer_count
        }

        Map.put(acc, platform_name, platform_data)
      end)

    total_viewers =
      Enum.reduce(platform_breakdown, 0, fn {_platform, data}, acc ->
        acc + data.viewers
      end)

    %{
      id: Base.generate_hex_id(),
      total_viewers: total_viewers,
      platform_breakdown: platform_breakdown,
      timestamp: DateTime.utc_now()
    }
  end

  defp generate_active_platforms do
    num_platforms = Enum.random(2..4)

    @platforms
    |> Enum.shuffle()
    |> Enum.take(num_platforms)
  end

  # Generates realistic viewer count distribution: 60% small, 25% medium, 10% large, 5% very large
  defp generate_platform_viewer_count do
    case Enum.random(1..100) do
      n when n <= 60 -> Enum.random(1..50)
      n when n <= 85 -> Enum.random(51..200)
      n when n <= 95 -> Enum.random(201..1000)
      _ -> Enum.random(1001..10_000)
    end
  end

  def generate_viewer_update(current_data) do
    updated_breakdown =
      Enum.reduce(current_data.platform_breakdown, %{}, fn {platform, data}, acc ->
        # Apply realistic viewer fluctuation: -20% to +30%
        change_factor = Enum.random(80..130) / 100.0
        new_viewers = max(1, round(data.viewers * change_factor))

        updated_data = Map.put(data, :viewers, new_viewers)
        Map.put(acc, platform, updated_data)
      end)

    new_total =
      Enum.reduce(updated_breakdown, 0, fn {_platform, data}, acc ->
        acc + data.viewers
      end)

    %{
      current_data
      | platform_breakdown: updated_breakdown,
        total_viewers: new_total,
        timestamp: DateTime.utc_now()
    }
  end
end
