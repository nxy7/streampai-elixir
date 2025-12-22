defmodule Streampai.Stream do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshGraphql.Domain]

  alias Streampai.Stream.BannedViewer
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamViewer

  admin do
    show? true
  end

  graphql do
    queries do
      list ChatMessage, :chat_history, :get_for_user
      list ChatMessage, :livestream_chat, :get_for_livestream
      list ChatMessage, :viewer_chat, :get_for_viewer

      list StreamViewer, :viewers, :for_user
      list StreamViewer, :search_viewers, :by_display_name

      list BannedViewer, :banned_viewers, :get_active_bans

      list Livestream, :stream_history, :get_completed_by_user
      get Livestream, :livestream, :read

      list StreamEvent, :livestream_events, :get_activity_events_for_livestream

      list StreamEvent, :viewer_events, :get_for_viewer
    end

  end

  resources do
    resource BannedViewer
    resource ChatMessage
    resource StreamEvent
    resource Streampai.Stream.LivestreamMetric
    resource Livestream
    resource Streampai.Stream.StreamSettings
    resource StreamViewer
    resource Streampai.Storage.File
  end
end
