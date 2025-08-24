defmodule StreampaiWeb.MultiProviderAuth do
  use StreampaiWeb, :controller
  plug Ueberauth

  @redirect_url "/dashboard"

  def callback(%{assigns: %{ueberauth_failure: %Ueberauth.Failure{} = err}} = conn, params) do
    dbg(err)
    dbg(params)

    conn
    |> put_flash(:error, "Failed to authenticate")
    |> redirect(to: @redirect_url)
  end

  def callback(%{assigns: %{ueberauth_auth: %Ueberauth.Auth{} = auth}} = conn, params) do
    IO.puts("Authenticated successfully")
    dbg(auth)
    dbg(params)

    # If you are not using mix phx.gen.auth, store the user in the session
    conn
    |> put_flash(:info, auth.info.image)
    |> redirect(to: @redirect_url)
  end
end
