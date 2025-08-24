defmodule StreampaiWeb.LiveUserAuth do
  @moduledoc """
  Helpers for authenticating users in LiveViews.
  """

  import Phoenix.Component
  use StreampaiWeb, :verified_routes
  alias StreampaiWeb.Presence

  def on_mount(:live_user_optional, _params, session, socket) do
    # Handle impersonation on top of existing authentication
    socket = handle_impersonation(socket, session)

    if socket.assigns[:current_user] do
      {:cont, socket}
    else
      {:cont, assign(socket, :current_user, nil)}
    end
  end

  def on_mount(:live_user_required, _params, session, socket) do
    # Handle impersonation on top of existing authentication  
    socket = handle_impersonation(socket, session)

    # For testing, allow loading user from session
    socket = maybe_load_user_from_session(socket, session)

    if socket.assigns[:current_user] do
      {:cont, socket}
    else
      {:halt, Phoenix.LiveView.redirect(socket, to: ~p"/sign-in")}
    end
  end

  def on_mount(:dashboard_presence, _params, session, socket) do
    # Handle impersonation and authentication first
    socket = handle_impersonation(socket, session)

    # For testing, allow loading user from session
    socket = maybe_load_user_from_session(socket, session)

    if socket.assigns[:current_user] do
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
      {:halt, Phoenix.LiveView.redirect(socket, to: ~p"/sign-in")}
    end
  end

  def on_mount(:live_no_user, _params, _session, socket) do
    if socket.assigns[:current_user] do
      {:halt, Phoenix.LiveView.redirect(socket, to: ~p"/")}
    else
      {:cont, assign(socket, :current_user, nil)}
    end
  end

  defp handle_impersonation(socket, session) do
    # Check if we have impersonation data in the session
    case {session["impersonated_user_id"], session["impersonator_user_id"]} do
      {impersonated_id, impersonator_id}
      when not is_nil(impersonated_id) and not is_nil(impersonator_id) ->
        # We are in impersonation mode - first load the impersonator to use as actor
        case load_user_by_id_administrative(impersonator_id) do
          {:ok, impersonator_user} ->
            # Now load the impersonated user using the impersonator as actor
            case load_user_by_id(impersonated_id, impersonator_user) do
              {:ok, impersonated_user} ->
                socket
                |> assign(:current_user, impersonated_user)
                |> assign(:impersonator, impersonator_user)

              _ ->
                # Invalid impersonated user data
                socket |> assign(:impersonator, nil)
            end

          _ ->
            # Invalid impersonator data, clear impersonation state
            socket |> assign(:impersonator, nil)
        end

      _ ->
        # No impersonation, just ensure impersonator is nil
        socket |> assign(:impersonator, nil)
    end
  end

  defp load_user_by_id(user_id, actor) when is_binary(user_id) do
    Ash.get(Streampai.Accounts.User, user_id, actor: actor)
  rescue
    _ -> {:error, :not_found}
  end

  defp load_user_by_id(_, _), do: {:error, :invalid_id}

  # Administrative load for bootstrapping impersonation (loads impersonator without actor)
  # This creates a temporary administrative context to load the impersonator
  defp load_user_by_id_administrative(user_id) when is_binary(user_id) do
    # We need to load the impersonator user without an actor context
    # This is a special case for impersonation validation - only load if admin
    import Ash.Query

    case Streampai.Accounts.User
         |> for_read(:read, %{})
         |> filter(id == ^user_id)
         |> filter(email == "lolnoxy@gmail.com")
         |> Ash.read_one() do
      {:ok, user} when not is_nil(user) -> {:ok, user}
      _ -> {:error, :not_found}
    end
  rescue
    _ -> {:error, :not_found}
  end

  defp load_user_by_id_administrative(_), do: {:error, :invalid_id}

  # Helper function to load user from session for testing purposes
  defp maybe_load_user_from_session(socket, session) do
    if socket.assigns[:current_user] do
      socket
    else
      # Check if we have a mock user in session (for testing)
      case session["current_user_id"] do
        nil -> 
          socket
        user_id when is_binary(user_id) ->
          # For testing, create a mock user with this ID
          mock_user = %Streampai.Accounts.User{
            id: user_id,
            email: session["current_user_email"] || "test@example.com",
            confirmed_at: DateTime.utc_now(),
            __meta__: %Ecto.Schema.Metadata{state: :loaded, source: "users"}
          }
          assign(socket, :current_user, mock_user)
        _ -> 
          socket
      end
    end
  end
end
