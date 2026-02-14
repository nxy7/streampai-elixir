defmodule Streampai.Stream.MembraneLiveInput do
  @moduledoc """
  Persists Membrane RTMP stream keys per user/orientation.

  Mirrors the `Streampai.Cloudflare.LiveInput` resource semantically:
  composite PK `(user_id, orientation)`, with a stable `stream_key` that
  survives StreamManager restarts and strategy swaps.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  postgres do
    table "membrane_live_inputs"
    repo Streampai.Repo
  end

  code_interface do
    define :get_or_create_for_user, args: [:user_id, :orientation]
  end

  actions do
    defaults [:read, :destroy]

    read :get_or_create_for_user do
      argument :user_id, :uuid, allow_nil?: false
      argument :orientation, :atom, allow_nil?: false, default: :horizontal

      filter expr(user_id == ^arg(:user_id) and orientation == ^arg(:orientation))
    end

    create :create do
      primary? true
      accept [:user_id, :orientation, :stream_key, :data]
    end

    update :update do
      accept [:stream_key, :data]
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

    policy action_type([:update, :destroy]) do
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

    attribute :stream_key, :string do
      allow_nil? false
      public? true
    end

    attribute :data, :map do
      allow_nil? false
      default %{}
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
    identity :one_per_user_orientation, [:user_id, :orientation]
  end

  @doc """
  Gets or creates a MembraneLiveInput for the given user and orientation.
  If the record doesn't exist, generates a new stream key and creates it.
  """
  def get_or_create(user_id, orientation \\ :horizontal) do
    actor = Streampai.SystemActor.system()

    case get_or_create_for_user(user_id, orientation, actor: actor) do
      {:ok, [record]} ->
        {:ok, record}

      {:ok, []} ->
        # No record exists — generate a new stream key and create one
        random = 16 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false)
        stream_key = "#{user_id}-#{random}"

        host = Application.get_env(:streampai, :membrane_rtmp_host, "localhost")
        port = Application.get_env(:streampai, :membrane_rtmp_port, 1935)
        rtmp_url = "rtmp://#{host}:#{port}/live"

        data = %{
          "rtmp_url" => rtmp_url,
          "stream_key" => stream_key
        }

        Ash.create(
          __MODULE__,
          %{
            user_id: user_id,
            orientation: orientation,
            stream_key: stream_key,
            data: data
          },
          actor: actor
        )

      {:error, reason} ->
        {:error, reason}
    end
  end
end
