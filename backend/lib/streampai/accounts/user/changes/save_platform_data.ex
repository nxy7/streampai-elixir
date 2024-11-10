defmodule Streampai.Accounts.User.Changes.SavePlatformData do
  @moduledoc """
  Change for saving platform data from OAuth/OIDC authentication.
  """
  use Ash.Resource.Change

  def change(changeset, opts, _context) do
    platform_name = opts[:platform_name]
    user_info = Ash.Changeset.get_argument(changeset, :user_info)
    platform_data = Map.put(user_info, "platform", platform_name)

    attrs = %{} |> Map.put(:email, user_info["email"])

    attrs =
      if user_info["preferred_username"] do
        Map.put(attrs, :name, user_info["preferred_username"])
      else
        attrs
      end

    changeset
    |> Ash.Changeset.change_attributes(attrs)
    |> Ash.Changeset.change_attribute(:extra_data, platform_data)
  end
end
