defmodule Streampai.Fake.Giveaway do
  @moduledoc """
  Utility module for generating fake giveaway events for testing and demonstration purposes.
  """

  alias Streampai.Fake.Base

  @giveaway_titles [
    "Epic Gaming Setup Giveaway",
    "1000 Subscriber Celebration",
    "Monthly Patron Appreciation",
    "Viewer Milestone Reward",
    "Special Event Prize Drop",
    "Community Game Night Prize",
    "Stream Anniversary Giveaway",
    "Random Acts of Kindness",
    "Friday Fun Giveaway",
    "Thank You Celebration"
  ]

  @giveaway_descriptions [
    "Enter for a chance to win amazing prizes!",
    "Thank you for being part of our community!",
    "Let's celebrate together with some prizes!",
    "Your support means everything to us!",
    "Time to give back to our amazing viewers!",
    "Join in for your chance to win!",
    "Community appreciation time!",
    "Good luck to everyone who enters!",
    "Multiple winners will be selected!",
    "Don't miss out on this opportunity!"
  ]

  def default_config do
    %{
      show_title: true,
      title: "Community Giveaway",
      show_description: true,
      description: "Type !join to enter",
      active_label: "Giveaway Active",
      inactive_label: "No Active Giveaway",
      winner_label: "🎉 Winner! 🎉",
      entry_method_text: "Type !join to enter",
      show_entry_method: true,
      show_progress_bar: false,
      target_participants: 100,
      patreon_multiplier: 2,
      patreon_badge_text: "⭐ Patreon",
      winner_animation: "bounce",
      title_color: "#8b5cf6",
      text_color: "#ffffff",
      background_color: "#1f2937",
      accent_color: "#10b981",
      font_size: "medium",
      show_patreon_info: true
    }
  end

  def generate_event do
    # Generate either an update or result event
    case Enum.random([:update, :result]) do
      :update ->
        generate_update_event()

      :result ->
        generate_result_event()
    end
  end

  def generate_update_event do
    participants = Enum.random(5..150)
    patreons = Enum.random(0..div(participants, 4))

    %{
      id: Base.generate_hex_id(),
      type: :update,
      participants: participants,
      patreons: patreons,
      isActive: true,
      timestamp: DateTime.utc_now()
    }
  end

  def generate_result_event do
    total_participants = Enum.random(20..200)
    patreon_participants = Enum.random(0..div(total_participants, 3))

    winner = generate_winner()

    %{
      id: Base.generate_hex_id(),
      type: :result,
      winner: winner,
      totalParticipants: total_participants,
      patreonParticipants: patreon_participants,
      timestamp: DateTime.utc_now()
    }
  end

  def generate_winner do
    username = Base.generate_username()
    # 25% chance of being patreon
    is_patreon = Enum.random([true, false, false, false])

    %{
      username: username,
      isPatreon: is_patreon
    }
  end

  def generate_giveaway_config do
    title = Enum.random(@giveaway_titles)
    description = Enum.random(@giveaway_descriptions)

    %{
      title: title,
      description: description,
      target_participants: Enum.random([25, 50, 75, 100, 150, 200]),
      patreon_multiplier: Enum.random([1, 2, 3, 5]),
      show_progress_bar: Enum.random([true, false]),
      show_patreon_info: Enum.random([true, false]),
      winner_animation: Enum.random(["fade", "slide", "bounce", "confetti"])
    }
  end

  def generate_demo_sequence do
    # Generate a realistic giveaway sequence
    [
      # Giveaway starts
      %{
        type: :update,
        participants: 0,
        patreons: 0,
        isActive: true,
        delay: 0
      },
      # Participants start joining
      %{
        type: :update,
        participants: 5,
        patreons: 0,
        isActive: true,
        delay: 2000
      },
      # More participants
      %{
        type: :update,
        participants: 15,
        patreons: 2,
        isActive: true,
        delay: 5000
      },
      # Peak participation
      %{
        type: :update,
        participants: 35,
        patreons: 8,
        isActive: true,
        delay: 8000
      },
      # Final count before winner
      %{
        type: :update,
        participants: 42,
        patreons: 12,
        isActive: true,
        delay: 12_000
      },
      # Winner announced
      %{
        type: :result,
        winner: %{username: "LuckyViewer23", isPatreon: true},
        totalParticipants: 42,
        patreonParticipants: 12,
        delay: 15_000
      },
      # Reset after a while
      %{
        type: :update,
        participants: 0,
        patreons: 0,
        isActive: false,
        delay: 20_000
      }
    ]
  end

  def generate_progressive_giveaway(max_participants \\ 50) do
    # Generate a progressive sequence showing participant growth
    step_size = max(1, div(max_participants, 10))

    for step <- 1..10 do
      participants = min(step * step_size, max_participants)
      patreons = div(participants, 4)

      %{
        type: :update,
        participants: participants,
        patreons: patreons,
        isActive: true,
        delay: step * 1500
      }
    end
  end

  def generate_multiple_winners_sequence(winner_count \\ 3) do
    base_participants = 50
    base_patreons = 12

    # Generate sequence with multiple winners
    for i <- 1..winner_count do
      winner = generate_winner()

      %{
        type: :result,
        winner: winner,
        totalParticipants: base_participants,
        patreonParticipants: base_patreons,
        delay: i * 3000
      }
    end
  end

  def generate_realistic_usernames do
    prefixes = ["Pro", "Epic", "Cool", "Super", "Gaming", "Stream", "Twitch", "YT", "Live"]
    names = ["Gamer", "Player", "Streamer", "Viewer", "Fan", "User", "Master", "Legend", "Hero"]
    suffixes = ["123", "2024", "Pro", "XL", "HD", "Live", "TV", "Plus", "Max"]

    prefix = Enum.random(prefixes)
    name = Enum.random(names)
    suffix = Enum.random(suffixes)
    number = :rand.uniform(999)

    case Enum.random([:prefix_name, :name_suffix, :name_number, :prefix_name_suffix]) do
      :prefix_name -> "#{prefix}#{name}"
      :name_suffix -> "#{name}#{suffix}"
      :name_number -> "#{name}#{number}"
      :prefix_name_suffix -> "#{prefix}#{name}#{suffix}"
    end
  end

  def generate_engagement_stats do
    %{
      total_giveaways_this_month: Enum.random(5..20),
      average_participants: Enum.random(25..75),
      highest_participation: Enum.random(100..300),
      patreon_participation_rate: Enum.random(15..45),
      most_active_participants:
        Enum.map(1..5, fn _ ->
          %{
            username: generate_realistic_usernames(),
            giveaways_entered: Enum.random(3..15),
            wins: Enum.random(0..2),
            is_patreon: Enum.random([true, false])
          }
        end)
    }
  end
end
