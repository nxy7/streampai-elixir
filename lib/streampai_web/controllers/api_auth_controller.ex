defmodule StreampaiWeb.ApiAuthController do
  @moduledoc """
  JSON API controller for email/password authentication.
  Used by SPA frontend for registration and login.
  """
  use StreampaiWeb, :controller

  alias Streampai.Accounts.User

  require Logger

  @doc """
  Register a new user with email and password.
  """
  def register(conn, %{"email" => email, "password" => password} = params) do
    password_confirmation = params["password_confirmation"] || password

    case User.register_with_password(%{
           email: email,
           password: password,
           password_confirmation: password_confirmation
         }) do
      {:ok, user} ->
        conn
        |> put_status(:created)
        |> json(%{
          success: true,
          message: "Account created. Please check your email to confirm your account.",
          user: %{id: user.id, email: user.email}
        })

      {:error, error} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          success: false,
          error: format_error(error)
        })
    end
  end

  @doc """
  Sign in with email and password.
  """
  def sign_in(conn, %{"email" => email, "password" => password}) do
    case User
         |> Ash.Query.for_read(:sign_in_with_password, %{email: email, password: password})
         |> Ash.read_one() do
      {:ok, user} when not is_nil(user) ->
        conn
        |> AshAuthentication.Phoenix.Plug.store_in_session(user)
        |> put_status(:ok)
        |> json(%{
          success: true,
          user: %{id: user.id, email: user.email, name: user.name}
        })

      {:ok, nil} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{
          success: false,
          error: "Invalid email or password"
        })

      {:error, error} ->
        Logger.error("Sign in error: #{inspect(error)}")

        conn
        |> put_status(:unauthorized)
        |> json(%{
          success: false,
          error: "Invalid email or password"
        })
    end
  end

  defp format_error(%Ash.Error.Invalid{errors: errors}) do
    Enum.map_join(errors, ", ", fn
      %{field: field, message: message} when not is_nil(field) ->
        "#{field}: #{message}"

      %{message: message} ->
        message

      error ->
        inspect(error)
    end)
  end

  defp format_error(error), do: inspect(error)
end
