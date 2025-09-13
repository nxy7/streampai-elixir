defmodule Streampai.Cloudflare do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Streampai.Cloudflare.LiveInput
    resource Streampai.Cloudflare.LiveOutput
  end
end
