defmodule StreampaiWeb.AuthOverrides do
  @moduledoc false
  use AshAuthentication.Phoenix.Overrides

  override AshAuthentication.Phoenix.Components.Banner do
    set :image_url, "/images/logo-black.png"
  end

  override AshAuthentication.Phoenix.Components.OAuth2 do
    set :icon_src, %{
      twitch: "/images/twitch-logo.svg"
    }
  end
end
