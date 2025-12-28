defmodule Streampai.SystemActor do
  @moduledoc """
  Represents a system-level actor for webhook and background job authorization.

  Instead of using `authorize?: false` which bypasses all authorization and makes
  audit trails unclear, use a SystemActor to properly authorize system operations
  while maintaining traceability.

  ## Actor Types

  - `:webhook` - For external webhook handlers (PayPal, Cloudflare, etc.)
  - `:background_job` - For Oban background jobs (Discord notifications, IFTTT, etc.)

  ## Usage

      # In webhook controllers
      Ash.get(User, user_id, actor: Streampai.SystemActor.paypal())

      # In background jobs
      Ash.update(webhook, params, actor: Streampai.SystemActor.oban())

  ## Policy Integration

  Use the `Streampai.SystemActor.Check` policy check in your resources:

      policies do
        bypass Streampai.SystemActor.Check do
          authorize_if always()
        end
        # ... other policies
      end
  """

  @enforce_keys [:id, :type]
  defstruct [:id, :type, is_admin: true]

  @type actor_type :: :webhook | :background_job
  @type t :: %__MODULE__{
          id: String.t(),
          type: actor_type(),
          is_admin: boolean()
        }

  @doc """
  Creates a system actor for PayPal webhook operations.
  """
  @spec paypal() :: t()
  def paypal do
    %__MODULE__{id: "paypal", type: :webhook}
  end

  @doc """
  Creates a system actor for Cloudflare webhook operations.
  """
  @spec cloudflare() :: t()
  def cloudflare do
    %__MODULE__{id: "cloudflare", type: :webhook}
  end

  @doc """
  Creates a system actor for Oban background job operations.
  """
  @spec oban() :: t()
  def oban do
    %__MODULE__{id: "oban", type: :background_job}
  end

  @doc """
  Creates a system actor for generic system operations.
  """
  @spec system() :: t()
  def system do
    %__MODULE__{id: "system", type: :background_job}
  end

  @doc """
  Checks if the given actor is a system actor.
  """
  @spec system_actor?(any()) :: boolean()
  def system_actor?(%__MODULE__{}), do: true
  def system_actor?(_), do: false
end
