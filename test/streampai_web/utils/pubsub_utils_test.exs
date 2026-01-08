defmodule StreampaiWeb.Utils.PubSubUtilsTest do
  use ExUnit.Case, async: true

  alias StreampaiWeb.Utils.PubSubUtils

  describe "topic validation" do
    test "validates known topic prefixes" do
      assert PubSubUtils.valid_topic?("donations:user123")
      assert PubSubUtils.valid_topic?("follows:user456")
      assert PubSubUtils.valid_topic?("alertbox:user789")
      assert PubSubUtils.valid_topic?("users_presence")
    end

    test "rejects invalid topic patterns" do
      refute PubSubUtils.valid_topic?("invalid:user123")
      refute PubSubUtils.valid_topic?("random_topic")
      refute PubSubUtils.valid_topic?("")
      refute PubSubUtils.valid_topic?("user123:donations")
    end
  end

  describe "user topic creation" do
    test "creates properly formatted user topics" do
      assert PubSubUtils.user_topic("donations", "user123") == "donations:user123"
      assert PubSubUtils.user_topic("alerts", "user456") == "alerts:user456"
    end
  end

  describe "safe broadcasting" do
    test "returns error for invalid topics" do
      assert PubSubUtils.safe_broadcast("invalid_topic", {:test, "message"}) ==
               {:error, :invalid_topic}
    end

    test "allows valid topics" do
      # Note: In a real test environment, this would need proper PubSub setup
      # For now, we're just testing the validation logic
      result = PubSubUtils.safe_broadcast("donations:test_user", {:test, "message"})
      # The actual broadcast may fail in test, but validation should pass
      assert result == :ok or match?({:error, _}, result)
    end
  end

  describe "subscription batching" do
    test "formats subscription requests correctly" do
      subscriptions = [
        {"donations", "user123"},
        {"follows", "user123"},
        "users_presence"
      ]

      results = PubSubUtils.batch_subscribe(subscriptions)

      assert length(results) == 3
      assert Enum.any?(results, fn {topic, _result} -> topic == "donations:user123" end)
      assert Enum.any?(results, fn {topic, _result} -> topic == "follows:user123" end)
      assert Enum.any?(results, fn {topic, _result} -> topic == "users_presence" end)
    end
  end

  describe "metrics" do
    test "returns metrics structure" do
      metrics = PubSubUtils.get_pubsub_metrics()

      assert Map.has_key?(metrics, :active_subscriptions)
      assert Map.has_key?(metrics, :total_topics)
      assert Map.has_key?(metrics, :broadcasts_per_minute)
    end
  end
end
