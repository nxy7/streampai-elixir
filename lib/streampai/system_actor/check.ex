defmodule Streampai.SystemActor.Check do
  @moduledoc """
  An Ash policy check that authorizes system actors.

  Use this in your resource policies to allow system actors (webhooks, background jobs)
  to perform operations without requiring a user actor.

  ## Usage

      policies do
        bypass Streampai.SystemActor.Check do
          authorize_if always()
        end
        # ... other policies
      end
  """

  use Ash.Policy.SimpleCheck

  @impl true
  def describe(_opts) do
    "actor is a system actor"
  end

  @impl true
  def match?(actor, _context, _opts) do
    Streampai.SystemActor.system_actor?(actor)
  end
end
