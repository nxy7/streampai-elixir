defmodule StreampaiWeb.GraphQL.Schema do
  @moduledoc """
  GraphQL schema for Streampai.
  """
  use Absinthe.Schema

  use AshGraphql,
    domains: [Streampai.Accounts, Streampai.Stream],
    generate_sdl_file: "./frontend/schema.graphql",
    auto_generate_sdl_file?: true

  alias StreampaiWeb.GraphQL.Resolvers.FileResolver
  alias StreampaiWeb.GraphQL.Resolvers.PreferencesResolver

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

  input_object :upload_header do
    field :key, non_null(:string)
    field :value, non_null(:string)
  end

  object :file_upload_response do
    field :id, non_null(:id)
    field :upload_url, non_null(:string)
    field :upload_headers, non_null(list_of(:upload_header_output))
    field :max_size, non_null(:integer)
  end

  object :upload_header_output do
    field :key, non_null(:string)
    field :value, non_null(:string)
  end

  object :confirm_upload_response do
    field :id, non_null(:id)
    field :url, non_null(:string)
  end

  object :user_preferences do
    field :user_id, non_null(:id), do: resolve(fn parent, _, _ -> {:ok, parent.user_id} end)
    field :email_notifications, non_null(:boolean)
    field :min_donation_amount, :integer
    field :max_donation_amount, :integer
    field :donation_currency, non_null(:string)
    field :default_voice, :string
    field :inserted_at, non_null(:datetime)
    field :updated_at, non_null(:datetime)
  end

  object :update_name_result do
    field :id, non_null(:id)
    field :name, non_null(:string)
  end

  query do
  end

  mutation do
    @desc "Request a presigned URL for file upload"
    field :request_file_upload, :file_upload_response do
      arg(:filename, non_null(:string))
      arg(:content_type, :string)
      arg(:file_type, non_null(:string))
      arg(:estimated_size, non_null(:integer))

      resolve(&FileResolver.request_upload/3)
    end

    @desc "Confirm a file was uploaded successfully"
    field :confirm_file_upload, :confirm_upload_response do
      arg(:file_id, non_null(:id))
      arg(:content_hash, :string)

      resolve(&FileResolver.confirm_upload/3)
    end

    @desc "Save donation settings (creates preferences if they don't exist)"
    field :save_donation_settings, :user_preferences do
      arg(:min_amount, :integer)
      arg(:max_amount, :integer)
      arg(:currency, :string)
      arg(:default_voice, :string)

      resolve(&PreferencesResolver.save_donation_settings/3)
    end

    @desc "Toggle email notifications on/off"
    field :toggle_email_notifications, :user_preferences do
      resolve(&PreferencesResolver.toggle_email_notifications/3)
    end

    @desc "Update user display name"
    field :update_name, :update_name_result do
      arg(:name, non_null(:string))

      resolve(&StreampaiWeb.GraphQL.Resolvers.UserResolver.update_name/3)
    end
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
