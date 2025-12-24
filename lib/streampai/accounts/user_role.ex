defmodule Streampai.Accounts.UserRole do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  alias Streampai.Accounts.User

  admin do
    actor? true
  end

  postgres do
    table "user_roles"
    repo Streampai.Repo

    identity_wheres_to_sql unique_active_role: "revoked_at IS NULL AND role_status = 'accepted'"

    # Add indexes for common queries
    custom_indexes do
      index [:user_id, :role_status, :revoked_at],
        name: "idx_user_roles_user_active",
        where: "role_status = 'accepted' AND revoked_at IS NULL"

      index [:granter_id, :role_status, :revoked_at],
        name: "idx_user_roles_granter_active",
        where: "role_status = 'accepted' AND revoked_at IS NULL"

      index [:user_id, :role_status],
        name: "idx_user_roles_user_pending",
        where: "role_status = 'pending' AND revoked_at IS NULL"
    end
  end

  typescript do
    type_name "UserRole"
  end

  code_interface do
    define :invite_role, action: :invite
    define :accept_role, action: :accept
    define :decline_role, action: :decline
    define :revoke_role, action: :revoke
    define :get_user_roles_for_granter
    define :get_user_roles_for_user
    define :get_pending_invitations
    define :check_permission
  end

  actions do
    defaults [:read, :destroy]

    read :get_user_roles_for_granter do
      argument :granter_id, :uuid, allow_nil?: false

      filter expr(granter_id == ^arg(:granter_id) and role_status == :accepted and is_nil(revoked_at))

      # Optimize for common preloading patterns
      prepare build(load: [:user])
    end

    read :get_user_roles_for_user do
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and role_status == :accepted and is_nil(revoked_at))

      # Optimize for common preloading patterns
      prepare build(load: [:granter])
    end

    read :get_pending_invitations do
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and role_status == :pending and is_nil(revoked_at))

      # Order by granted_at to show newest invitations first
      prepare build(sort: [granted_at: :desc])
      prepare build(load: [:granter])
    end

    read :check_permission do
      argument :user_id, :uuid, allow_nil?: false
      argument :granter_id, :uuid, allow_nil?: false
      argument :role_type, :atom, allow_nil?: false

      filter expr(
               user_id == ^arg(:user_id) and
                 granter_id == ^arg(:granter_id) and
                 role_type == ^arg(:role_type) and
                 role_status == :accepted and
                 is_nil(revoked_at)
             )
    end

    read :active_roles do
      filter expr(role_status == :accepted and is_nil(revoked_at))

      prepare build(load: [:user, :granter])
    end

    read :expiring_soon do
      argument :days_ahead, :integer, default: 30

      # For future use if roles have expiration dates
      filter expr(role_status == :accepted and is_nil(revoked_at))
    end

    create :invite do
      argument :user_id, :uuid, allow_nil?: false
      argument :granter_id, :uuid, allow_nil?: false
      argument :role_type, :atom, allow_nil?: false

      change set_attribute(:user_id, arg(:user_id))
      change set_attribute(:granter_id, arg(:granter_id))
      change set_attribute(:role_type, arg(:role_type))
      change set_attribute(:role_status, :pending)
      change set_attribute(:granted_at, &DateTime.utc_now/0)
      change Streampai.Accounts.UserRole.Changes.NotifyOnInvite

      validate attribute_does_not_equal(:user_id, :granter_id)
      validate present([:user_id])
      validate present([:granter_id])
      validate present([:role_type])
    end

    update :accept do
      require_atomic? false
      change set_attribute(:role_status, :accepted)
      change set_attribute(:accepted_at, &DateTime.utc_now/0)
      change Streampai.Accounts.UserRole.Changes.NotifyOnAccept
    end

    update :decline do
      # Can only decline pending invitations
      change set_attribute(:role_status, :declined)
    end

    update :revoke do
      require_atomic? false
      change set_attribute(:revoked_at, &DateTime.utc_now/0)
      change Streampai.Accounts.UserRole.Changes.NotifyOnRevoke
    end
  end

  policies do
    policy action(:invite) do
      # For create actions, we need to use actor context checks
      authorize_if actor_present()
    end

    policy action(:accept) do
      # Only the user who was invited can accept
      authorize_if expr(^actor(:id) == user_id)
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action(:decline) do
      # Only the user who was invited can decline
      authorize_if expr(^actor(:id) == user_id)
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action(:revoke) do
      # Only the granter can revoke roles they granted
      authorize_if expr(^actor(:id) == granter_id)
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action(:check_permission) do
      authorize_if always()
    end

    policy action(:get_pending_invitations) do
      # Only the user can see their own pending invitations
      authorize_if expr(^actor(:id) == ^arg(:user_id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:read) do
      authorize_if expr(^actor(:id) == user_id)
      authorize_if expr(^actor(:id) == granter_id)
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:destroy) do
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :user_id, :uuid do
      public? true
      allow_nil? false
    end

    attribute :granter_id, :uuid do
      public? true
      allow_nil? false
    end

    attribute :role_type, :atom do
      public? true
      allow_nil? false
      constraints one_of: [:moderator, :manager]
    end

    attribute :role_status, :atom do
      public? true
      allow_nil? false
      default :pending
      constraints one_of: [:pending, :accepted, :declined]
    end

    attribute :granted_at, :utc_datetime_usec do
      public? true
      allow_nil? false
    end

    attribute :accepted_at, :utc_datetime_usec do
      public? true
      allow_nil? true
    end

    attribute :revoked_at, :utc_datetime_usec do
      public? true
      allow_nil? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, User do
      source_attribute :user_id
      destination_attribute :id
    end

    belongs_to :granter, User do
      source_attribute :granter_id
      destination_attribute :id
    end
  end

  identities do
    identity :unique_active_role, [:user_id, :granter_id, :role_type],
      where: expr(is_nil(revoked_at) and role_status == :accepted),
      message: "User already has an accepted role of this type from this granter"
  end
end
