defmodule Streampai.Stream.Viewer do
  @moduledoc """
  A Viewer represents a unique person across the entire platform.
  This is a global identity that can be referenced by multiple streamers
  through the StreamViewer relationship table.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "viewers"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
  end

  actions do
    defaults [:read, :destroy, :create, :update]
  end

  attributes do
    uuid_primary_key :id
    timestamps()
  end

  relationships do
    has_many :stream_viewers, Streampai.Stream.StreamViewer do
      description "Per-streamer viewer records"
    end

    has_many :chat_messages, Streampai.Stream.ChatMessage do
      description "Chat messages linked to this viewer"
    end

    has_many :stream_events, Streampai.Stream.StreamEvent do
      description "Stream events (donations, follows, etc.) linked to this viewer"
    end
  end
end
