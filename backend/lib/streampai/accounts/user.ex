defmodule Streampai.Accounts.User do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAuthentication, AshAdmin.Resource],
    data_layer: AshPostgres.DataLayer

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

  actions do
    defaults [:read]

    read :get_by_subject do
      description "Get a user by the subject claim in a JWT"
      argument :subject, :string, allow_nil?: false
      get? true
      prepare AshAuthentication.Preparations.FilterBySubject
    end

    create :register_with_google do
      argument :user_info, :map, allow_nil?: false
      argument :oauth_tokens, :map, allow_nil?: false
      upsert? true
      upsert_identity :unique_email

      change AshAuthentication.GenerateTokenChange

      # Required if you have the `identity_resource` configuration enabled.
      change AshAuthentication.Strategy.OAuth2.IdentityChange

      change fn changeset, _ ->
        user_info = Ash.Changeset.get_argument(changeset, :user_info)

        Ash.Changeset.change_attributes(changeset, Map.take(user_info, ["email"]))
      end

      change Streampai.Accounts.DefaultUsername

      # Required if you're using the password & confirmation strategies
      upsert_fields []
      change set_attribute(:confirmed_at, &DateTime.utc_now/0)

      change after_action(fn _changeset, user, _context ->
               case user.confirmed_at do
                 nil -> {:error, "Unconfirmed user exists already"}
                 _ -> {:ok, user}
               end
             end)
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
      # In the generated sign in components, we validate the
      # email and password directly in the LiveView
      # and generate a short-lived token that can be used to sign in over
      # a standard controller action, exchanging it for a standard token.
      # This action performs that exchange. If you do not use the generated
      # liveviews, you may remove this action, and set
      # `sign_in_tokens_enabled? false` in the password strategy.

      description "Attempt to sign in using a short-lived sign in token."
      get? true

      argument :token, :string do
        description "The short-lived sign in token."
        allow_nil? false
        sensitive? true
      end

      # validates the provided sign in token and generates a token
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

      # Hashes the provided password
      change AshAuthentication.Strategy.Password.HashPasswordChange

      # Generates an authentication token for the user
      change AshAuthentication.GenerateTokenChange

      change Streampai.Accounts.DefaultUsername

      # validates that the password matches the confirmation
      validate AshAuthentication.Strategy.Password.PasswordConfirmationValidation

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

      # creates a reset token and invokes the relevant senders
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

      # validates the provided reset token
      validate AshAuthentication.Strategy.Password.ResetTokenValidation

      # validates that the password matches the confirmation
      validate AshAuthentication.Strategy.Password.PasswordConfirmationValidation

      # Hashes the provided password
      change AshAuthentication.Strategy.Password.HashPasswordChange

      # Generates an authentication token for the user
      change AshAuthentication.GenerateTokenChange
    end

    update :update_name do
      description "Update user's display name"
      accept [:name]
      require_atomic? false

      validate present(:name)

      change fn changeset, _context ->
        name = Ash.Changeset.get_attribute(changeset, :name)

        if name do
          # Validate format
          cond do
            String.length(name) < Streampai.Constants.username_min_length() ->
              Ash.Changeset.add_error(changeset, :name, "Name must be at least #{Streampai.Constants.username_min_length()} characters")

            String.length(name) > Streampai.Constants.username_max_length() ->
              Ash.Changeset.add_error(changeset, :name, "Name must be no more than #{Streampai.Constants.username_max_length()} characters")

            !Regex.match?(~r/^[a-zA-Z0-9_]+$/, name) ->
              Ash.Changeset.add_error(
                changeset,
                :name,
                "Name can only contain letters, numbers, and underscores"
              )

            true ->
              # Check if the name is already taken by another user
              case Ash.read(Streampai.Accounts.User) do
                {:ok, users} ->
                  taken =
                    Enum.any?(users, fn user ->
                      user.name == name and user.id != changeset.data.id
                    end)

                  if taken do
                    Ash.Changeset.add_error(changeset, :name, "This name is already taken")
                  else
                    changeset
                  end

                {:error, error} ->
                  Ash.Changeset.add_error(
                    changeset,
                    :name,
                    "Failed to validate name availability: #{inspect(error)}"
                  )
              end
          end
        else
          changeset
        end
      end
    end
  end

  policies do
    bypass AshAuthentication.Checks.AshAuthenticationInteraction do
      authorize_if always()
    end

    bypass action_type(:read) do
      authorize_if expr(id == ^actor(:id))
      authorize_if expr(^actor(:email) == ^Streampai.Constants.admin_email())
    end

    policy always() do
      authorize_if always()
      # forbid_if always()
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
  end

  relationships do
    has_many :streaming_accounts, Streampai.Accounts.StreamingAccount do
      destination_attribute :user_id
    end

    has_many :user_premium_grants, Streampai.Accounts.UserPremiumGrant do
      destination_attribute :user_id
    end
  end

  calculations do
    calculate :tier, :atom, expr(if count(user_premium_grants) > 0, do: :pro, else: :free)
  end

  identities do
    identity :unique_email, [:email]
    identity :unique_name, [:name]
  end
end
