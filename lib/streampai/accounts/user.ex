defmodule Streampai.Accounts.User do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAuthentication, AshAdmin.Resource, AshOban],
    data_layer: AshPostgres.DataLayer

  alias AshAuthentication.Strategy.OAuth2.IdentityChange
  alias AshAuthentication.Strategy.Password.HashPasswordChange
  alias AshAuthentication.Strategy.Password.PasswordConfirmationValidation
  alias Streampai.Accounts.DefaultUsername
  alias Streampai.Accounts.User
  alias Streampai.Accounts.User.Changes.SavePlatformData
  alias Streampai.Accounts.User.Changes.ValidateOAuthConfirmation
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

  code_interface do
    define :get_by_id
  end

  actions do
    defaults [:read, :destroy]

    read :get do
      prepare build(load: [:tier, :connected_platforms])
    end

    read :get_by_id do
      get? true

      argument :id, :string do
        allow_nil? false
      end

      prepare build(load: [:tier, :connected_platforms, :role, :streaming_accounts, :avatar])

      filter expr(id == ^arg(:id))
    end

    read :get_by_subject do
      description "Get a user by the subject claim in a JWT"
      argument :subject, :string, allow_nil?: false

      get? true

      prepare AshAuthentication.Preparations.FilterBySubject

      prepare Streampai.Accounts.User.Preparations.ExtendUserData
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

    action :reconcile_subscription do
      description "Reconcile user's subscription state with Stripe"

      run Streampai.Accounts.User.Actions.ReconcileSubscription
    end
  end

  policies do
    bypass AshOban.Checks.AshObanInteraction do
      authorize_if always()
    end

    bypass AshAuthentication.Checks.AshAuthenticationInteraction do
      authorize_if always()
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
              )

    calculate :role,
              :atom,
              expr(if email == ^Streampai.Constants.admin_email(), do: :admin, else: :regular)

    calculate :avatar, :string, expr(extra_data["picture"])
  end

  aggregates do
    count :connected_platforms, :streaming_accounts
  end

  identities do
    identity :unique_email, [:email]
    identity :unique_name, [:name]
  end
end
