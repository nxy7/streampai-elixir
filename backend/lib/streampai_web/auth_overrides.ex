defmodule StreampaiWeb.AuthOverrides do
  use AshAuthentication.Phoenix.Overrides

  # For a complete reference, see https://hexdocs.pm/ash_authentication_phoenix/ui-overrides.html

  # Note: OAuth redirect handling is implemented via the RedirectAfterAuth plug
  # which stores redirect_to in the session for OAuth flows
end
