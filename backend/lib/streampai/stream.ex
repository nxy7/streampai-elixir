defmodule Streampai.Stream do
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Streampai.Stream.ChatMessage
    resource Streampai.Stream.StreamEvent
    resource Streampai.Stream.StreamMetric
    resource Streampai.Stream.StreamDonation
    resource Streampai.Stream.Patreon
    resource Streampai.Stream.Raid
  end
end
