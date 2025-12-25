defmodule Streampai.Accounts.User do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [
      AshAuthentication,
      AshAdmin.Resource,
      AshOban,
      AshTypescript.Resource
    ],
    data_layer: AshPostgres.DataLayer

  alias AshAuthentication.Strategy.OAuth2.IdentityChange
  alias AshAuthentication.Strategy.Password.HashPasswordChange
  alias AshAuthentication.Strategy.Password.PasswordConfirmationValidation
  alias Streampai.Accounts.DefaultUsername
  alias Streampai.Accounts.User
  alias Streampai.Accounts.User.Changes.SavePlatformData
  alias Streampai.Accounts.User.Changes.ValidateOAuthConfirmation
  alias Streampai.Accounts.User.Preparations.ExtendUserData
  alias Streampai.Accounts.User.Preparations.LoadModeratorStatus
  alias Streampai.Accounts.UserRole

  admin do
    actor? true
  end

  authentication do
    tokens do
      enabled? true
      token_resource Streampai.Accounts.Token
      signing_secret Streampai.Secrets
      require_token_presence_for_authentication? false
      session_identifier :jti
    end

    strategies do
      google do
        client_id Streampai.Secrets
        client_secret Streampai.Secrets
        redirect_uri Streampai.Secrets
      end

      oidc :twitch do
        client_id Streampai.Secrets
        client_secret Streampai.Secrets
        redirect_uri Streampai.Secrets
        base_url "https://id.twitch.tv"
        client_authentication_method "client_secret_post"

        authorization_params scope: "openid user:read:email",
                             claims:
                               ~s/{"id_token":{"email":null,"email_verified":null,"preferred_username":null,"picture":null},"userinfo":{"email":null,"email_verified":null,"preferred_username":null,"picture":null}}/

        openid_configuration %{
          "issuer" => "https://id.twitch.tv/oauth2",
          "authorization_endpoint" => "https://id.twitch.tv/oauth2/authorize",
          "token_endpoint" => "https://id.twitch.tv/oauth2/token",
          "userinfo_endpoint" => "https://id.twitch.tv/oauth2/userinfo",
          "jwks_uri" => "https://id.twitch.tv/oauth2/keys",
          "response_types_supported" => ["code"],
          "subject_types_supported" => ["public"],
          "id_token_signing_alg_values_supported" => ["RS256"],
          "scopes_supported" => ["openid", "user:read:email", "user:read:subscriptions"],
          "claims_supported" => [
            "sub",
            "email",
            "email_verified",
            "preferred_username",
            "picture"
          ]
        }
      end

      password :password do
        identity_field :email

        resettable do
          sender Streampai.Accounts.User.Senders.SendPasswordResetEmail
        end
      end
    end

    add_ons do
      confirmation :confirm_new_user do
        monitor_fields [:email]
        confirm_on_create? true
        confirm_on_update? false
        require_interaction? true
        sender Streampai.Accounts.User.Senders.SendNewUserConfirmationEmail
      end
    end
  end

  postgres do
    table "users"
    repo Streampai.Repo
  end

  oban do
    triggers do
      trigger :reconcile_subscriptions do
        action :reconcile_subscription

        scheduler_cron "@daily"
        max_attempts 3

        queue :default
        worker_module_name User.AshOban.Worker.ReconcileSubscriptions
        scheduler_module_name User.AshOban.Scheduler.ReconcileSubscriptions
      end
    end
  end

  typescript do
    type_name("User")
  end

  code_interface do
    define :get_by_id
    define :get_by_id_minimal
    define :check_name_availability, args: [:name]
    define :get_by_name, args: [:name]
    define :register_with_password
    define :update_avatar, args: [:file_id]
    define :update_name
    define :toggle_email_notifications
    define :update_donation_settings, args: [:min_amount, :max_amount, :currency, :default_voice]
  end

  actions do
    defaults [:read, :destroy]

    read :get do
      prepare build(load: [:tier, :connected_platforms])
    end

    read :list_paginated do
      argument :page, :integer, default: 1
      argument :page_size, :integer, default: 20

      prepare fn query, _context ->
        page = Ash.Query.get_argument(query, :page) || 1
        page_size = Ash.Query.get_argument(query, :page_size) || 20
        offset = (page - 1) * page_size

        query
        |> Ash.Query.load([:role, :display_avatar])
        |> Ash.Query.limit(page_size)
        |> Ash.Query.offset(offset)
      end
    end

    read :list_all do
      prepare build(sort: [id: :desc], load: [:role, :display_avatar, :tier])

      pagination do
        required? false
        offset? false
        keyset? true
        countable false
        default_limit 20
        max_page_size 100
      end
    end

    read :get_by_id do
      get? true

      argument :id, :string do
        allow_nil? false
      end

      prepare build(
                load: [
                  :tier,
                  :connected_platforms,
                  :role,
                  :streaming_accounts,
                  :display_avatar,
                  :granted_roles,
                  :storage_quota,
                  :storage_used_percent,
                  :hours_streamed_last30_days,
                  :is_moderator
                ]
              )

      prepare LoadModeratorStatus

      filter expr(id == ^arg(:id))
    end

    read :get_by_id_minimal do
      description "Get user by ID with minimal data for authentication/authorization"
      get? true

      argument :id, :string do
        allow_nil? false
      end

      prepare build(load: [:role, :granted_roles])
      prepare LoadModeratorStatus

      filter expr(id == ^arg(:id))
    end

    read :get_user_info do
      description "Get basic user info (name and avatar) by ID - for enriching role data"
      get? true

      argument :id, :string do
        allow_nil? false
      end

      prepare build(load: [:display_avatar], select: [:id, :name])

      filter expr(id == ^arg(:id))
    end

    read :get_by_subject do
      description "Get a user by the subject claim in a JWT"
      argument :subject, :string, allow_nil?: false

      get? true

      prepare AshAuthentication.Preparations.FilterBySubject

      prepare ExtendUserData
    end

    read :current_user do
      description "Get the current authenticated user"
      get? true
      filter expr(id == ^actor(:id))

      prepare ExtendUserData
    end

    create :register_with_google do
      argument :user_info, :map, allow_nil?: false
      argument :oauth_tokens, :map, allow_nil?: false
      upsert? true
      upsert_identity :unique_email

      change AshAuthentication.GenerateTokenChange
      change IdentityChange
      change {SavePlatformData, platform_name: "google"}
      change DefaultUsername

      upsert_fields [:extra_data]
      change set_attribute(:confirmed_at, &DateTime.utc_now/0)
      change ValidateOAuthConfirmation
    end

    create :register_with_twitch do
      argument :user_info, :map, allow_nil?: false
      argument :oauth_tokens, :map, allow_nil?: false
      upsert? true
      upsert_identity :unique_email

      change AshAuthentication.GenerateTokenChange
      change IdentityChange
      change {SavePlatformData, platform_name: "twitch"}
      change DefaultUsername

      upsert_fields [:extra_data]
      change set_attribute(:confirmed_at, &DateTime.utc_now/0)
      change ValidateOAuthConfirmation
    end

    read :sign_in_with_password do
      description "Attempt to sign in using a email and password."
      get? true

      argument :email, :string do
        description "The email to use for retrieving the user."
        allow_nil? false
      end

      argument :password, :string do
        description "The password to check for the matching user."
        allow_nil? false
        sensitive? true
      end

      prepare AshAuthentication.Strategy.Password.SignInPreparation

      metadata :token, :string do
        description "A JWT that can be used to authenticate the user."
        allow_nil? false
      end
    end

    read :sign_in_with_token do
      description "Attempt to sign in using a short-lived sign in token."
      get? true

      argument :token, :string do
        description "The short-lived sign in token."
        allow_nil? false
        sensitive? true
      end

      prepare AshAuthentication.Strategy.Password.SignInWithTokenPreparation

      metadata :token, :string do
        description "A JWT that can be used to authenticate the user."
        allow_nil? false
      end
    end

    create :register_with_password do
      description "Register a new user with a email and password."
      accept [:email]

      argument :password, :string do
        description "The proposed password for the user, in plain text."
        allow_nil? false
        constraints min_length: Streampai.Constants.password_min_length()
        sensitive? true
      end

      argument :password_confirmation, :string do
        description "The proposed password for the user (again), in plain text."
        allow_nil? false
        sensitive? true
      end

      change HashPasswordChange

      change AshAuthentication.GenerateTokenChange

      change DefaultUsername

      validate PasswordConfirmationValidation

      metadata :token, :string do
        description "A JWT that can be used to authenticate the user."
        allow_nil? false
      end
    end

    action :request_password_reset_with_password do
      description "Send password reset instructions to a user if they exist."

      argument :email, :string do
        allow_nil? false
      end

      run {AshAuthentication.Strategy.Password.RequestPasswordReset, action: :get_by_email}
    end

    read :get_by_email do
      description "Looks up a user by their email"
      get? true

      argument :email, :string do
        allow_nil? false
      end

      filter expr(email == ^arg(:email))
    end

    read :get_by_name do
      description "Looks up a user by their display name (case-insensitive)"
      get? true

      argument :name, :string do
        allow_nil? false
      end

      filter expr(fragment("lower(?)", name) == fragment("lower(?)", ^arg(:name)))
    end

    read :get_public_profile do
      description "Get public profile info for a user by username (for donation pages)"
      get? true

      argument :username, :string do
        allow_nil? false
      end

      prepare build(
                load: [:display_avatar],
                select: [
                  :id,
                  :name,
                  :min_donation_amount,
                  :max_donation_amount,
                  :donation_currency
                ]
              )

      filter expr(name == ^arg(:username))
    end

    read :check_name_availability do
      description "Check if a name is available for the current actor"
      get? false

      argument :name, :string do
        allow_nil? false
      end

      prepare fn query, context ->
        require Ash.Query

        name = Ash.Query.get_argument(query, :name)
        actor = context.actor

        cond do
          is_nil(actor) ->
            Ash.Query.add_error(query, "Must be authenticated to check name availability")

          String.length(name) < Streampai.Constants.username_min_length() ->
            Ash.Query.add_error(
              query,
              "Name must be at least #{Streampai.Constants.username_min_length()} characters"
            )

          String.length(name) > Streampai.Constants.username_max_length() ->
            Ash.Query.add_error(
              query,
              "Name must be no more than #{Streampai.Constants.username_max_length()} characters"
            )

          !Regex.match?(~r/^[a-zA-Z0-9_]+$/, name) ->
            Ash.Query.add_error(
              query,
              "Name can only contain letters, numbers, and underscores"
            )

          true ->
            actor_id = actor.id

            query
            |> Ash.Query.filter(expr(name == ^name and id != ^actor_id))
            |> Ash.Query.limit(1)
        end
      end

      metadata :available, :boolean
      metadata :message, :string
      metadata :is_current_name, :boolean

      prepare fn query, context ->
        name = Ash.Query.get_argument(query, :name)
        actor = context.actor

        is_current = actor && actor.name == name

        Ash.Query.after_action(query, fn _query, results ->
          available = Enum.empty?(results) || is_current

          message =
            cond do
              is_current -> "This is your current name"
              available -> "Name is available"
              true -> "This name is already taken"
            end

          {:ok, results, %{available: available, message: message, is_current_name: is_current}}
        end)
      end
    end

    update :password_reset_with_password do
      argument :reset_token, :string do
        allow_nil? false
        sensitive? true
      end

      argument :password, :string do
        description "The proposed password for the user, in plain text."
        allow_nil? false
        constraints min_length: Streampai.Constants.password_min_length()
        sensitive? true
      end

      argument :password_confirmation, :string do
        description "The proposed password for the user (again), in plain text."
        allow_nil? false
        sensitive? true
      end

      validate AshAuthentication.Strategy.Password.ResetTokenValidation
      validate PasswordConfirmationValidation
      change HashPasswordChange
      change AshAuthentication.GenerateTokenChange
    end

    update :update_name do
      description "Update user's display name"
      accept [:name]
      require_atomic? false

      validate present(:name)

      change Streampai.Accounts.User.Changes.ValidateAndCheckNameUniqueness
    end

    update :update_avatar do
      description "Update user's avatar from uploaded file"
      accept [:avatar_file_id]
      require_atomic? false

      argument :file_id, :uuid do
        allow_nil? false
        description "ID of the uploaded avatar file"
      end

      change Streampai.Accounts.User.Changes.SetAvatarFromFile
    end

    action :reconcile_subscription do
      description "Reconcile user's subscription state with Stripe"

      run Streampai.Accounts.User.Actions.ReconcileSubscription
    end

    update :grant_pro_access do
      description "Grant PRO access to a user for a specified duration"
      require_atomic? false

      argument :duration_days, :integer do
        allow_nil? false
        description "Number of days to grant PRO access"
      end

      argument :reason, :string do
        allow_nil? false
        description "Reason for granting PRO access"
      end

      change Streampai.Accounts.User.Changes.GrantProAccess
    end

    update :revoke_pro_access do
      description "Revoke all active PRO access grants for a user"
      require_atomic? false

      change Streampai.Accounts.User.Changes.RevokeProAccess
    end

    update :toggle_email_notifications do
      description "Toggle email notifications on/off"
      require_atomic? false

      change fn changeset, _context ->
        current_value = Ash.Changeset.get_attribute(changeset, :email_notifications)
        Ash.Changeset.change_attribute(changeset, :email_notifications, !current_value)
      end
    end

    update :update_donation_settings do
      description "Update donation min/max amounts, currency, and default voice"
      require_atomic? false

      argument :min_amount, :integer, allow_nil?: true
      argument :max_amount, :integer, allow_nil?: true
      argument :currency, :string, allow_nil?: true
      argument :default_voice, :string, allow_nil?: true

      change fn changeset, _context ->
        import Ash.Changeset

        attrs =
          [
            {:min_donation_amount, get_argument(changeset, :min_amount)},
            {:max_donation_amount, get_argument(changeset, :max_amount)},
            {:donation_currency, get_argument(changeset, :currency)},
            {:default_voice, get_argument(changeset, :default_voice)}
          ]
          |> Enum.reject(fn {_k, v} -> is_nil(v) end)
          |> Map.new()

        change_attributes(changeset, attrs)
      end
    end
  end

  policies do
    bypass AshOban.Checks.AshObanInteraction do
      authorize_if always()
    end

    bypass AshAuthentication.Checks.AshAuthenticationInteraction do
      authorize_if always()
    end

    bypass action(:get_public_profile) do
      authorize_if always()
    end

    bypass action(:get_by_name) do
      authorize_if actor_present()
    end

    bypass action(:get_user_info) do
      authorize_if actor_present()
    end

    bypass action_type(:read) do
      authorize_if expr(id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:create) do
      authorize_if always()
    end

    policy action_type(:update) do
      authorize_if expr(id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:destroy) do
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :email, :string do
      public? true
      allow_nil? false
    end

    attribute :name, :string do
      public? true
      allow_nil? false
    end

    attribute :hashed_password, :string do
      allow_nil? true
      sensitive? true
    end

    attribute :extra_data, :map do
      public? true
      allow_nil? true
      default %{}
    end

    attribute :confirmed_at, :utc_datetime_usec do
      public? true
      allow_nil? true
      description "Timestamp when the user confirmed their account"
    end

    attribute :email_notifications, :boolean do
      public? true
      allow_nil? false
      default true
    end

    attribute :min_donation_amount, :integer do
      public? true
      allow_nil? true
    end

    attribute :max_donation_amount, :integer do
      public? true
      allow_nil? true
    end

    attribute :donation_currency, :string do
      public? true
      allow_nil? false
      default "USD"
    end

    attribute :default_voice, :string do
      public? true
      allow_nil? true
      description "Default TTS voice for donations"
    end

    attribute :avatar_url, :string do
      public? true
      allow_nil? true
      description "Direct URL to user's avatar image (denormalized for Electric sync)"
    end

    timestamps()
  end

  relationships do
    has_many :streaming_accounts, Streampai.Accounts.StreamingAccount do
      destination_attribute :user_id
    end

    has_many :user_premium_grants, Streampai.Accounts.UserPremiumGrant do
      destination_attribute :user_id
    end

    has_many :granted_roles, UserRole do
      destination_attribute :user_id
    end

    has_many :roles_granted_to_others, UserRole do
      destination_attribute :granter_id
    end

    has_many :files, Streampai.Storage.File do
      destination_attribute :user_id
    end

    belongs_to :avatar_file, Streampai.Storage.File do
      allow_nil? true
      attribute_public? true
    end
  end

  calculations do
    calculate :tier,
              :atom,
              expr(
                if count(user_premium_grants,
                     query: [
                       filter: expr(is_nil(revoked_at) and expires_at > ^DateTime.utc_now())
                     ]
                   ) > 0,
                   do: :pro,
                   else: :free
              ) do
      public? true
      description "User subscription tier: pro or free"
    end

    calculate :role,
              :atom,
              expr(if email in ^Streampai.Constants.admin_emails(), do: :admin, else: :regular) do
      public? true
      description "User role: admin or regular"
    end

    calculate :display_avatar,
              :string,
              Streampai.Accounts.User.Calculations.DisplayAvatar do
      public? true
    end

    calculate :is_moderator,
              :boolean,
              expr(
                count(granted_roles,
                  query: [filter: expr(role_type == :moderator and role_status == :accepted)]
                ) > 0
              ) do
      public? true
    end

    calculate :hours_streamed_last30_days,
              :float,
              Streampai.Accounts.User.Calculations.HoursStreamedLast30Days do
      public? true
    end

    calculate :storage_quota,
              :integer,
              expr(
                if tier == :pro do
                  10_737_418_240
                else
                  1_073_741_824
                end
              ) do
      public? true
      description "Storage quota in bytes. Free: 1GB, Pro: 10GB"
    end

    calculate :storage_used_percent,
              :float,
              expr(total_files_size / storage_quota * 100.0) do
      public? true
      description "Percentage of storage quota used"
    end
  end

  aggregates do
    count :connected_platforms, :streaming_accounts

    sum :total_files_size, :files, :size_bytes do
      filter expr(status == :uploaded and is_nil(deleted_at))
      default 0
      description "Total size of all uploaded files in bytes"
    end
  end

  identities do
    identity :unique_email, [:email]
    identity :unique_name, [:name]
  end
end
