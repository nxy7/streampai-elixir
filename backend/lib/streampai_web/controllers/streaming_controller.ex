defmodule StreampaiWeb.MultiProviderAuth do
  use StreampaiWeb, :controller
  plug Ueberauth

  @redirect_url "/dashboard/settings"

  def request(conn, _params) do
    # Check if user is logged in before starting OAuth flow
    current_user = conn.assigns.current_user

    if current_user do
      # This action should never be reached as Ueberauth intercepts the request
      # But we need it defined for the route to work
      conn
    else
      conn
      |> put_flash(:error, "You must be logged in to connect streaming accounts")
      |> redirect(to: "/")
    end
  end

  def callback(%{assigns: %{ueberauth_failure: %Ueberauth.Failure{} = err}} = conn, params) do
    dbg(err)
    dbg(params)

    conn
    |> put_flash(:error, "Failed to authenticate with #{params["provider"]}")
    |> redirect(to: @redirect_url)
  end

  def callback(%{assigns: %{ueberauth_auth: %Ueberauth.Auth{} = auth}} = conn, %{
        "provider" => provider
      }) do
    current_user = conn.assigns.current_user

    if current_user do
      case create_or_update_streaming_account(current_user, auth, provider) do
        {:ok, _account} ->
          conn
          |> put_flash(:info, "Successfully connected #{String.capitalize(provider)} account")
          |> redirect(to: @redirect_url)

        {:error, error} ->
          conn
          |> put_flash(
            :error,
            "Failed to save #{String.capitalize(provider)} account: #{inspect(error)}"
          )
          |> redirect(to: @redirect_url)
      end
    else
      conn
      |> put_flash(:error, "You must be logged in to connect streaming accounts")
      |> redirect(to: "/")
    end
  end

  defp create_or_update_streaming_account(user, auth, provider) do
    # Map OAuth providers to our platform enum values
    platform =
      case provider do
        "google" -> :youtube
        "twitch" -> :twitch
        _ -> String.to_atom(provider)
      end

    account_params = %{
      user_id: user.id,
      platform: platform,
      access_token: auth.credentials.token,
      refresh_token: auth.credentials.refresh_token || "",
      access_token_expires_at: expires_at_from_auth(auth),
      extra_data: %{
        email:
          auth.info.email || extract_from_raw_info(auth, "email") ||
            extract_from_jwt(auth, "email"),
        name:
          auth.info.name || auth.info.first_name || extract_from_raw_info(auth, "name") ||
            extract_from_raw_info(auth, "given_name") || extract_from_jwt(auth, "name") ||
            extract_from_jwt(auth, "given_name"),
        nickname:
          auth.info.nickname || auth.info.name || extract_from_raw_info(auth, "given_name") ||
            extract_from_raw_info(auth, "name") || extract_from_jwt(auth, "given_name") ||
            extract_from_jwt(auth, "name"),
        image:
          auth.info.image || extract_from_raw_info(auth, "picture") ||
            extract_from_jwt(auth, "picture"),
        uid: auth.uid
        # Removed raw_info to reduce cookie size
      }
    }

    # Try to create, if it exists (upsert based on composite primary key), it will update
    Streampai.Accounts.StreamingAccount
    |> Ash.Changeset.for_create(:create, account_params, upsert?: true)
    |> Ash.create()
  end

  defp expires_at_from_auth(%{credentials: %{expires_at: expires_at}})
       when is_integer(expires_at) do
    DateTime.from_unix!(expires_at)
  end

  defp expires_at_from_auth(%{credentials: %{expires_in: expires_in}})
       when is_integer(expires_in) do
    DateTime.add(DateTime.utc_now(), expires_in, :second)
  end

  defp expires_at_from_auth(_) do
    # Default to 1 hour from now if we can't determine expiration
    DateTime.add(DateTime.utc_now(), 3600, :second)
  end

  # Helper function to safely extract fields from raw_info
  defp extract_from_raw_info(auth, field_name) do
    case auth.extra.raw_info do
      %{user: user_data} when is_map(user_data) ->
        Map.get(user_data, field_name)

      _ ->
        nil
    end
  end

  # Helper function to extract fields from JWT id_token
  defp extract_from_jwt(auth, field_name) do
    try do
      case auth.extra.raw_info do
        %{token: %OAuth2.AccessToken{other_params: %{"id_token" => id_token}}} ->
          # Simple JWT payload extraction (without signature verification)
          # Format: header.payload.signature
          case String.split(id_token, ".") do
            [_header, payload, _signature] ->
              case Base.url_decode64(payload, padding: false) do
                {:ok, decoded_payload} ->
                  case Jason.decode(decoded_payload) do
                    {:ok, jwt_data} -> Map.get(jwt_data, field_name)
                    _ -> nil
                  end

                _ ->
                  nil
              end

            _ ->
              nil
          end

        _ ->
          nil
      end
    rescue
      _ -> nil
    end
  end
end
