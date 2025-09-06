defmodule Streampai.Accounts.UserHelpersTest do
  use ExUnit.Case, async: true
  use Mneme

  alias Streampai.Accounts.UserHelpers

  describe "get_fallback_username/1" do
    test "returns existing name when user has a name" do
      user = %{name: "customname", extra_data: %{"platform" => "google", "name" => "John Doe"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "customname" <- result
    end

    test "returns platform name when user name is nil and has google extra_data" do
      user = %{name: nil, extra_data: %{"platform" => "google", "name" => "John Doe"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "John Doe" <- result
    end

    test "returns platform name when user name is empty string and has google extra_data" do
      user = %{name: "", extra_data: %{"platform" => "google", "name" => "Jane Smith"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "Jane Smith" <- result
    end

    test "returns given_name when google name is not available" do
      user = %{name: nil, extra_data: %{"platform" => "google", "given_name" => "John"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "John" <- result
    end

    test "returns platform name when user name is nil and has twitch extra_data" do
      user = %{name: nil, extra_data: %{"platform" => "twitch", "display_name" => "StreamerName"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "StreamerName" <- result
    end

    test "returns login when twitch display_name is not available" do
      user = %{name: "", extra_data: %{"platform" => "twitch", "login" => "loginname"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "loginname" <- result
    end

    test "returns nil when user name is nil and platform is unknown" do
      user = %{name: nil, extra_data: %{"platform" => "unknown"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert nil <- result
    end

    test "returns existing name when user has no extra_data" do
      user = %{name: "username"}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "username" <- result
    end

    test "returns existing name when extra_data is nil" do
      user = %{name: "username", extra_data: nil}
      result = UserHelpers.get_fallback_username(user)
      auto_assert "username" <- result
    end
  end

  describe "get_fallback_avatar/1" do
    test "returns google picture URL from extra_data" do
      user = %{
        extra_data: %{"platform" => "google", "picture" => "https://example.com/avatar.jpg"}
      }

      result = UserHelpers.get_fallback_avatar(user)
      auto_assert "https://example.com/avatar.jpg" <- result
    end

    test "returns twitch profile_image_url from extra_data" do
      user = %{
        extra_data: %{
          "platform" => "twitch",
          "profile_image_url" => "https://twitch.example.com/avatar.png"
        }
      }

      result = UserHelpers.get_fallback_avatar(user)
      auto_assert "https://twitch.example.com/avatar.png" <- result
    end

    test "returns nil for unknown platform" do
      user = %{
        extra_data: %{"platform" => "unknown", "some_image" => "https://example.com/img.jpg"}
      }

      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end

    test "returns nil when extra_data is nil" do
      user = %{extra_data: nil}
      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end

    test "returns nil when user has no extra_data key" do
      user = %{name: "test"}
      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end

    test "returns nil when google platform has no picture" do
      user = %{extra_data: %{"platform" => "google", "name" => "John"}}
      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end

    test "returns nil when twitch platform has no profile_image_url" do
      user = %{extra_data: %{"platform" => "twitch", "display_name" => "StreamerName"}}
      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end
  end

  describe "get_platform_info/1" do
    test "returns platform info when extra_data is present" do
      extra_data = %{"platform" => "google", "name" => "John Doe", "email" => "john@example.com"}
      user = %{extra_data: extra_data}
      result = UserHelpers.get_platform_info(user)

      auto_assert %{
                    platform: "google",
                    user_info: ^extra_data
                  } <- result
    end

    test "returns platform info for twitch user" do
      extra_data = %{"platform" => "twitch", "display_name" => "StreamerName", "id" => "12345"}
      user = %{extra_data: extra_data}
      result = UserHelpers.get_platform_info(user)

      auto_assert %{
                    platform: "twitch",
                    user_info: ^extra_data
                  } <- result
    end

    test "returns nil platform info when extra_data is nil" do
      user = %{extra_data: nil}
      result = UserHelpers.get_platform_info(user)

      auto_assert %{
                    platform: nil,
                    user_info: nil
                  } <- result
    end

    test "returns nil platform info when no extra_data key" do
      user = %{name: "test"}
      result = UserHelpers.get_platform_info(user)

      auto_assert %{
                    platform: nil,
                    user_info: nil
                  } <- result
    end

    test "returns platform info even when platform key is missing" do
      extra_data = %{"name" => "John Doe", "email" => "john@example.com"}
      user = %{extra_data: extra_data}
      result = UserHelpers.get_platform_info(user)

      auto_assert %{
                    platform: nil,
                    user_info: ^extra_data
                  } <- result
    end
  end

  describe "edge cases" do
    test "get_fallback_username handles empty extra_data map" do
      user = %{name: nil, extra_data: %{}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert nil <- result
    end

    test "get_fallback_avatar handles empty extra_data map" do
      user = %{extra_data: %{}}
      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end

    test "google platform with both name and given_name prefers name" do
      user = %{
        name: nil,
        extra_data: %{"platform" => "google", "name" => "Full Name", "given_name" => "First"}
      }

      result = UserHelpers.get_fallback_username(user)
      auto_assert "Full Name" <- result
    end

    test "twitch platform with both display_name and login prefers display_name" do
      user = %{
        name: "",
        extra_data: %{
          "platform" => "twitch",
          "display_name" => "DisplayName",
          "login" => "loginname"
        }
      }

      result = UserHelpers.get_fallback_username(user)
      auto_assert "DisplayName" <- result
    end

    test "get_fallback_username with platform but missing expected fields returns nil" do
      user = %{name: nil, extra_data: %{"platform" => "google"}}
      result = UserHelpers.get_fallback_username(user)
      auto_assert nil <- result
    end

    test "get_fallback_avatar with platform but missing expected fields returns nil" do
      user = %{extra_data: %{"platform" => "twitch", "display_name" => "test"}}
      result = UserHelpers.get_fallback_avatar(user)
      auto_assert nil <- result
    end
  end
end
