defmodule Streampai.System do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Streampai.System.FeatureFlag
  end
end
