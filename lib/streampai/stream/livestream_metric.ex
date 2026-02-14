defmodule Streampai.Stream.LivestreamMetric do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "livestream_metrics"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      primary? true

      accept [
        :livestream_id,
        :youtube_viewers,
        :twitch_viewers,
        :facebook_viewers,
        :kick_viewers,
        :input_bitrate_kbps
      ]
    end
  end

  attributes do
    attribute :livestream_id, :uuid do
      primary_key? true
      allow_nil? false
    end

    attribute :youtube_viewers, :integer do
      allow_nil? false
      default 0
    end

    attribute :twitch_viewers, :integer do
      allow_nil? false
      default 0
    end

    attribute :facebook_viewers, :integer do
      allow_nil? false
      default 0
    end

    attribute :kick_viewers, :integer do
      allow_nil? false
      default 0
    end

    attribute :input_bitrate_kbps, :integer do
      allow_nil? true
    end

    attribute :created_at, :utc_datetime do
      primary_key? true
      allow_nil? false
      default &DateTime.utc_now/0
    end
  end

  @doc """
  Calculates total viewers across all platforms for a metric.
  """
  def total_viewers(metric) do
    (metric.youtube_viewers || 0) +
      (metric.twitch_viewers || 0) +
      (metric.facebook_viewers || 0) +
      (metric.kick_viewers || 0)
  end
end
