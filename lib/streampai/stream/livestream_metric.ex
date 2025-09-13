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

  actions do
    defaults [:read, :destroy, create: :*, update: :*]
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

    attribute :created_at, :utc_datetime do
      primary_key? true
      allow_nil? false
      default &DateTime.utc_now/0
    end
  end
end
