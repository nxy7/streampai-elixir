defmodule StreampaiWeb.Utils.FakeAnalytics do
  @moduledoc false

  def generate_overall_stats(timeframe \\ :week) do
    base_viewers =
      case timeframe do
        :day -> 500..2000
        :week -> 3000..15_000
        :month -> 10_000..50_000
        :year -> 100_000..500_000
        _ -> 1000..5000
      end

    %{
      total_viewers: Enum.random(base_viewers),
      unique_viewers: (base_viewers.first * 0.3)..(base_viewers.last * 0.4) |> Enum.random() |> round(),
      peak_viewers: (base_viewers.first * 0.15)..(base_viewers.last * 0.2) |> Enum.random() |> round(),
      average_watch_time: Enum.random(15..45),
      total_income: Float.round(Enum.random(500..5000) + :rand.uniform() * 100, 2),
      donations: Float.round(Enum.random(100..2000) + :rand.uniform() * 50, 2),
      subscriptions: Float.round(Enum.random(200..1500) + :rand.uniform() * 30, 2),
      bits: Float.round(Enum.random(50..500) + :rand.uniform() * 20, 2),
      ads_revenue: Float.round(Enum.random(100..800) + :rand.uniform() * 40, 2),
      total_streams: Enum.random(5..30),
      total_hours_streamed: Enum.random(10..200),
      engagement_rate: Float.round(2.5 + :rand.uniform() * 3.5, 2),
      new_followers: Enum.random(50..500),
      chat_messages: Enum.random(500..5000)
    }
  end

  def generate_stream_list do
    platforms = ["Twitch", "YouTube", "Facebook", "Kick"]

    games = [
      "Just Chatting",
      "Valorant",
      "League of Legends",
      "Minecraft",
      "Fortnite",
      "Among Us",
      "CS:GO",
      "Apex Legends"
    ]

    1..10
    |> Enum.map(fn i ->
      start_time = DateTime.add(DateTime.utc_now(), -i * 86_400 - Enum.random(0..86_400), :second)
      duration_hours = Enum.random(1..8)

      %{
        id: "stream_#{i}",
        title: "#{Enum.random(["Epic", "Chill", "Intense", "Fun"])} #{Enum.random(games)} Stream ##{100 + i}",
        platform: Enum.random(platforms),
        game: Enum.random(games),
        start_time: start_time,
        end_time: DateTime.add(start_time, duration_hours * 3600, :second),
        duration: duration_hours,
        viewers: %{
          peak: Enum.random(100..5000),
          average: Enum.random(50..2000),
          unique: Enum.random(200..8000)
        },
        income: %{
          total: Float.round(Enum.random(50..1000) + :rand.uniform() * 50, 2),
          donations: Float.round(Enum.random(20..400) + :rand.uniform() * 20, 2),
          subscriptions: Float.round(Enum.random(10..300) + :rand.uniform() * 15, 2),
          bits: Float.round(Enum.random(5..200) + :rand.uniform() * 10, 2)
        },
        engagement: %{
          chat_messages: Enum.random(100..5000),
          new_followers: Enum.random(5..200),
          engagement_rate: Float.round(1.5 + :rand.uniform() * 4.5, 2)
        }
      }
    end)
    |> Enum.sort_by(& &1.start_time, {:desc, DateTime})
  end

  def generate_time_series_data(metric, days \\ 7) do
    now = DateTime.utc_now()

    0..(days * 24 - 1)
    |> Enum.map(fn hours_ago ->
      time = DateTime.add(now, -hours_ago * 3600, :second)

      value =
        case metric do
          :viewers ->
            base =
              if rem(hours_ago, 24) in 18..23 or rem(hours_ago, 24) in 0..2 do
                Enum.random(500..2000)
              else
                Enum.random(100..500)
              end

            if rem(hours_ago, 6) == 0, do: base * 2, else: base

          :income ->
            if rem(hours_ago, 24) in 18..23 do
              Enum.random(20..100) + :rand.uniform() * 20
            else
              Enum.random(5..30) + :rand.uniform() * 10
            end

          :followers ->
            if rem(hours_ago, 24) in 18..23 do
              Enum.random(5..30)
            else
              Enum.random(1..10)
            end

          :engagement ->
            2.0 + :rand.uniform() * 3.0 + if rem(hours_ago, 12) == 0, do: 2.0, else: 0

          _ ->
            Enum.random(10..100)
        end

      %{
        time: time,
        value: value
      }
    end)
    |> Enum.reverse()
  end

  def generate_platform_breakdown do
    platforms = ["Twitch", "YouTube", "Facebook", "Kick"]
    total_viewers = Enum.random(5000..20_000)

    percentages = Enum.shuffle([0.45, 0.30, 0.15, 0.10])

    platforms
    |> Enum.zip(percentages)
    |> Enum.map(fn {platform, percentage} ->
      viewers = round(total_viewers * percentage)

      %{
        platform: platform,
        viewers: viewers,
        percentage: percentage * 100,
        income: viewers * (0.05 + :rand.uniform() * 0.15),
        engagement_rate: 2.0 + :rand.uniform() * 4.0
      }
    end)
  end

  def generate_top_content do
    games = [
      "Valorant",
      "League of Legends",
      "Minecraft",
      "Fortnite",
      "Among Us",
      "CS:GO",
      "Apex Legends",
      "Just Chatting"
    ]

    games
    |> Enum.take(5)
    |> Enum.map(fn game ->
      %{
        game: game,
        streams: Enum.random(2..15),
        total_hours: Enum.random(5..50),
        average_viewers: Enum.random(200..2000),
        peak_viewers: Enum.random(500..5000),
        income: Enum.random(100..2000) + :rand.uniform() * 100
      }
    end)
    |> Enum.sort_by(& &1.average_viewers, :desc)
  end

  def generate_demographics do
    %{
      age_groups: [
        %{range: "13-17", percentage: 15},
        %{range: "18-24", percentage: 35},
        %{range: "25-34", percentage: 30},
        %{range: "35-44", percentage: 15},
        %{range: "45+", percentage: 5}
      ],
      gender: [
        %{type: "Male", percentage: 65},
        %{type: "Female", percentage: 30},
        %{type: "Other", percentage: 5}
      ],
      top_countries: [
        %{country: "United States", percentage: 35, viewers: Enum.random(1000..5000)},
        %{country: "United Kingdom", percentage: 15, viewers: Enum.random(500..2000)},
        %{country: "Canada", percentage: 10, viewers: Enum.random(300..1500)},
        %{country: "Germany", percentage: 8, viewers: Enum.random(200..1000)},
        %{country: "France", percentage: 7, viewers: Enum.random(200..900)}
      ]
    }
  end
end
