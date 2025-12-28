defmodule Streampai.Stream do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Stream.BannedViewer
  alias Streampai.Stream.ChatMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamActor
  alias Streampai.Stream.StreamEvent
  alias Streampai.Stream.StreamTimer
  alias Streampai.Stream.StreamViewer

  admin do
    show? true
  end

  typescript_rpc do
    resource Livestream do
      rpc_action(:get_stream_history, :get_completed_by_user)
      rpc_action(:get_livestream, :read, get_by: [:id])
    end

    resource ChatMessage do
      rpc_action(:get_livestream_chat, :get_for_livestream)
      rpc_action(:get_chat_history, :get_for_user)
      rpc_action(:get_viewer_chat, :get_for_viewer)
    end

    resource StreamEvent do
      rpc_action(:get_livestream_events, :get_activity_events_for_livestream)
      rpc_action(:get_viewer_events, :get_for_viewer)
      rpc_action(:mark_stream_event_displayed, :mark_as_displayed)
    end

    resource StreamViewer do
      rpc_action(:list_viewers, :for_user)
      rpc_action(:search_viewers, :by_display_name)
    end

    resource BannedViewer do
      rpc_action(:list_banned_viewers, :get_active_bans)
    end

    resource StreamActor do
      rpc_action(:get_stream_actor, :get_by_user)
    end

    resource StreamTimer do
      rpc_action(:get_stream_timers, :get_for_user)
      rpc_action(:create_stream_timer, :create_timer)
      rpc_action(:start_stream_timer, :start_timer)
      rpc_action(:stop_stream_timer, :stop_timer)
      rpc_action(:delete_stream_timer, :destroy)
    end

    resource Streampai.Storage.File do
      rpc_action(:request_file_upload, :request_upload)
      rpc_action(:confirm_file_upload, :mark_uploaded)
    end
  end

  resources do
    resource BannedViewer
    resource ChatMessage
    resource Livestream
    resource Streampai.Stream.LivestreamMetric
    resource StreamActor
    resource StreamEvent
    resource Streampai.Stream.StreamSettings
    resource StreamTimer
    resource StreamViewer
    resource Streampai.Storage.File
  end
end
