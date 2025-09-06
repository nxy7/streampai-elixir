# TODO make this module reuse the same table as StreamEvent

# defmodule Streampai.Stream.ChatMessage do
#   use Ash.Resource,
#     otp_app: :streampai,
#     domain: Streampai.Stream,
#     data_layer: AshPostgres.DataLayer

#   postgres do
#     table "chat_messages"
#     repo Streampai.Repo
#   end

#   actions do
#     defaults [:read, :destroy, create: :*, update: :*]
#   end

#   attributes do
#     uuid_primary_key :id

#     attribute :message, :string do
#       allow_nil? false
#       constraints max_length: 500
#     end

#     attribute :username, :string do
#       allow_nil? false
#       constraints max_length: 100
#     end

#     attribute :platform, Streampai.Stream.Platform do
#       allow_nil? false
#     end

#     attribute :channel_id, :string do
#       allow_nil? false
#     end

#     attribute :is_moderator, :boolean do
#       default false
#     end

#     attribute :is_patreon, :boolean do
#       default false
#     end

#     timestamps()
#   end

#   relationships do
#     belongs_to :user, Streampai.Accounts.User do
#       allow_nil? false
#       attribute_writable? true
#     end

#     belongs_to :livestream, Streampai.Stream.Livestream do
#       allow_nil? false
#       attribute_writable? true
#     end
#   end
# end
