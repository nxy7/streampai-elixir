defmodule StreampaiWeb.MultiProviderAuth do
  @moduledoc """
  Handles OAuth authentication with multiple streaming platforms (Google, Twitch, etc.).
  """
  use StreampaiWeb, :controller

  alias Streampai.Accounts.StreamingAccount

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

  def callback(%{assigns: %{ueberauth_failure: %Ueberauth.Failure{} = failure}} = conn, params) do
    provider = params["provider"]
    error_message = format_oauth_error(failure, provider)

    conn
    |> put_flash(:error, error_message)
    |> redirect(to: @redirect_url)
  end

  def callback(%{assigns: %{ueberauth_auth: %Ueberauth.Auth{} = auth}} = conn, %{"provider" => provider}) do
    case conn.assigns.current_user do
      nil ->
        handle_unauthenticated_callback(conn)

      user ->
        handle_authenticated_callback(conn, user, auth, provider)
    end
  end

  defp handle_unauthenticated_callback(conn) do
    conn
    |> put_flash(:error, "You must be logged in to connect streaming accounts")
    |> redirect(to: "/auth/sign-in")
  end

  defp handle_authenticated_callback(conn, user, auth, provider) do
    case create_or_update_streaming_account(user, auth, provider) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "Successfully connected #{String.capitalize(provider)} account")
        |> redirect(to: @redirect_url)

      {:error, error} ->
        conn
        |> put_flash(:error, format_connection_error(provider, error))
        |> redirect(to: @redirect_url)
    end
  end

  defp format_oauth_error(%Ueberauth.Failure{errors: errors}, provider) do
    case errors do
      [%Ueberauth.Failure.Error{message: message} | _] ->
        "Failed to authenticate with #{String.capitalize(provider)}: #{message}"

      [] ->
        "Failed to authenticate with #{String.capitalize(provider)}: Unknown error"

      _ ->
        "Failed to authenticate with #{String.capitalize(provider)}"
    end
  end

  defp format_connection_error(provider, error) do
    case error do
      %Ash.Error.Invalid{errors: errors} ->
        error_msgs = Enum.map(errors, & &1.message)
        "Failed to connect #{String.capitalize(provider)} account: #{Enum.join(error_msgs, ", ")}"

      _ ->
        require Logger

        Logger.error("Failed to connect #{provider} account for user: #{inspect(error)}")
        "Failed to connect #{String.capitalize(provider)} account. Please try again later."
    end
  end

  defp create_or_update_streaming_account(user, auth, provider) do
    platform = map_provider_to_platform(provider)
    extra_data = extract_user_data(auth)

    account_params = %{
      user_id: user.id,
      platform: platform,
      access_token: auth.credentials.token,
      refresh_token: auth.credentials.refresh_token,
      access_token_expires_at: expires_at_from_auth(auth),
      extra_data: extra_data
    }

    StreamingAccount.create(account_params, upsert?: true, actor: user)
  end

  defp map_provider_to_platform("google"), do: :youtube
  defp map_provider_to_platform("twitch"), do: :twitch
  defp map_provider_to_platform(_), do: raise("Unsupported provider")

  defp extract_user_data(auth) do
    %{
      email: extract_email(auth),
      name: extract_name(auth),
      nickname: extract_nickname(auth),
      image: extract_image(auth),
      uid: auth.uid
    }
  end

  defp extract_email(auth) do
    find_first_non_nil([
      auth.info.email,
      extract_from_raw_info(auth, "email"),
      extract_from_jwt(auth, "email")
    ])
  end

  defp extract_name(auth) do
    find_first_non_nil([
      auth.info.name,
      auth.info.first_name,
      extract_from_raw_info(auth, "name"),
      extract_from_raw_info(auth, "given_name"),
      extract_from_jwt(auth, "name"),
      extract_from_jwt(auth, "given_name")
    ])
  end

  defp extract_nickname(auth) do
    find_first_non_nil([
      auth.info.nickname,
      auth.info.name,
      extract_from_raw_info(auth, "given_name"),
      extract_from_raw_info(auth, "name"),
      extract_from_jwt(auth, "given_name"),
      extract_from_jwt(auth, "name")
    ])
  end

  defp extract_image(auth) do
    find_first_non_nil([
      auth.info.image,
      extract_from_raw_info(auth, "picture"),
      extract_from_jwt(auth, "picture")
    ])
  end

  defp find_first_non_nil(values) do
    Enum.find(values, &(&1 != nil))
  end

  defp expires_at_from_auth(%{credentials: %{expires_at: expires_at}}) when is_integer(expires_at) do
    DateTime.from_unix!(expires_at)
  end

  defp expires_at_from_auth(%{credentials: %{expires_in: expires_in}}) when is_integer(expires_in) do
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
    with %{token: %OAuth2.AccessToken{other_params: %{"id_token" => id_token}}} <-
           auth.extra.raw_info,
         [_header, payload, _signature] <- String.split(id_token, "."),
         {:ok, decoded_payload} <- Base.url_decode64(payload, padding: false),
         {:ok, jwt_data} <- Jason.decode(decoded_payload) do
      Map.get(jwt_data, field_name)
    else
      _ -> nil
    end
  rescue
    _ -> nil
  end
end
