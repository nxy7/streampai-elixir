defmodule StreampaiWeb.Utils.PlatformUtilsTest do
  @moduledoc """
  Tests for PlatformUtils business logic including platform-specific styling,
  naming conventions, and formatting utilities.
  """
  use ExUnit.Case, async: true
  use Mneme

  alias StreampaiWeb.Utils.PlatformUtils

  describe "PlatformUtils platform initials" do
    test "returns correct initials for supported platforms" do
      auto_assert "T" <- PlatformUtils.platform_initial(:twitch)
      auto_assert "Y" <- PlatformUtils.platform_initial(:youtube)
      auto_assert "F" <- PlatformUtils.platform_initial(:facebook)
      auto_assert "K" <- PlatformUtils.platform_initial(:kick)
    end

    test "returns question mark for unsupported platforms" do
      unsupported_platforms = [:tiktok, :instagram, :discord, :unknown, nil, ""]

      for platform <- unsupported_platforms do
        auto_assert "?" <- PlatformUtils.platform_initial(platform)
      end
    end
  end

  describe "PlatformUtils platform names" do
    test "returns correct names for supported platforms" do
      auto_assert "Twitch" <- PlatformUtils.platform_name(:twitch)
      auto_assert "YouTube" <- PlatformUtils.platform_name(:youtube)
      auto_assert "Facebook" <- PlatformUtils.platform_name(:facebook)
      auto_assert "Kick" <- PlatformUtils.platform_name(:kick)
    end

    test "capitalizes unknown atom platforms" do
      auto_assert "Tiktok" <- PlatformUtils.platform_name(:tiktok)
      auto_assert "Instagram" <- PlatformUtils.platform_name(:instagram)
      auto_assert "Discord" <- PlatformUtils.platform_name(:discord)
    end

    test "capitalizes string platform names" do
      auto_assert "Twitch" <- PlatformUtils.platform_name("twitch")
      auto_assert "Youtube" <- PlatformUtils.platform_name("youtube")
      auto_assert "Custom" <- PlatformUtils.platform_name("custom")
      auto_assert "Multi word" <- PlatformUtils.platform_name("multi word")
    end
  end

  describe "PlatformUtils time formatting" do
    test "formats time correctly for recent times" do
      auto_assert "just now" <- PlatformUtils.format_time_ago(0)
      auto_assert "just now" <- PlatformUtils.format_time_ago(0.5)
      auto_assert "just now" <- PlatformUtils.format_time_ago(0.9)
    end

    test "formats minutes correctly" do
      auto_assert "1 minutes ago" <- PlatformUtils.format_time_ago(1)
      auto_assert "15 minutes ago" <- PlatformUtils.format_time_ago(15)
      auto_assert "30 minutes ago" <- PlatformUtils.format_time_ago(30)
      auto_assert "59 minutes ago" <- PlatformUtils.format_time_ago(59)
    end

    test "formats hours correctly" do
      auto_assert "1 hours ago" <- PlatformUtils.format_time_ago(60)
      # 1.5 hours
      auto_assert "1 hours ago" <- PlatformUtils.format_time_ago(90)
      auto_assert "2 hours ago" <- PlatformUtils.format_time_ago(120)
      auto_assert "24 hours ago" <- PlatformUtils.format_time_ago(1440)
    end

    test "handles edge cases in time formatting" do
      # Test boundary conditions
      auto_assert "just now" <- PlatformUtils.format_time_ago(0.99)
      auto_assert "1 minutes ago" <- PlatformUtils.format_time_ago(1.0)
      auto_assert "59 minutes ago" <- PlatformUtils.format_time_ago(59.99)
      auto_assert "1 hours ago" <- PlatformUtils.format_time_ago(60.0)
    end

    test "handles large time values" do
      # 2 days
      auto_assert "48 hours ago" <- PlatformUtils.format_time_ago(2880)
      # 1 week
      auto_assert "168 hours ago" <- PlatformUtils.format_time_ago(10_080)
      # 30 days
      auto_assert "720 hours ago" <- PlatformUtils.format_time_ago(43_200)
    end
  end

  describe "PlatformUtils business logic" do
    test "supported platforms have proper names" do
      supported_platforms = PlatformUtils.supported_platforms()

      for platform <- supported_platforms do
        name = PlatformUtils.platform_name(platform)

        # Name should be non-empty and properly formatted
        assert String.length(name) > 0
        assert String.first(name) == String.upcase(String.first(name))
      end
    end

    test "unsupported platforms return capitalized names" do
      unsupported_platforms = [:unknown, :custom_platform]

      for platform <- unsupported_platforms do
        name = PlatformUtils.platform_name(platform)
        expected_name = platform |> to_string() |> String.capitalize()
        assert name == expected_name
      end
    end
  end

  describe "PlatformUtils real-world usage scenarios" do
    test "supports typical streaming dashboard display" do
      # Simulate displaying platform info in dashboard
      active_platforms = [:twitch, :youtube, :kick]

      platform_data =
        for platform <- active_platforms do
          %{
            platform: platform,
            name: PlatformUtils.platform_name(platform),
            last_activity: PlatformUtils.format_time_ago(:rand.uniform(120))
          }
        end

      # Verify all platforms have complete data
      for data <- platform_data do
        assert data.name
        assert String.contains?(data.last_activity, "ago") or data.last_activity == "just now"
      end
    end

    test "handles chat message platform indicators" do
      chat_messages = [
        %{platform: :twitch, username: "viewer1", message: "Hello!"},
        %{platform: :youtube, username: "subscriber2", message: "Great stream!"},
        %{platform: :facebook, username: "fan3", message: "Love this game"},
        %{platform: :kick, username: "newbie4", message: "First time here!"}
      ]

      for message <- chat_messages do
        name = PlatformUtils.platform_name(message.platform)
        # Name should exist and be non-empty
        assert name != ""
      end
    end

    test "supports platform analytics display" do
      # Simulate analytics view showing activity from different platforms
      platforms_with_activity = [
        # 45 minutes ago
        {:twitch, 45},
        # 2 hours ago
        {:youtube, 120},
        # just now
        {:facebook, 0.5},
        # 30 minutes ago
        {:kick, 30}
      ]

      analytics_data =
        for {platform, last_activity} <- platforms_with_activity do
          %{
            platform: PlatformUtils.platform_name(platform),
            last_activity: PlatformUtils.format_time_ago(last_activity)
          }
        end

      # Verify analytics data is useful for display
      for data <- analytics_data do
        assert data.platform != ""

        assert String.contains?(data.last_activity, "ago") or
                 data.last_activity == "just now"
      end
    end
  end
end
