defmodule Streampai.Stream do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Stream.BannedViewer
  alias Streampai.Stream.ChatBotConfig
  alias Streampai.Stream.CurrentStreamData
  alias Streampai.Stream.HighlightedMessage
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamAction
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

    resource StreamEvent do
      rpc_action(:get_livestream_events, :get_activity_events_for_livestream)
      rpc_action(:get_viewer_events, :get_for_viewer)
      rpc_action(:mark_stream_event_displayed, :mark_as_displayed)
      rpc_action(:get_chat_history, :get_chat_for_user)
      rpc_action(:get_livestream_chat, :get_chat_for_livestream)
      rpc_action(:get_viewer_chat, :get_chat_for_viewer)
      rpc_action(:replay_alert, :replay_alert)
    end

    resource StreamViewer do
      rpc_action(:list_viewers, :for_user)
      rpc_action(:search_viewers, :by_display_name)
    end

    resource BannedViewer do
      rpc_action(:list_banned_viewers, :get_active_bans)
    end

    resource CurrentStreamData do
      rpc_action(:get_current_stream_data, :get_by_user)
      rpc_action(:highlight_stream_message, :highlight_message)
      rpc_action(:clear_stream_highlight, :clear_highlight)
    end

    resource StreamTimer do
      rpc_action(:get_stream_timers, :get_for_user)
      rpc_action(:create_stream_timer, :create_timer)
      rpc_action(:update_stream_timer, :update)
      rpc_action(:enable_stream_timer, :enable_timer)
      rpc_action(:disable_stream_timer, :disable_timer)
      rpc_action(:delete_stream_timer, :destroy)
    end

    resource HighlightedMessage do
      rpc_action(:highlight_message, :highlight_message)
      rpc_action(:clear_highlight, :clear_highlight)
      rpc_action(:get_highlighted_message, :get_for_user)
    end

    resource ChatBotConfig do
      rpc_action(:get_chat_bot_config, :get_for_user)
      rpc_action(:upsert_chat_bot_config, :upsert)
      rpc_action(:update_chat_bot_config, :update)
    end

    resource StreamAction do
      rpc_action(:go_live, :start_stream)
      rpc_action(:stop_stream, :stop_stream)
      rpc_action(:update_stream_metadata, :update_stream_metadata)
      rpc_action(:send_stream_message, :send_message)
      rpc_action(:toggle_platform, :toggle_platform)
    end
  end

  resources do
    resource BannedViewer
    resource ChatBotConfig
    resource HighlightedMessage
    resource Livestream
    resource Streampai.Stream.LivestreamMetric
    resource CurrentStreamData
    resource StreamEvent
    resource Streampai.Stream.StreamSettings
    resource Streampai.Stream.StreamStateEvent
    resource StreamTimer
    resource StreamViewer
  end
end
