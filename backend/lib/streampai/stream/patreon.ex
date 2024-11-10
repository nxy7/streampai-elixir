defmodule Streampai.Stream.Patreon do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "patreons"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]

    # read :active_pledges do
    #   filter expr(status == "active")
    # end

    # read :for_creator do
    #   argument :creator_id, :string, allow_nil?: false

    #   filter expr(creator_patreon_id == ^arg(:creator_id))
    # end

    # read :monthly_revenue do
    #   argument :creator_id, :string, allow_nil?: false

    #   filter expr(creator_patreon_id == ^arg(:creator_id) and status == "active")
    #   calculate :total_monthly, :decimal, expr(sum(pledge_amount))
    # end

    # update :cancel_pledge do
    #   accept []

    #   change set_attribute(:status, "cancelled")
    #   change set_attribute(:cancelled_at, &DateTime.utc_now/0)
    # end

    # update :pause_pledge do
    #   accept []

    #   change set_attribute(:status, "paused")
    #   change set_attribute(:paused_at, &DateTime.utc_now/0)
    # end
  end

  attributes do
    uuid_primary_key :id

    # Patreon patron info
    attribute :patron_patreon_id, :string do
      allow_nil? false
    end

    attribute :patron_name, :string do
      allow_nil? false
      constraints max_length: 100
    end

    attribute :patron_email, :string do
      allow_nil? true
      constraints max_length: 255
    end

    # Creator info
    attribute :creator_patreon_id, :string do
      allow_nil? false
    end

    # Pledge details
    attribute :pledge_amount, :decimal do
      allow_nil? false
      # $999,999.99 max
      # constraints precision: 8, scale: 2
    end

    attribute :currency, :string do
      allow_nil? false
      default "USD"
      constraints max_length: 3
    end

    # Which tier/reward they pledged to
    attribute :tier_id, :string do
      allow_nil? true
    end

    attribute :tier_title, :string do
      allow_nil? true
      constraints max_length: 255
    end

    attribute :tier_description, :string do
      allow_nil? true
    end

    # Status tracking
    attribute :status, :string do
      allow_nil? false
      default "active"
      # constraints one_of: ["active", "paused", "cancelled", "declined"]
    end

    # Patreon's internal IDs
    attribute :patreon_pledge_id, :string do
      allow_nil? false
    end

    attribute :patreon_campaign_id, :string do
      allow_nil? false
    end

    # Important dates
    attribute :pledge_created_at, :utc_datetime do
      allow_nil? false
    end

    attribute :last_charge_date, :utc_datetime do
      allow_nil? true
    end

    attribute :next_charge_date, :utc_datetime do
      allow_nil? true
    end

    attribute :cancelled_at, :utc_datetime do
      allow_nil? true
    end

    attribute :paused_at, :utc_datetime do
      allow_nil? true
    end

    # Lifetime value
    attribute :lifetime_support_cents, :integer do
      allow_nil? false
      default 0
    end

    attribute :pledge_relationship_start, :utc_datetime do
      allow_nil? true
    end

    # Patreon webhook/API metadata
    attribute :patreon_metadata, :map do
      default %{}
    end

    timestamps()
  end

  relationships do
    # Link to our internal user if they're registered
    belongs_to :patron_user, Streampai.Accounts.User do
      allow_nil? true
    end

    belongs_to :creator_user, Streampai.Accounts.User do
      allow_nil? true
    end
  end

  identities do
    # One pledge record per patron-creator pair
    identity :unique_patron_creator, [:patron_patreon_id, :creator_patreon_id]

    # Patreon's unique pledge ID
    identity :unique_patreon_pledge, [:patreon_pledge_id]
  end

  calculations do
    calculate :monthly_value_category,
              :string,
              expr(
                cond do
                  # $100+
                  pledge_amount >= 100 -> "whale"
                  # $50-99
                  pledge_amount >= 50 -> "champion"
                  # $25-49
                  pledge_amount >= 25 -> "supporter"
                  # $10-24
                  pledge_amount >= 10 -> "fan"
                  # $5-9
                  pledge_amount >= 5 -> "friend"
                  # <$5
                  true -> "supporter"
                end
              )

    calculate :is_active, :boolean, expr(status == "active")
  end
end
