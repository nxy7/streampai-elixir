defmodule StreampaiWeb.LandingLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.LandingCTA
  import StreampaiWeb.Components.LandingFeatures
  import StreampaiWeb.Components.LandingFooter
  import StreampaiWeb.Components.LandingHero
  import StreampaiWeb.Components.LandingNavigation
  import StreampaiWeb.Components.LandingPricing

  alias StreampaiWeb.LiveHelpers.UserHelpers

  def mount(_params, session, socket) do
    csrf_token = Map.get(session, "_csrf_token", "")
    current_user = load_current_user(socket, session)

    {:ok,
     assign(socket,
       csrf_token: csrf_token,
       current_user: current_user,
       newsletter_message: nil,
       newsletter_error: nil
     ), layout: false}
  end

  defp load_current_user(socket, session) do
    # Check if already assigned by AshAuthentication
    case Map.get(socket.assigns, :current_user) do
      nil ->
        # Try to load from session
        case Map.get(session, "user") do
          nil ->
            nil

          user_token when is_binary(user_token) ->
            case load_user_from_token(user_token) do
              {:ok, user} -> user
              _ -> nil
            end

          _ ->
            nil
        end

      user ->
        user
    end
  end

  defp load_user_from_token(token) do
    # Parse the token format: "otp_app:resource?id=uuid"
    case String.split(token, "?") do
      [_resource_part, params_part] ->
        params = URI.decode_query(params_part)

        case Map.get(params, "id") do
          nil ->
            {:error, :no_id}

          user_id ->
            alias Streampai.Accounts.User

            case User
                 |> Ash.Query.for_read(:get_by_id_minimal, %{id: user_id}, authorize?: false)
                 |> Ash.read() do
              {:ok, [user]} -> {:ok, user}
              {:ok, []} -> {:error, :user_not_found}
              {:error, reason} -> {:error, reason}
            end
        end

      _ ->
        {:error, :invalid_token_format}
    end
  end

  def handle_event("newsletter_signup", %{"email" => email}, socket) do
    socket = assign(socket, newsletter_message: nil, newsletter_error: nil)

    case create_newsletter_email(email) do
      {:ok, _newsletter_email} ->
        handle_newsletter_success(socket)

      {:error, changeset} ->
        if UserHelpers.duplicate_email_error?(changeset) do
          handle_duplicate_email(socket)
        else
          handle_validation_error(socket, changeset)
        end
    end
  end

  defp create_newsletter_email(email) do
    Streampai.Accounts.NewsletterEmail
    |> Ash.Changeset.for_create(:create, %{email: email})
    |> Ash.create()
  end

  defp handle_newsletter_success(socket) do
    socket =
      socket
      |> assign(newsletter_message: "Your email has been added to our newsletter")
      |> put_flash(:info, "Thanks! We'll notify you when Streampai launches.")

    Process.send_after(self(), :clear_flash, 7000)
    {:noreply, socket}
  end

  defp handle_duplicate_email(socket) do
    socket =
      socket
      |> assign(newsletter_message: "You're already subscribed to our newsletter!")
      |> put_flash(:info, "You're already subscribed to our newsletter!")

    Process.send_after(self(), :clear_flash, 4000)
    {:noreply, socket}
  end

  defp handle_validation_error(socket, changeset) do
    error_message = UserHelpers.extract_error_message(changeset)

    socket =
      socket
      |> assign(newsletter_error: error_message)
      |> put_flash(:error, error_message)

    {:noreply, socket}
  end

  def handle_info(:clear_flash, socket) do
    {:noreply, clear_flash(socket)}
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content={@csrf_token} />
        <title>Streampai - Multi-Platform Streaming Solution</title>
        <meta
          name="description"
          content="Stream to Twitch, YouTube, Kick, Facebook simultaneously. Unified chat, analytics, and AI moderation for content creators."
        />
        <style>
          html {
            scroll-behavior: smooth;
          }
          @media (prefers-reduced-motion: reduce) {
            html {
              scroll-behavior: auto;
            }
          }
        </style>
      </head>
      <body class="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 scroll-smooth">
        <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <.flash_group flash={@flash} />
          <.landing_navigation current_user={@current_user} />
          <.landing_hero
            newsletter_message={@newsletter_message}
            newsletter_error={@newsletter_error}
          />
          <.landing_features />
          <!-- HIDDEN: Pricing section will be restored later -->
          <div class="hidden">
            <.landing_pricing current_user={@current_user} />
          </div>
          <.landing_cta />
          <.landing_footer />
        </div>
      </body>
    </html>
    """
  end
end
