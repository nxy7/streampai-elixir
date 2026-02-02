defmodule Streampai.Support do
  @moduledoc """
  Domain for managing support chat between users and admins.
  """
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Support.Message
  alias Streampai.Support.Ticket

  admin do
    show? true
  end

  typescript_rpc do
    resource Ticket do
      rpc_action(:create_support_ticket, :create)
      rpc_action(:resolve_support_ticket, :resolve)
    end

    resource Message do
      rpc_action(:send_support_message, :create)
    end
  end

  resources do
    resource Ticket
    resource Message
  end
end
