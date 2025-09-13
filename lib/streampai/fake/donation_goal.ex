defmodule Streampai.Fake.DonationGoal do
  @moduledoc """
  Utility module for generating fake donation events for the Donation Goal widget.
  Used for testing and demonstration purposes in the settings preview.
  """

  alias Streampai.Fake.Base

  @donation_messages [
    "Keep up the great work!",
    "Love the stream!",
    "You're amazing!",
    "Thanks for the content!",
    "Happy to support!",
    "Best streamer ever!",
    "Worth every penny!",
    "Take my money!",
    "For the goal!",
    "Let's hit that target!",
    "Almost there!",
    "We can do this!",
    "Supporting the dream!",
    "Here's my contribution!",
    "Every bit helps!"
  ]

  def default_config do
    %{
      goal_amount: 1000,
      starting_amount: 0,
      currency: "$",
      start_date: Date.to_iso8601(Date.utc_today()),
      end_date: Date.utc_today() |> Date.add(30) |> Date.to_iso8601(),
      title: "Monthly Donation Goal",
      show_percentage: true,
      show_amount_raised: true,
      show_days_left: true,
      theme: "default",
      bar_color: "#10b981",
      background_color: "#e5e7eb",
      text_color: "#1f2937",
      animation_enabled: true
    }
  end

  def generate_donation do
    amount = generate_weighted_amount()
    username = Base.generate_username()

    %{
      id: Base.generate_hex_id(),
      amount: amount,
      currency: "$",
      username: username,
      message: maybe_include_message(amount),
      timestamp: DateTime.utc_now()
    }
  end

  defp generate_weighted_amount do
    case_result =
      case Enum.random(1..100) do
        n when n <= 40 ->
          # Small donations (40% chance)
          Enum.random([1, 2, 3, 5]) + :rand.uniform()

        n when n <= 70 ->
          # Medium donations (30% chance)
          Enum.random([10, 15, 20, 25]) + :rand.uniform()

        n when n <= 90 ->
          # Large donations (20% chance)
          Enum.random([50, 75, 100]) + :rand.uniform()

        _ ->
          # Very large donations (10% chance)
          Enum.random([200, 500, 1000]) + :rand.uniform()
      end

    Float.round(case_result, 2)
  end

  defp maybe_include_message(amount) do
    # Higher donation amounts are more likely to include messages
    probability =
      cond do
        amount >= 100 -> 0.9
        amount >= 50 -> 0.7
        amount >= 20 -> 0.5
        true -> 0.3
      end

    if Base.random_boolean(probability) do
      Enum.random(@donation_messages)
    end
  end

  def calculate_current_amount(starting_amount, days_elapsed, goal_amount) do
    # Simulate realistic progress based on days elapsed
    progress_percentage = min(days_elapsed / 30, 0.95)
    random_factor = 0.8 + :rand.uniform() * 0.4

    Float.round(starting_amount + goal_amount * progress_percentage * random_factor, 2)
  end

  def generate_demo_state(config \\ default_config()) do
    # Merge provided config with defaults to ensure all keys exist
    full_config = Map.merge(default_config(), config)

    # Calculate simulated current amount based on date range
    days_elapsed = calculate_days_elapsed(full_config.start_date)

    current_amount =
      calculate_current_amount(
        full_config.starting_amount,
        days_elapsed,
        full_config.goal_amount
      )

    %{
      config: full_config,
      current_amount: current_amount,
      recent_donations: generate_recent_donations(3)
    }
  end

  defp calculate_days_elapsed(start_date) when is_binary(start_date) do
    case Date.from_iso8601(start_date) do
      {:ok, start} ->
        Date.diff(Date.utc_today(), start)

      _ ->
        0
    end
  end

  defp calculate_days_elapsed(_), do: 0

  defp generate_recent_donations(count) do
    Enum.map(1..count, fn _ ->
      generate_donation()
    end)
  end
end
