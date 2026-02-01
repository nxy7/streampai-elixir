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

      job_args = %{
        "user_id" => user_id,
        "donation_event" => donation_event
      }

      fake_job = %Oban.Job{args: job_args}
      # Job completes successfully (enqueues alert via StreamManager.enqueue_alert,
      # which silently drops if no AlertQueue process is running)
      assert :ok = DonationTtsJob.perform(fake_job)
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

      job_args = %{
        "user_id" => user_id,
        "donation_event" => donation_event
      }

      fake_job = %Oban.Job{args: job_args}
      assert :ok = DonationTtsJob.perform(fake_job)
    end

    test "handles missing optional fields gracefully" do
      user_id = "user_789"

      donation_event = %{
        "amount" => 5.0
        # Missing optional fields like donor_name, message, etc.
      }

      job_args = %{
        "user_id" => user_id,
        "donation_event" => donation_event
      }

      fake_job = %Oban.Job{args: job_args}
      assert :ok = DonationTtsJob.perform(fake_job)
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
