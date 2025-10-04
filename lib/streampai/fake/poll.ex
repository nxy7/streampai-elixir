defmodule Streampai.Fake.Poll do
  @moduledoc """
  Utility module for generating fake poll events for testing and demonstration purposes.
  """

  alias Streampai.Fake.Base

  @poll_questions [
    "What game should I play next?",
    "Which skin should I use?",
    "What should we do in this level?",
    "Best strategy for this boss fight?",
    "Which character is your favorite?",
    "What content should I create next?",
    "Where should we explore next?",
    "Which weapon is the best?",
    "What's your favorite part of the stream?",
    "Which mode should we try?",
    "Best build for this character?",
    "What should I focus on improving?",
    "Which quest should we do next?",
    "Best loadout for PvP?",
    "What's the most challenging part?",
    "Which map is your favorite?",
    "Best team composition?",
    "What's your streaming tip?",
    "Which genre should I try next?",
    "Best time to stream?"
  ]

  @poll_options [
    # Game options
    ["Valorant", "CS2", "Apex Legends", "Fortnite"],
    ["Among Us", "Fall Guys", "Rocket League", "Minecraft"],
    ["League of Legends", "Dota 2", "Heroes of Newerth", "Smite"],
    ["Dark Souls", "Elden Ring", "Bloodborne", "Sekiro"],

    # General strategy options
    ["Aggressive", "Defensive", "Balanced", "Risk-taking"],
    ["Solo queue", "Team up", "Practice mode", "Ranked"],
    ["Rush", "Farm", "Defend", "Split push"],
    ["Early game", "Mid game", "Late game", "All phases"],

    # Content options
    ["Gaming", "Just Chatting", "Art", "Music"],
    ["Tutorial", "Speedrun", "Challenge", "Casual play"],
    ["Solo content", "Collabs", "Community games", "Viewer challenges"],

    # Equipment/builds
    ["DPS build", "Tank build", "Support build", "Hybrid build"],
    ["Sniper", "Assault rifle", "SMG", "Shotgun"],
    ["Magic", "Melee", "Ranged", "Stealth"],

    # Time/schedule options
    ["Morning", "Afternoon", "Evening", "Late night"],
    ["Weekdays", "Weekends", "Both", "Flexible"],

    # Yes/No options
    ["Yes", "No", "Maybe", "Depends"],
    ["Definitely", "Probably", "Unlikely", "Never"],

    # Rating options
    ["Excellent", "Good", "Average", "Poor"],
    ["Love it", "Like it", "Neutral", "Dislike it"]
  ]

  def default_config do
    %{
      show_title: true,
      show_percentages: true,
      show_vote_counts: true,
      font_size: "medium",
      primary_color: "#3B82F6",
      secondary_color: "#10B981",
      background_color: "#FFFFFF",
      text_color: "#1F2937",
      winner_color: "#F59E0B",
      animation_type: "smooth",
      highlight_winner: true,
      auto_hide_after_end: false,
      hide_delay: 10
    }
  end

  def generate_event do
    event_type = Enum.random(["poll_started", "poll_updated", "poll_ended", "new_vote"])
    poll_status = poll_status_for_event_type(event_type)

    %{
      id: "event_#{Base.generate_hex_id()}",
      type: event_type,
      poll_status: generate_poll_status(poll_status),
      username: Base.generate_username(),
      timestamp: DateTime.utc_now(),
      platform: Enum.random(["twitch", "youtube", "facebook", "kick"])
    }
  end

  defp poll_status_for_event_type("poll_started"), do: "active"
  defp poll_status_for_event_type("poll_ended"), do: "ended"
  defp poll_status_for_event_type(_event_type), do: Enum.random(["active", "ended"])

  def generate_poll_status(status \\ nil) do
    poll_status = status || Enum.random(["active", "ended"])
    question = Enum.random(@poll_questions)
    options = Enum.random(@poll_options)

    poll_options = generate_poll_options(options, poll_status)
    total_votes = Enum.reduce(poll_options, 0, fn option, acc -> acc + option.votes end)

    %{
      id: "poll_#{Base.generate_hex_id()}",
      title: question,
      status: poll_status,
      options: poll_options,
      total_votes: total_votes,
      created_at: Base.generate_timestamp(5),
      ends_at:
        if(poll_status == "active",
          do: DateTime.add(DateTime.utc_now(), :rand.uniform(600), :second)
        ),
      platform: Enum.random(["twitch", "youtube", "facebook", "kick"])
    }
  end

  def generate_active_poll do
    generate_poll_status("active")
  end

  def generate_ended_poll do
    generate_poll_status("ended")
  end

  def simulate_vote_update(poll_status) do
    if poll_status.status == "active" do
      # Randomly pick an option to get a new vote
      option_index = :rand.uniform(length(poll_status.options)) - 1

      updated_options =
        List.update_at(poll_status.options, option_index, fn option ->
          %{option | votes: option.votes + 1}
        end)

      new_total = poll_status.total_votes + 1

      %{poll_status | options: updated_options, total_votes: new_total}
    else
      poll_status
    end
  end

  defp generate_poll_options(option_texts, status) do
    option_texts
    |> Enum.with_index(fn text, index ->
      base_votes = base_votes_for_status(status)
      vote_multiplier = vote_multiplier_for_index(index)
      votes = round(base_votes * vote_multiplier)

      %{
        id: "option_#{index + 1}",
        text: text,
        votes: votes
      }
    end)
    |> Enum.shuffle()
  end

  defp base_votes_for_status("active"), do: :rand.uniform(150) + 10
  defp base_votes_for_status("ended"), do: :rand.uniform(300) + 50
  defp base_votes_for_status(_status), do: :rand.uniform(100)

  defp vote_multiplier_for_index(0), do: 1.0 + :rand.uniform(50) / 100
  defp vote_multiplier_for_index(1), do: 1.0 + :rand.uniform(30) / 100
  defp vote_multiplier_for_index(_index), do: 1.0

  def create_sample_polls do
    [
      %{
        id: "sample_active",
        title: "What game should we play next?",
        status: "active",
        options: [
          %{id: "opt1", text: "Valorant", votes: 45},
          %{id: "opt2", text: "Apex Legends", votes: 32},
          %{id: "opt3", text: "CS2", votes: 28},
          %{id: "opt4", text: "Fortnite", votes: 15}
        ],
        total_votes: 120,
        created_at: DateTime.add(DateTime.utc_now(), -180, :second),
        ends_at: DateTime.add(DateTime.utc_now(), 420, :second),
        platform: "twitch"
      },
      %{
        id: "sample_ended",
        title: "Best streaming schedule?",
        status: "ended",
        options: [
          %{id: "opt1", text: "Evening", votes: 89},
          %{id: "opt2", text: "Afternoon", votes: 67},
          %{id: "opt3", text: "Morning", votes: 34},
          %{id: "opt4", text: "Late Night", votes: 22}
        ],
        total_votes: 212,
        created_at: DateTime.add(DateTime.utc_now(), -1800, :second),
        ends_at: DateTime.add(DateTime.utc_now(), -300, :second),
        platform: "youtube"
      }
    ]
  end
end
