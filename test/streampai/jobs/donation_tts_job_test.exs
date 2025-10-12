defmodule Streampai.Jobs.DonationTtsJobTest do
  use Streampai.DataCase, async: true
  use Oban.Testing, repo: Streampai.Repo

  alias Streampai.Jobs.DonationTtsJob

  describe "perform/1" do
    test "processes donation with TTS successfully" do
      user_id = "user_123"

      donation_event = %{
        "type" => "donation",
        "amount" => 25.0,
        "currency" => "USD",
        "donor_name" => "TestDonor",
        "message" => "Thank you for the great stream!",
        "voice" => "default",
        "timestamp" => DateTime.to_iso8601(DateTime.utc_now())
      }

      # Subscribe to PubSub to verify broadcast
      Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")

      # Perform the job directly
      job_args = %{
        "user_id" => user_id,
        "donation_event" => donation_event
      }

      fake_job = %Oban.Job{args: job_args}
      assert :ok = DonationTtsJob.perform(fake_job)

      # Verify alert event was broadcast
      assert_receive {:new_donation, alert_event}, 1000

      assert alert_event.type == :donation
      assert alert_event.donor_name == "TestDonor"
      assert alert_event.message == "Thank you for the great stream!"
      assert alert_event.amount == 25.0
      assert alert_event.currency == "USD"
      assert alert_event.voice == "default"
      assert alert_event.platform == :twitch
      assert is_binary(alert_event.id)
      assert %DateTime{} = alert_event.timestamp

      # Should have TTS path and URL since message is not empty
      assert is_binary(alert_event.tts_path)
      assert is_binary(alert_event.tts_url)
      assert String.contains?(alert_event.tts_url, "tts/")
    end

    test "processes donation without message (no TTS)" do
      user_id = "user_456"

      donation_event = %{
        "type" => "donation",
        "amount" => 10.0,
        "currency" => "USD",
        "donor_name" => "Anonymous",
        "message" => "",
        "voice" => "default",
        "timestamp" => DateTime.to_iso8601(DateTime.utc_now())
      }

      Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")

      job_args = %{
        "user_id" => user_id,
        "donation_event" => donation_event
      }

      fake_job = %Oban.Job{args: job_args}
      assert :ok = DonationTtsJob.perform(fake_job)

      assert_receive {:new_donation, alert_event}, 1000

      assert alert_event.type == :donation
      assert alert_event.donor_name == "Anonymous"
      assert alert_event.message == ""
      assert alert_event.amount == 10.0

      # Should not have TTS for empty message
      assert is_nil(alert_event.tts_path)
      assert is_nil(alert_event.tts_url)
    end

    test "handles missing optional fields gracefully" do
      user_id = "user_789"

      donation_event = %{
        "amount" => 5.0
        # Missing optional fields like donor_name, message, etc.
      }

      Phoenix.PubSub.subscribe(Streampai.PubSub, "alertbox:#{user_id}")

      job_args = %{
        "user_id" => user_id,
        "donation_event" => donation_event
      }

      fake_job = %Oban.Job{args: job_args}
      assert :ok = DonationTtsJob.perform(fake_job)

      assert_receive {:new_donation, alert_event}, 1000

      assert alert_event.type == :donation
      # Default value
      assert alert_event.donor_name == "Anonymous"
      assert alert_event.message == ""
      assert alert_event.amount == 5.0
      # Default value
      assert alert_event.currency == "USD"
      # Default value
      assert alert_event.voice == "default"
    end
  end

  describe "schedule_donation_tts/2" do
    test "schedules job successfully" do
      user_id = "user_test"

      donation_event = %{
        "amount" => 15.0,
        "donor_name" => "TestUser"
      }

      assert {:ok, job} = DonationTtsJob.schedule_donation_tts(user_id, donation_event)
      assert job.worker == "Streampai.Jobs.DonationTtsJob"

      # Job is successfully inserted and has correct args
      assert job.args.user_id == user_id
      assert job.args.donation_event == donation_event
    end
  end
end
