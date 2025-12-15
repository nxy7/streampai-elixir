defmodule StreampaiWeb.GraphQL.Schema do
  @moduledoc """
  GraphQL schema for Streampai.
  """
  use Absinthe.Schema

  use AshGraphql,
    domains: [Streampai.Accounts, Streampai.Stream],
    generate_sdl_file: "./frontend/schema.graphql",
    auto_generate_sdl_file?: true

  object :donation_event do
    field :id, :id
    field :amount, :float
    field :currency, :string
    field :username, :string
    field :message, :string
    field :timestamp, :datetime
    field :platform, :string
  end

  object :follower_event do
    field :id, :id
    field :username, :string
    field :timestamp, :datetime
    field :platform, :string
  end

  object :subscriber_event do
    field :id, :id
    field :username, :string
    field :tier, :string
    field :months, :integer
    field :message, :string
    field :timestamp, :datetime
    field :platform, :string
  end

  object :raid_event do
    field :id, :id
    field :username, :string
    field :viewer_count, :integer
    field :timestamp, :datetime
    field :platform, :string
  end

  object :cheer_event do
    field :id, :id
    field :username, :string
    field :bits, :integer
    field :message, :string
    field :timestamp, :datetime
    field :platform, :string
  end

  object :chat_message_event do
    field :id, :id
    field :username, :string
    field :message, :string
    field :timestamp, :datetime
    field :platform, :string
    field :is_moderator, :boolean
    field :is_subscriber, :boolean
  end

  object :viewer_count_event do
    field :count, :integer
    field :timestamp, :datetime
    field :platform, :string
  end

  object :goal_progress_event do
    field :goal_id, :id
    field :current_amount, :float
    field :target_amount, :float
    field :percentage, :float
    field :timestamp, :datetime
  end

  query do
  end

  mutation do
  end

  subscription do
    field :donation_received, :donation_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:donation:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :follower_added, :follower_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:follower:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :subscriber_added, :subscriber_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:subscriber:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :raid_received, :raid_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:raid:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :cheer_received, :cheer_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:cheer:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :chat_message, :chat_message_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:chat:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :viewer_count_updated, :viewer_count_event do
      arg(:user_id, non_null(:id))

      config(fn args, _info ->
        {:ok, topic: "widget_events:viewer_count:#{args.user_id}"}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end

    field :goal_progress, :goal_progress_event do
      arg(:user_id, non_null(:id))
      arg(:goal_id, :id)

      config(fn args, _info ->
        topic =
          if args[:goal_id] do
            "widget_events:goal:#{args.user_id}:#{args.goal_id}"
          else
            "widget_events:goal:#{args.user_id}"
          end

        {:ok, topic: topic}
      end)

      resolve(fn event, _, _ ->
        {:ok, event}
      end)
    end
  end
end
