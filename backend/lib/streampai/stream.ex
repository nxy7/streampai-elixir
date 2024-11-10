defmodule Streampai.Stream do
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    # resource Streampai.Stream.ChatMessage
    resource Streampai.Stream.StreamEvent
    resource Streampai.Stream.LivestreamMetric
    resource Streampai.Stream.Livestream
    resource Streampai.Stream.StreamSettings
  end
end
