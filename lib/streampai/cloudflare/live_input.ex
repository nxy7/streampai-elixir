defmodule Streampai.Cloudflare.LiveInput do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Cloudflare,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "cloudflare_live_inputs"
    repo Streampai.Repo

    identity_index_names one_live_input_per_user_orientation: "cf_live_inputs_user_orientation_idx"
  end

  typescript do
    type_name("LiveInput")
  end

  code_interface do
    define :get_or_fetch_for_user, args: [:user_id, :orientation]
    define :get_by_cloudflare_uid, args: [:cloudflare_uid]
  end

  # Test mode override for get_or_fetch_for_user
  def get_or_fetch_for_user_with_test_mode(user_id, orientation, opts \\ []) when is_binary(user_id) do
    if Application.get_env(:streampai, :test_mode, false) do
      {:ok, create_test_live_input(user_id, orientation)}
    else
      get_or_fetch_for_user(user_id, orientation, opts)
    end
  end

  defp create_test_live_input(user_id, orientation) do
    %{
      __struct__: __MODULE__,
      user_id: user_id,
      orientation: orientation,
      data: %{
        "uid" => "test-input-#{user_id}-#{orientation}",
        "rtmps" => %{
          "url" => "rtmps://test.cloudflare.com:443/live/",
          "streamKey" => "test-stream-key-#{user_id}-#{orientation}"
        },
        "srt" => %{
          "url" => "srt://test.cloudflare.com:778"
        },
        "webRTC" => %{
          "url" => "https://test.cloudflare.com/webrtc"
        }
      },
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :orientation, :data]
    end

    update :update do
      accept [:data]
    end

    read :get_or_fetch_for_user do
      argument :user_id, :uuid, allow_nil?: false
      argument :orientation, :atom, allow_nil?: false, default: :horizontal

      prepare Streampai.Cloudflare.LiveInput.Preparations.GetOrFetch
    end

    read :get_by_cloudflare_uid do
      argument :cloudflare_uid, :string, allow_nil?: false

      filter expr(fragment("(?)->>'uid' = ?", data, ^arg(:cloudflare_uid)))
    end

    update :regenerate do
      @doc "Regenerates the stream key by deleting the old Cloudflare input and creating a new one"
      require_atomic? false
      change Streampai.Cloudflare.LiveInput.Changes.Regenerate
    end
  end

  policies do
    bypass Streampai.SystemActor.Check do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:create) do
      authorize_if actor_present()
    end

    policy action_type(:update) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end

  attributes do
    attribute :user_id, :uuid do
      primary_key? true
      allow_nil? false
      public? true
    end

    attribute :orientation, :atom do
      primary_key? true
      allow_nil? false
      default :horizontal
      public? true
      constraints one_of: [:horizontal, :vertical]
    end

    attribute :data, :map do
      allow_nil? false
      public? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
    end
  end

  identities do
    identity :one_live_input_per_user_orientation, [:user_id, :orientation]
  end
end
