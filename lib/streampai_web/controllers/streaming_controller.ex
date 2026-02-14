defmodule StreampaiWeb.MultiProviderAuth do
  @moduledoc """
  Handles OAuth authentication with multiple streaming platforms (Google, Twitch, etc.).
  """
  use StreampaiWeb, :controller

  alias Streampai.Accounts.StreamingAccount

  plug(Ueberauth)

  defp frontend_url do
    Application.get_env(:streampai, :frontend_url, "http://localhost:3000")
  end

  defp redirect_url, do: "#{frontend_url()}/dashboard/settings"

  def request(conn, _params) do
    # Ueberauth should intercept this request and redirect to the OAuth provider.
    # If we reach here, it means Ueberauth didn't intercept (e.g., config mismatch).
    # Return a meaningful error instead of leaving the connection unsent.
    current_user = Map.get(conn.assigns, :current_user)

    if current_user do
      # User is logged in but Ueberauth didn't redirect - this is a config issue
      conn
      |> put_resp_content_type("text/plain")
      |> send_resp(500, "OAuth configuration error: Ueberauth did not intercept the request")
    else
      # User is not logged in - redirect to login
      redirect(conn, external: "#{frontend_url()}/login")
    end
  end

  def callback(%{assigns: %{ueberauth_failure: %Ueberauth.Failure{} = failure}} = conn, params) do
    provider = params["provider"]
    error_message = format_oauth_error(failure, provider)

    conn
    |> put_flash(:error, error_message)
    |> redirect(external: redirect_url())
  end

  def callback(%{assigns: %{ueberauth_auth: %Ueberauth.Auth{}, current_user: nil}} = conn, %{"provider" => _provider}) do
    handle_unauthenticated_callback(conn)
  end

  def callback(%{assigns: %{ueberauth_auth: %Ueberauth.Auth{} = auth, current_user: user}} = conn, %{
        "provider" => provider
      }) do
    handle_authenticated_callback(conn, user, auth, provider)
  end

  defp handle_unauthenticated_callback(conn) do
    conn
    |> put_flash(:error, "You must be logged in to connect streaming accounts")
    |> redirect(external: "#{frontend_url()}/auth/sign-in")
  end

  defp handle_authenticated_callback(conn, user, auth, provider) do
    case create_or_update_streaming_account(user, auth, provider) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "Successfully connected #{String.capitalize(provider)} account")
        |> redirect(external: redirect_url())

      {:error, error} ->
        conn
        |> put_flash(:error, format_connection_error(provider, error))
        |> redirect(external: redirect_url())
    end
  end

  defp format_oauth_error(%Ueberauth.Failure{errors: [%Ueberauth.Failure.Error{message: message} | _]}, provider) do
    "Failed to authenticate with #{String.capitalize(provider)}: #{message}"
  end

  defp format_oauth_error(%Ueberauth.Failure{errors: []}, provider) do
    "Failed to authenticate with #{String.capitalize(provider)}: Unknown error"
  end

  defp format_oauth_error(%Ueberauth.Failure{}, provider) do
    "Failed to authenticate with #{String.capitalize(provider)}"
  end

  defp format_connection_error(provider, %Ash.Error.Invalid{errors: errors}) do
    error_msgs = Enum.map(errors, & &1.message)
    "Failed to connect #{String.capitalize(provider)} account: #{Enum.join(error_msgs, ", ")}"
  end

  defp format_connection_error(provider, error) do
    require Logger

    Logger.error("Failed to connect #{provider} account for user: #{inspect(error)}")
    "Failed to connect #{String.capitalize(provider)} account. Please try again later."
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
      extra_data: extra_data,
      status: :connected
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
    DateTime.add(DateTime.utc_now(), 3600, :second)
  end

  defp extract_from_raw_info(%{extra: %{raw_info: %{user: user_data}}}, field_name) when is_map(user_data) do
    Map.get(user_data, field_name)
  end

  defp extract_from_raw_info(_auth, _field_name), do: nil

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
