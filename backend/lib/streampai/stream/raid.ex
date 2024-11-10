defmodule Streampai.Stream.Raid do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "raids"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]

    read :incoming_raids do
      argument :target_channel_id, :string, allow_nil?: false

      filter expr(target_channel_id == ^arg(:target_channel_id))
    end

    read :outgoing_raids do
      argument :raider_channel_id, :string, allow_nil?: false

      filter expr(raider_channel_id == ^arg(:raider_channel_id))
    end

    # read :biggest_raids do
    #   argument :channel_id, :string, allow_nil?: false
    #   argument :direction, :atom, constraints: [one_of: [:incoming, :outgoing]]

    #   prepare fn query, _context ->
    #     case Ash.Query.get_argument(query, :direction) do
    #       :incoming ->
    #         Ash.Query.filter(query, target_channel_id == ^Ash.Query.get_argument(query, :channel_id))
    #       :outgoing ->
    #         Ash.Query.filter(query, raider_channel_id == ^Ash.Query.get_argument(query, :channel_id))
    #     end
    #   end

    #   # limit 10
    # end
  end

  attributes do
    uuid_primary_key :id

    # Who initiated the raid
    attribute :raider_channel_id, :string do
      allow_nil? false
    end

    attribute :raider_username, :string do
      allow_nil? false
      constraints max_length: 100
    end

    # Who received the raid
    attribute :target_channel_id, :string do
      allow_nil? false
    end

    attribute :target_username, :string do
      allow_nil? false
      constraints max_length: 100
    end

    # How many viewers came over
    attribute :viewer_count, :integer do
      allow_nil? false
      constraints min: 1
    end

    attribute :platform, Streampai.Stream.Platform do
      allow_nil? false
    end

    attribute :platform_raid_id, :string do
      # Some platforms don't provide IDs
      allow_nil? true
      constraints max_length: 255
    end

    # Optional raid message
    attribute :message, :string do
      allow_nil? true
      constraints max_length: 500
    end

    # Platform-specific data
    attribute :platform_metadata, :map do
      default %{}
    end

    timestamps()
  end

  relationships do
    # Link to our users if they're registered
    belongs_to :raider_user, Streampai.Accounts.User do
      allow_nil? true
    end

    belongs_to :target_user, Streampai.Accounts.User do
      allow_nil? true
    end
  end

  calculations do
    calculate :raid_size_category,
              :string,
              expr(
                cond do
                  viewer_count >= 1000 -> "massive"
                  viewer_count >= 500 -> "huge"
                  viewer_count >= 100 -> "large"
                  viewer_count >= 50 -> "medium"
                  true -> "small"
                end
              )
  end
end
