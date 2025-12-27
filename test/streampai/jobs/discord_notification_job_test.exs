defmodule Streampai.Jobs.DiscordNotificationJobTest do
  @moduledoc """
  Tests for Discord notification Oban job.

  These tests verify job scheduling and handling logic.
  For Discord API integration tests, see discord_integration_test.exs
  """
  use Streampai.DataCase, async: true
  use Oban.Testing, repo: Streampai.Repo

  alias Streampai.Integrations.DiscordWebhook
  alias Streampai.Jobs.DiscordNotificationJob

  describe "schedule/4" do
    test "schedules a job with correct args" do
      webhook_id = Ash.UUID.generate()
      event_type = :donation
      data = %{donor_name: "TestDonor", amount: "10.00"}

      assert {:ok, job} = DiscordNotificationJob.schedule(webhook_id, event_type, data)
      assert job.worker == "Streampai.Jobs.DiscordNotificationJob"
      # Oban converts atom keys to strings when storing in DB
      assert job.args[:webhook_id] == webhook_id || job.args["webhook_id"] == webhook_id
      assert job.args[:event_type] == "donation" || job.args["event_type"] == "donation"
      data_args = job.args[:data] || job.args["data"]
      assert data_args["donor_name"] == "TestDonor"
      assert data_args["amount"] == "10.00"
      event_id = job.args[:event_id] || job.args["event_id"]
      assert is_binary(event_id)
    end

    test "uses provided event_id for deduplication" do
      webhook_id = Ash.UUID.generate()
      custom_event_id = "custom-123"

      assert {:ok, job} =
               DiscordNotificationJob.schedule(
                 webhook_id,
                 :stream_start,
                 %{title: "Live!"},
                 event_id: custom_event_id
               )

      event_id = job.args[:event_id] || job.args["event_id"]
      assert event_id == custom_event_id
    end
  end

  describe "broadcast_to_user/3" do
    test "schedules jobs for all enabled webhooks with matching event type" do
      user = generate_user()

      # Create webhooks with different event types
      {:ok, webhook_donation} =
        DiscordWebhook.create(
          %{
            name: "Donation Webhook",
            webhook_url: "https://discord.com/api/webhooks/111/aaa",
            event_types: [:donation],
            is_enabled: true
          },
          actor: user
        )

      {:ok, _webhook_stream} =
        DiscordWebhook.create(
          %{
            name: "Stream Webhook",
            webhook_url: "https://discord.com/api/webhooks/222/bbb",
            event_types: [:stream_start, :stream_end],
            is_enabled: true
          },
          actor: user
        )

      {:ok, _disabled} =
        DiscordWebhook.create(
          %{
            name: "Disabled Webhook",
            webhook_url: "https://discord.com/api/webhooks/333/ccc",
            event_types: [:donation],
            is_enabled: false
          },
          actor: user
        )

      # Broadcast donation event
      results = DiscordNotificationJob.broadcast_to_user(user.id, :donation, %{amount: "50.00"})

      # Only the enabled donation webhook should get a job
      assert is_list(results)
      assert length(results) == 1

      [{:ok, job}] = results
      webhook_id = job.args[:webhook_id] || job.args["webhook_id"]
      assert webhook_id == webhook_donation.id
    end

    test "returns empty list when no webhooks match" do
      user = generate_user()

      {:ok, _webhook} =
        DiscordWebhook.create(
          %{
            name: "Stream Only",
            webhook_url: "https://discord.com/api/webhooks/111/aaa",
            event_types: [:stream_start],
            is_enabled: true
          },
          actor: user
        )

      # Broadcast donation event to webhook that only listens for stream_start
      results = DiscordNotificationJob.broadcast_to_user(user.id, :donation, %{amount: "10.00"})

      assert results == []
    end
  end

  describe "perform/1" do
    test "handles missing webhook gracefully" do
      fake_webhook_id = Ash.UUID.generate()

      job = %Oban.Job{
        args: %{
          "webhook_id" => fake_webhook_id,
          "event_type" => "donation",
          "data" => %{"amount" => "10.00"},
          "event_id" => "test-123"
        },
        attempt: 1
      }

      # Should succeed (skip) when webhook not found
      assert :ok = DiscordNotificationJob.perform(job)
    end

    test "skips disabled webhooks" do
      user = generate_user()

      {:ok, webhook} =
        DiscordWebhook.create(
          %{
            name: "Disabled",
            webhook_url: "https://discord.com/api/webhooks/111/aaa",
            event_types: [:donation],
            is_enabled: false
          },
          actor: user
        )

      job = %Oban.Job{
        args: %{
          "webhook_id" => webhook.id,
          "event_type" => "donation",
          "data" => %{"amount" => "10.00"},
          "event_id" => "test-123"
        },
        attempt: 1
      }

      # Should succeed (skip) when webhook is disabled
      assert :ok = DiscordNotificationJob.perform(job)
    end
  end

  # Helper to generate a user for testing
  defp generate_user do
    unique_id = System.unique_integer([:positive])

    {:ok, user} =
      Streampai.Accounts.User
      |> Ash.Changeset.for_create(:register_with_password, %{
        email: "test_#{unique_id}@example.com",
        password: "TestPassword123!",
        password_confirmation: "TestPassword123!"
      })
      |> Ash.create(authorize?: false)

    user
  end
end
