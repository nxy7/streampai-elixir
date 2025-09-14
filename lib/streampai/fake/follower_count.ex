defmodule Streampai.Fake.FollowerCount do
  @moduledoc """
  Utility module for generating fake follower count data for testing and demonstration purposes.
  Provides realistic follower counts with platform breakdown.
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
      animation_enabled: true,
      total_label: "Total followers",
      icon_color: "#9333ea"
    }
  end

  def generate_follower_data do
    active_platforms = generate_active_platforms()

    platform_breakdown =
      Enum.reduce(active_platforms, %{}, fn platform, acc ->
        follower_count = generate_platform_follower_count()
        platform_name = Atom.to_string(platform)

        platform_data = %{
          icon: platform_name,
          color: PlatformUtils.platform_color(platform),
          followers: follower_count
        }

        Map.put(acc, platform_name, platform_data)
      end)

    total_followers =
      Enum.reduce(platform_breakdown, 0, fn {_platform, data}, acc ->
        acc + data.followers
      end)

    %{
      id: Base.generate_hex_id(),
      total_followers: total_followers,
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

  defp generate_platform_follower_count do
    case Enum.random(1..100) do
      n when n <= 40 -> Enum.random(50..500)
      n when n <= 70 -> Enum.random(501..2_000)
      n when n <= 90 -> Enum.random(2_001..10_000)
      _ -> Enum.random(10_001..100_000)
    end
  end

  def generate_follower_update(current_data) do
    updated_breakdown =
      Enum.reduce(current_data.platform_breakdown, %{}, fn {platform, data}, acc ->
        change_factor = Enum.random(95..115) / 100.0
        new_followers = max(1, round(data.followers * change_factor))

        updated_data = Map.put(data, :followers, new_followers)
        Map.put(acc, platform, updated_data)
      end)

    new_total =
      Enum.reduce(updated_breakdown, 0, fn {_platform, data}, acc ->
        acc + data.followers
      end)

    %{
      current_data
      | platform_breakdown: updated_breakdown,
        total_followers: new_total,
        timestamp: DateTime.utc_now()
    }
  end
end
