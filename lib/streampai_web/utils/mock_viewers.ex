defmodule StreampaiWeb.Utils.MockViewers do
  @moduledoc false

  @platforms [:twitch, :youtube, :facebook, :kick]
  @tags ["VIP", "Subscriber", "Moderator", "Regular", "New", "Turbo", "Prime", "Gifted Sub"]

  @firstnames [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Jamie",
    "Drew",
    "Avery",
    "Quinn",
    "Blake",
    "Cameron",
    "Dakota",
    "Emery",
    "Finley",
    "Hayden",
    "Jesse",
    "Kai",
    "Logan",
    "Mason",
    "Noah",
    "Parker",
    "Reese",
    "Sage",
    "Sam"
  ]

  @lastnames [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Anderson",
    "Taylor",
    "Thomas",
    "Moore",
    "Martin",
    "Jackson",
    "Thompson",
    "White",
    "Lopez",
    "Lee",
    "Harris",
    "Clark",
    "Lewis"
  ]

  @usernames [
    "xX_ShadowNinja_Xx",
    "StreamSniper42",
    "PogChampion",
    "CoolViewer123",
    "NoobMaster69",
    "ProGamerMove",
    "ChillVibes",
    "TwitchPrime",
    "SubHype",
    "ChatWarrior",
    "LurkerLife",
    "EmoteSpammer",
    "DankMemer",
    "F_in_chat",
    "BackseatGamer",
    "ClipChamp",
    "ModSquad",
    "VIPViewer",
    "FirstTimer",
    "RegularAndy",
    "HypeTrainConductor",
    "BitsDonator",
    "SubGifter"
  ]

  def generate_viewers(count \\ 50) do
    Enum.map(1..count, fn id ->
      platforms = generate_platforms()
      primary_platform = Enum.random(platforms)
      email = generate_email(id)

      %{
        id: "viewer_#{id}",
        username: Enum.random(@usernames) <> "_#{id}",
        email: email,
        full_name: "#{Enum.random(@firstnames)} #{Enum.random(@lastnames)}",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=viewer#{id}",
        platforms: platforms,
        primary_platform: primary_platform,
        tags: generate_tags(),
        total_messages: :rand.uniform(5000),
        total_donations: generate_donation_amount(),
        # in minutes
        total_watch_time: :rand.uniform(500) * 60,
        first_seen: generate_past_date(365),
        last_seen: generate_past_date(7),
        is_follower: :rand.uniform() > 0.3,
        is_subscriber: :rand.uniform() > 0.6,
        subscription_tier: generate_sub_tier(),
        subscription_months: :rand.uniform(36),
        linked_accounts: generate_linked_accounts(email, platforms)
      }
    end)
  end

  def generate_viewer_details(viewer_id) do
    base_viewer = 1 |> generate_viewers() |> List.first()

    Map.merge(base_viewer, %{
      id: viewer_id,
      ai_summary: generate_ai_summary(),
      chat_history: generate_chat_history(),
      donation_history: generate_donation_history(),
      top_donations: generate_top_donations(),
      watch_sessions: generate_watch_sessions(),
      engagement_score: :rand.uniform(100),
      sentiment_score: 50 + :rand.uniform(50),
      favorite_emotes: generate_favorite_emotes(),
      common_chat_times: generate_chat_times(),
      badges: generate_badges()
    })
  end

  defp generate_platforms do
    count = :rand.uniform(3) + 1
    Enum.take_random(@platforms, count)
  end

  defp generate_email(id) do
    domain =
      Enum.random(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "protonmail.com"])

    "viewer#{id}@#{domain}"
  end

  defp generate_tags do
    count = :rand.uniform(4)
    Enum.take_random(@tags, count)
  end

  defp generate_donation_amount do
    random_value = :rand.uniform(10)

    cond do
      random_value <= 6 -> 0.0
      random_value <= 8 -> :rand.uniform(100) * 1.0
      true -> :rand.uniform(1000) * 1.0
    end
  end

  defp generate_past_date(max_days_ago) do
    days_ago = :rand.uniform(max_days_ago)

    DateTime.utc_now()
    |> DateTime.add(-days_ago * 24 * 60 * 60, :second)
    |> DateTime.to_naive()
  end

  defp generate_sub_tier do
    random_value = :rand.uniform(10)

    cond do
      random_value <= 5 -> 1
      random_value <= 8 -> 2
      true -> 3
    end
  end

  defp generate_linked_accounts(_email, platforms) do
    Enum.map(platforms, fn platform ->
      %{
        platform: platform,
        username: "#{platform}_user_#{:rand.uniform(9999)}",
        linked_via: if(:rand.uniform() > 0.5, do: "email", else: "manual"),
        confidence: 70 + :rand.uniform(30),
        linked_at: generate_past_date(180)
      }
    end)
  end

  defp generate_ai_summary do
    summaries = [
      "Long-time viewer who actively participates in chat. Shows strong engagement during gameplay streams and often helps new viewers. Particularly interested in speedruns and challenge content. Tends to be supportive and positive in chat interactions.",
      "Regular viewer with moderate engagement. Primarily watches during evening hours and weekends. Shows interest in variety content and community events. Occasionally participates in chat games and predictions.",
      "New but enthusiastic viewer who discovered the channel recently. Very active in chat and eager to learn about the community. Shows potential to become a regular supporter. Particularly enjoys interactive content.",
      "Silent supporter who rarely chats but consistently watches streams. Has been following for over a year and maintains steady viewership. Occasionally drops bits or donations during special events.",
      "Highly engaged community member who frequently clips memorable moments. Active in Discord and helps moderate chat during busy streams. Shows leadership qualities and helps maintain positive chat atmosphere."
    ]

    Enum.random(summaries)
  end

  defp generate_chat_history do
    messages = [
      "Hey everyone! First time catching a live stream!",
      "That was insane! Clipped it!",
      "LUL that timing though",
      "GG WP!",
      "Thanks for the stream!",
      "What game is this?",
      "PogChamp LETS GOOO",
      "F in the chat boys",
      "Is this a world record attempt?",
      "Love this community <3",
      "That's a clip for sure",
      "How long have you been streaming?",
      "First!",
      "Audio seems fine to me",
      "Hydration check everyone!",
      "That boss fight was epic",
      "Can we get some hype in the chat?",
      "Just got here, what did I miss?",
      "This is my favorite stream",
      "See you next stream!"
    ]

    1..20
    |> Enum.map(fn _ ->
      %{
        message: Enum.random(messages),
        timestamp: generate_past_date(30),
        platform: Enum.random(@platforms),
        highlighted: :rand.uniform() > 0.8
      }
    end)
    |> Enum.sort_by(& &1.timestamp, NaiveDateTime)
  end

  defp generate_donation_history do
    1..10
    |> Enum.map(fn _ ->
      %{
        amount: :rand.uniform(100) * 1.0,
        message: if(:rand.uniform() > 0.3, do: "Keep up the great content!"),
        timestamp: generate_past_date(180),
        platform: Enum.random(@platforms),
        type: Enum.random([:bits, :superchat, :donation, :subscription])
      }
    end)
    |> Enum.sort_by(& &1.timestamp, {:desc, NaiveDateTime})
  end

  defp generate_top_donations do
    Enum.map(1..3, fn n ->
      %{
        amount: (6 - n) * 50.0 + :rand.uniform(50) * 1.0,
        message: "Amazing stream! Here's my support!",
        timestamp: generate_past_date(365),
        platform: Enum.random(@platforms)
      }
    end)
  end

  defp generate_watch_sessions do
    Enum.map(1..10, fn _ ->
      %{
        date: generate_past_date(30),
        # in seconds
        duration: :rand.uniform(180) * 60,
        platform: Enum.random(@platforms),
        chat_messages: :rand.uniform(50),
        engagement_rate: :rand.uniform(100)
      }
    end)
  end

  defp generate_favorite_emotes do
    emotes = [
      "Kappa",
      "PogChamp",
      "LUL",
      "4Head",
      "BibleThump",
      "Kreygasm",
      "SMOrc",
      "NotLikeThis",
      "BabyRage",
      "WutFace",
      "DansGame",
      "FailFish"
    ]

    emotes
    |> Enum.take_random(5)
    |> Enum.map(fn emote ->
      %{
        emote: emote,
        usage_count: :rand.uniform(500)
      }
    end)
  end

  defp generate_chat_times do
    %{
      most_active_hour: :rand.uniform(24) - 1,
      most_active_day:
        Enum.random([
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ]),
      average_messages_per_stream: :rand.uniform(50),
      chat_participation_rate: :rand.uniform(100)
    }
  end

  defp generate_badges do
    all_badges = [
      %{name: "Founder", icon: "🏆", description: "One of the first 100 followers"},
      %{name: "Loyal Viewer", icon: "💜", description: "Watched over 100 streams"},
      %{name: "Chat Champion", icon: "💬", description: "Over 1000 chat messages"},
      %{name: "Clip Master", icon: "🎬", description: "Created over 50 clips"},
      %{name: "Generous Soul", icon: "💰", description: "Top 10 donator"},
      %{name: "Night Owl", icon: "🦉", description: "Regular late night viewer"},
      %{name: "Hype Train Conductor", icon: "🚂", description: "Started 5+ hype trains"},
      %{name: "Prediction Pro", icon: "🔮", description: "Won 10+ predictions"}
    ]

    Enum.take_random(all_badges, :rand.uniform(4) + 1)
  end

  def filter_viewers(viewers, search_term) when is_binary(search_term) and search_term != "" do
    term = String.downcase(search_term)

    Enum.filter(viewers, &viewer_matches_search(&1, term))
  end

  def filter_viewers(viewers, _), do: viewers

  defp viewer_matches_search(viewer, term) do
    Enum.any?([viewer.username, viewer.email, viewer.full_name], &String.contains?(String.downcase(&1), term))
  end
end
