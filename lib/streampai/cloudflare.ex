defmodule Streampai.Cloudflare do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Cloudflare.LiveInput

  admin do
    show? true
  end

  typescript_rpc do
    resource LiveInput do
      rpc_action(:get_stream_key, :get_or_fetch_for_user)
      rpc_action(:regenerate_stream_key, :regenerate)
    end
  end

  resources do
    resource LiveInput
    resource Streampai.Cloudflare.LiveOutput
  end
end
