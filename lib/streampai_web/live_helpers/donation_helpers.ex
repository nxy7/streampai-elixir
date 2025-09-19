defmodule StreampaiWeb.LiveHelpers.DonationHelpers do
  @moduledoc """
  Business logic helpers for donation-related functionality.
  """

  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserPreferences
  alias Streampai.Jobs.DonationTtsJob

  require Logger

  @doc """
  Finds a user by username with proper error handling.
  """
  def find_user_by_username(username) do
    import Ash.Query

    query = User |> for_read(:get, %{}, load: [:display_avatar]) |> filter(name == ^username)

    case Ash.read_one(query, authorize?: false) do
      {:ok, user} when not is_nil(user) -> {:ok, user}
      {:ok, nil} -> {:error, :not_found}
      {:error, _} -> {:error, :not_found}
    end
  end

  @doc """
  Gets user preferences with fallback to defaults.
  """
  def get_user_preferences(user_id) do
    case UserPreferences.get_by_user_id(%{user_id: user_id}, authorize?: false) do
      {:ok, preferences} ->
        preferences

      {:error, _} ->
        %{
          min_donation_amount: nil,
          max_donation_amount: nil,
          donation_currency: "USD"
        }
    end
  end

  @doc """
  Processes a donation with TTS scheduling.
  """
  def process_donation(user, params, amount, preferences) do
    Logger.info("Processing donation", %{
      user_id: user.id,
      username: user.name,
      amount: amount,
      donor_name: params["donor_name"],
      message: params["message"]
    })

    donation_event = create_donation_event(params, amount, preferences)

    case schedule_donation_tts(user.id, donation_event) do
      {:ok, _job} ->
        Logger.info("Donation TTS job scheduled successfully", %{user_id: user.id})
        {:ok, donation_event}

      {:error, reason} ->
        Logger.error("Failed to schedule donation TTS job", %{
          user_id: user.id,
          reason: inspect(reason)
        })

        {:error, reason}
    end
  end

  @doc """
  Finds similar usernames using PostgreSQL similarity.
  """
  def find_similar_usernames(username) do
    import Ecto.Query

    query =
      from(u in User,
        where: fragment("similarity(?, ?) > 0.3", u.name, ^username),
        order_by: [desc: fragment("similarity(?, ?)", u.name, ^username)],
        limit: 5,
        select: %{name: u.name, similarity: fragment("similarity(?, ?)", u.name, ^username)}
      )

    case Streampai.Repo.all(query) do
      [] -> []
      results -> results
    end
  rescue
    _ -> []
  end

  @doc """
  Gets placeholder top donors data.
  """
  def get_top_donors_placeholder do
    [
      %{
        name: "GenerousViewer",
        amount: 150,
        message: "Keep up the great content!",
        timestamp: ~U[2024-01-15 14:30:00Z]
      },
      %{
        name: "SuperFan99",
        amount: 100,
        message: "Love the streams! 💜",
        timestamp: ~U[2024-01-14 19:45:00Z]
      },
      %{
        name: "Anonymous",
        amount: 75,
        message: "Thanks for the entertainment",
        timestamp: ~U[2024-01-13 21:20:00Z]
      },
      %{
        name: "StreamLover",
        amount: 50,
        message: "Amazing gameplay today!",
        timestamp: ~U[2024-01-12 16:15:00Z]
      },
      %{
        name: "CoffeeSupporter",
        amount: 25,
        message: "Buy yourself some coffee! ☕",
        timestamp: ~U[2024-01-11 12:30:00Z]
      }
    ]
  end

  @doc """
  Gets available voice options for TTS.
  """
  def get_voice_options do
    [
      %{value: "default", label: "Default Voice"},
      %{value: "robotic", label: "Robotic"},
      %{value: "cheerful", label: "Cheerful"},
      %{value: "calm", label: "Calm"},
      %{value: "excited", label: "Excited"},
      %{value: "whisper", label: "Whisper"}
    ]
  end

  @doc """
  Gets initial donation form data.
  """
  def get_initial_form do
    %{
      donor_name: "",
      donor_email: "",
      message: "",
      voice: "default"
    }
  end

  # Private helper functions

  defp create_donation_event(params, amount, preferences) do
    %{
      "type" => "donation",
      "amount" => amount,
      "currency" => preferences.donation_currency || "USD",
      "donor_name" => params["donor_name"] || "Anonymous",
      "message" => params["message"] || "",
      "voice" => params["voice"] || "default",
      "timestamp" => DateTime.to_iso8601(DateTime.utc_now())
    }
  end

  defp schedule_donation_tts(user_id, donation_event) do
    Logger.info("Scheduling donation TTS job", %{
      user_id: user_id,
      donor_name: donation_event["donor_name"],
      amount: donation_event["amount"]
    })

    DonationTtsJob.schedule_donation_tts(user_id, donation_event)
  end
end
