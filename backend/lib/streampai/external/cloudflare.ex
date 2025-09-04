defmodule Streampai.Cloudflare do
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
