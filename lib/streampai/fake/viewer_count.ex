defmodule Streampai.Fake.ViewerCount do
  @moduledoc """
  Utility module for generating fake viewer count data for testing and demonstration purposes.
  Provides realistic viewer counts with platform breakdown.
  """

  alias Streampai.Fake.Base

  @platforms %{
    "twitch" => %{
      icon: "twitch",
      color: "bg-purple-500"
    },
    "youtube" => %{
      icon: "youtube",
      color: "bg-red-500"
    },
    "kick" => %{
      icon: "kick",
      color: "bg-green-500"
    },
    "facebook" => %{
      icon: "facebook",
      color: "bg-blue-600"
    }
  }

  def default_config do
    %{
      show_total: true,
      show_platforms: true,
      update_interval: 3,
      font_size: "medium",
      display_style: "detailed",
      animation_enabled: true
    }
  end

  def generate_viewer_data do
    # Generate a realistic distribution of viewers across platforms
    active_platforms = generate_active_platforms()

    platform_breakdown =
      Enum.reduce(active_platforms, %{}, fn platform, acc ->
        viewer_count = generate_platform_viewer_count()
        platform_data = Map.get(@platforms, platform)

        Map.put(acc, platform, Map.put(platform_data, :viewers, viewer_count))
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

  # Generate 1-3 active platforms randomly
  defp generate_active_platforms do
    platform_keys = Map.keys(@platforms)
    num_platforms = Enum.random(1..3)

    platform_keys
    |> Enum.shuffle()
    |> Enum.take(num_platforms)
  end

  # Generate realistic viewer counts with some platforms having more viewers
  defp generate_platform_viewer_count do
    # Weight towards lower numbers but allow for big streams occasionally
    case Enum.random(1..100) do
      # Small streams (1-50)
      n when n <= 60 -> Enum.random(1..50)
      # Medium streams (51-200)
      n when n <= 85 -> Enum.random(51..200)
      # Large streams (201-1000)
      n when n <= 95 -> Enum.random(201..1000)
      # Very large streams (1000+)
      _ -> Enum.random(1001..10_000)
    end
  end

  # Generate a variation of current viewer data (for realistic changes)
  def generate_viewer_update(current_data) do
    updated_breakdown =
      Enum.reduce(current_data.platform_breakdown, %{}, fn {platform, data}, acc ->
        # Randomly change viewer count by -20% to +30%
        change_factor = Enum.random(80..130) / 100.0
        new_viewers = max(0, round(data.viewers * change_factor))

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
