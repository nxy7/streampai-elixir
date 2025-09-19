defmodule Streampai.Fake.Livestream do
  @moduledoc """
  Fake data generation for Livestream resources.
  Used for testing, development, and demonstrations.
  """


  @stream_titles [
    "Just Chatting with the Community",
    "Epic Gaming Session",
    "Late Night Coding",
    "Morning Coffee and Games",
    "Speedrun Attempts",
    "First Time Playing This Game",
    "Subscriber Special Stream",
    "Community Game Night",
    "Art and Chill",
    "Music Production Session",
    "React to Viewer Videos",
    "Q&A with Followers",
    "Tutorial Tuesday",
    "Weekend Gaming Marathon",
    "Collab Stream with Friends"
  ]

  @doc """
  Generates a list of fake livestream history entries.
  """
  def generate_stream_history(count \\ 15) do
    now = DateTime.utc_now()

    1..count
    |> Enum.map(fn i ->
      days_ago = :rand.uniform(30)
      started_at = DateTime.add(now, -days_ago * 24 * 60 * 60, :second)

      # Random stream duration between 1-8 hours
      duration_hours = :rand.uniform(8)
      duration_minutes = :rand.uniform(60)
      duration_seconds = (duration_hours * 3600) + (duration_minutes * 60)

      ended_at = DateTime.add(started_at, duration_seconds, :second)

      # Generate viewer metrics throughout the stream
      metrics = generate_viewer_metrics(started_at, ended_at)

      %{
        id: Ecto.UUID.generate(),
        title: Enum.random(@stream_titles),
        started_at: started_at,
        ended_at: ended_at,
        duration_seconds: duration_seconds,
        max_viewers: metrics.max_viewers,
        avg_viewers: metrics.avg_viewers,
        total_chat_messages: :rand.uniform(500) + 50,
        total_followers: :rand.uniform(20) + 1,
        total_donations: :rand.uniform(10),
        total_donation_amount: :rand.uniform(500) + 10.0,
        platform: Enum.random([:twitch, :youtube, :facebook, :kick]),
        viewer_data: metrics.viewer_data,
        thumbnail_url: "https://picsum.photos/320/180?random=#{i}"
      }
    end)
    |> Enum.sort_by(& &1.started_at, {:desc, DateTime})
  end

  @doc """
  Generates viewer metrics throughout a stream duration.
  """
  def generate_viewer_metrics(started_at, ended_at) do
    duration_minutes = DateTime.diff(ended_at, started_at, :second) |> div(60)

    # Generate data points every 5 minutes
    intervals = max(1, div(duration_minutes, 5))

    base_viewers = :rand.uniform(50) + 10
    peak_multiplier = 1.5 + (:rand.uniform(200) / 100) # 1.5x to 3.5x peak

    viewer_data =
      0..intervals
      |> Enum.map(fn i ->
        # Create a natural viewer curve - starts low, peaks in middle, drops at end
        progress = i / intervals
        curve_factor = :math.sin(progress * :math.pi())
        noise = (:rand.uniform(40) - 20) / 100 # ±20% random noise

        viewers = round(base_viewers * (1 + curve_factor * peak_multiplier + noise))
        viewers = max(1, viewers) # Ensure at least 1 viewer

        timestamp = DateTime.add(started_at, i * 5 * 60, :second)

        %{
          timestamp: timestamp,
          viewers: viewers,
          twitch_viewers: round(viewers * 0.7),
          youtube_viewers: round(viewers * 0.3)
        }
      end)

    max_viewers = viewer_data |> Enum.map(& &1.viewers) |> Enum.max()
    avg_viewers = viewer_data |> Enum.map(& &1.viewers) |> Enum.sum() |> div(length(viewer_data))

    %{
      viewer_data: viewer_data,
      max_viewers: max_viewers,
      avg_viewers: avg_viewers
    }
  end

  @doc """
  Generates statistics for the last 30 days.
  """
  def generate_monthly_stats do
    streams = generate_stream_history(20)

    now = DateTime.utc_now()
    thirty_days_ago = DateTime.add(now, -30 * 24 * 60 * 60, :second)

    recent_streams = Enum.filter(streams, fn stream ->
      DateTime.compare(stream.started_at, thirty_days_ago) == :gt
    end)

    total_duration = recent_streams
    |> Enum.map(& &1.duration_seconds)
    |> Enum.sum()
    |> div(3600) # Convert to hours

    %{
      total_streams: length(recent_streams),
      total_hours: total_duration,
      avg_viewers: if length(recent_streams) > 0 do
        recent_streams |> Enum.map(& &1.avg_viewers) |> Enum.sum() |> div(length(recent_streams))
      else
        0
      end,
      total_followers: recent_streams |> Enum.map(& &1.total_followers) |> Enum.sum(),
      total_donations: recent_streams |> Enum.map(& &1.total_donation_amount) |> Enum.sum()
    }
  end
end