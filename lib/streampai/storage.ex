defmodule Streampai.Storage do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  admin do
    show? true
  end

  typescript_rpc do
    resource Streampai.Storage.File do
      rpc_action(:request_file_upload, :request_upload)
      rpc_action(:confirm_file_upload, :mark_uploaded)
    end
  end

  resources do
    resource Streampai.Storage.File
  end
end
