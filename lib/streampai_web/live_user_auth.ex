defmodule StreampaiWeb.LiveUserAuth do
  @moduledoc """
  Helpers for authenticating users in LiveViews.
  """

  use StreampaiWeb, :verified_routes

  import Phoenix.Component

  alias Streampai.Accounts.User
  alias StreampaiWeb.Presence

  def on_mount(:handle_impersonation, _params, session, socket) do
    if Map.get(socket.assigns, :current_user) do
      {:cont, handle_impersonation(socket, session)}
    else
      {:cont, socket}
    end
  end

  def on_mount(:dashboard_presence, _params, _session, socket) do
    if Map.get(socket.assigns, :current_user) do
      # Track user presence when they connect to any dashboard page
      if Phoenix.LiveView.connected?(socket) do
        topic = "users_presence"
        Phoenix.PubSub.subscribe(Streampai.PubSub, topic)

        Presence.track(
          self(),
          topic,
          socket.assigns.current_user.id,
          %{
            email: socket.assigns.current_user.email,
            joined_at: System.system_time(:second)
          }
        )
      end

      {:cont, socket}
    else
      # Store the current path for redirect after login
      # Get current request path from the socket
      current_path =
        socket
        |> Phoenix.LiveView.get_connect_info(:uri)
        |> case do
          %URI{path: path} when is_binary(path) -> path
          # Safe fallback
          _ -> "/dashboard"
        end

      {:halt, Phoenix.LiveView.redirect(socket, to: ~p"/auth/sign-in?#{[redirect_to: current_path]}")}
    end
  end

  defp handle_impersonation(socket, session) do
    # Check if we have impersonation data in the session
    case {session["impersonated_user_id"], session["impersonator_user_id"]} do
      {impersonated_id, impersonator_id}
      when not is_nil(impersonated_id) and not is_nil(impersonator_id) ->
        with impersonator_user when not is_tuple(impersonator_user) <-
               load_user_by_id_administrative(impersonator_id),
             impersonated_user when not is_tuple(impersonated_user) <-
               load_user_by_id(impersonated_id, impersonator_user) do
          socket
          |> assign(:current_user, impersonated_user)
          |> assign(:impersonator, impersonator_user)
        else
          {:error, _reason} ->
            # Clear invalid impersonation session
            socket
            |> assign(:current_user, socket.assigns.current_user)
            |> assign(:impersonator, nil)
        end

      _ ->
        assign(socket, :impersonator, nil)
    end
  end

  defp load_user_by_id(user_id, actor) when is_binary(user_id) do
    import Ash.Query

    case User
         |> for_read(:get_by_id_minimal, %{id: user_id}, actor: actor)
         |> Ash.read() do
      {:ok, [user]} -> user
      {:ok, []} -> {:error, :user_not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  defp load_user_by_id(_, _), do: {:error, :invalid_id}

  # Administrative load for bootstrapping impersonation (loads impersonator without actor)
  # This creates a temporary administrative context to load the impersonator
  defp load_user_by_id_administrative(user_id) when is_binary(user_id) do
    import Ash.Query

    case User
         |> for_read(:get_by_id_minimal, %{id: user_id}, authorize?: false)
         |> Ash.read() do
      {:ok, [user]} -> user
      {:ok, []} -> {:error, :user_not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  defp load_user_by_id_administrative(_), do: {:error, :invalid_id}
end
