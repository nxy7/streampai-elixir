defmodule StreampaiWeb.LandingLive do
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.LandingNavigation
  import StreampaiWeb.Components.LandingHero
  import StreampaiWeb.Components.LandingFeatures
  import StreampaiWeb.Components.LandingPricing
  import StreampaiWeb.Components.LandingCTA
  import StreampaiWeb.Components.LandingFooter

  def mount(_params, session, socket) do
    csrf_token = Map.get(session, "_csrf_token", "")

    {:ok,
     assign(socket,
       csrf_token: csrf_token,
       newsletter_message: nil,
       newsletter_error: nil
     ), layout: false}
  end

  def handle_event("newsletter_signup", %{"email" => email}, socket) do
    start_time = System.monotonic_time(:millisecond)
    IO.puts("Newsletter signup started at #{start_time}")

    socket = assign(socket, newsletter_message: nil, newsletter_error: nil)

    case Streampai.Accounts.NewsletterEmail
         |> Ash.Changeset.for_create(:create, %{email: email})
         |> Ash.create() do
      {:ok, _newsletter_email} ->
        socket =
          socket
          |> assign(newsletter_message: "Your email has been added to our newsletter")
          |> put_flash(:info, "Thanks! We'll notify you when Streampai launches.")

        # Clear flash after 4 seconds
        Process.send_after(self(), :clear_flash, 7000)

        end_time = System.monotonic_time(:millisecond)

        IO.puts(
          "Newsletter signup SUCCESS completed at #{end_time}, took #{end_time - start_time}ms"
        )

        {:noreply, socket}

      {:error, changeset} ->
        # Check for duplicate email (unique constraint violation)
        # Since email is the primary key, Ash will return "has already been taken" for duplicates
        is_duplicate_email =
          changeset.errors
          |> Enum.any?(fn error ->
            case error do
              %{field: :email, message: message} when is_binary(message) ->
                # Check for common duplicate/uniqueness error messages
                message_lower = String.downcase(message)

                String.contains?(message_lower, "has already been taken") ||
                  String.contains?(message_lower, "already been taken") ||
                  String.contains?(message_lower, "already exists") ||
                  String.contains?(message_lower, "unique") ||
                  String.contains?(message_lower, "constraint") ||
                  String.contains?(message_lower, "duplicate")

              %{field: :email} ->
                # Only consider this a duplicate if we can't determine from the message
                false

              _ ->
                false
            end
          end)

        if is_duplicate_email do
          socket =
            socket
            |> assign(newsletter_message: "You're already subscribed to our newsletter!")
            |> put_flash(:info, "You're already subscribed to our newsletter!")

          # Clear flash after 4 seconds
          Process.send_after(self(), :clear_flash, 4000)

          end_time = System.monotonic_time(:millisecond)

          IO.puts(
            "Newsletter signup DUPLICATE completed at #{end_time}, took #{end_time - start_time}ms"
          )

          {:noreply, socket}
        else
          # Handle other validation errors (like invalid email format)
          error_message =
            case changeset.errors do
              [%{field: :email, message: message} | _] -> message
              _ -> "Please enter a valid email address."
            end

          socket =
            socket
            |> assign(newsletter_error: error_message)
            |> put_flash(:error, error_message)

          end_time = System.monotonic_time(:millisecond)

          IO.puts(
            "Newsletter signup ERROR completed at #{end_time}, took #{end_time - start_time}ms"
          )

          {:noreply, socket}
        end
    end
  end

  def handle_info(:clear_flash, socket) do
    {:noreply, clear_flash(socket)}
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content={@csrf_token} />
        <title>Streampai - Multi-Platform Streaming Solution</title>
        <meta
          name="description"
          content="Stream to Twitch, YouTube, Kick, Facebook simultaneously. Unified chat, analytics, and AI moderation for content creators."
        />
      </head>
      <body class="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
