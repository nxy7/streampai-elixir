defmodule StreampaiWeb.LiveUserAuth do
  @moduledoc """
  Helpers for authenticating users in LiveViews.
  """

  import Phoenix.Component
  use StreampaiWeb, :verified_routes
  alias StreampaiWeb.Presence

  def on_mount(:live_user_optional, _params, _session, socket) do
    dbg(socket.assigns.current_user)

    if socket.assigns[:current_user] do
      {:cont, socket}
    else
      {:cont, assign(socket, :current_user, nil)}
    end
  end

  def on_mount(:live_user_required, _params, session, socket) do
    socket =
      handle_impersonation(socket, session)
      # TODO extract these into auth plug instead of lading it so late
      |> ensure_tier_loaded()

    # For testing, allow loading user from session

    if socket.assigns[:current_user] do
      {:cont, socket}
    else
      {:halt, Phoenix.LiveView.redirect(socket, to: ~p"/auth/sign-in")}
    end
  end

  def on_mount(:dashboard_presence, _params, session, socket) do
    socket = handle_impersonation(socket, session)

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
      {:halt, Phoenix.LiveView.redirect(socket, to: ~p"/auth/sign-in")}
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
        # Use 'with' to chain the impersonation loading operations
        with {:ok, impersonator_user} <- load_user_by_id_administrative(impersonator_id),
             {:ok, impersonated_user} <- load_user_by_id(impersonated_id, impersonator_user) do
          socket
          |> assign(:current_user, impersonated_user)
          |> assign(:impersonator, impersonator_user)
        else
          _ ->
            socket |> assign(:impersonator, nil)
        end

      _ ->
        socket |> assign(:impersonator, nil)
    end
  end

  defp load_user_by_id(user_id, actor) when is_binary(user_id) do
    Ash.get(Streampai.Accounts.User, user_id, actor: actor, load: [:tier])
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
         |> filter(email == ^Streampai.Constants.admin_email())
         |> load([:tier])
         |> Ash.read_one() do
      {:ok, user} when not is_nil(user) -> {:ok, user}
      _ -> {:error, :not_found}
    end
  rescue
    _ -> {:error, :not_found}
  end

  defp load_user_by_id_administrative(_), do: {:error, :invalid_id}

  # Helper to ensure tier is loaded for the current user
  defp ensure_tier_loaded(socket) do
    case socket.assigns[:current_user] do
      nil ->
        socket

      %{tier: %Ash.NotLoaded{}} = user ->
        case Ash.load(user, [:tier]) do
          {:ok, user_with_tier} ->
            assign(socket, :current_user, user_with_tier)

          {:error, _} ->
            socket
        end

      %{tier: _} = _user ->
        # Tier already loaded
        socket

      user ->
        # Fallback: try to load tier
        case Ash.load(user, [:tier]) do
          {:ok, user_with_tier} ->
            assign(socket, :current_user, user_with_tier)

          {:error, _} ->
            socket
        end
    end
  end
end
