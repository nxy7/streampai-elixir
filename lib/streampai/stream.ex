defmodule Streampai.Stream do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Streampai.Stream.ChatMessage
    resource Streampai.Stream.StreamEvent
    resource Streampai.Stream.LivestreamMetric
    resource Streampai.Stream.Livestream
    resource Streampai.Stream.StreamSettings
    resource Streampai.Stream.StreamViewer
    resource Streampai.Storage.File
  end
end
