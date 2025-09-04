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

    {:ok, assign(socket, csrf_token: csrf_token), layout: false}
  end

  def handle_event("newsletter_signup", %{"email" => email}, socket) do
    # TODO: Store email in newsletter list when backend is ready
    # For now, just show a success message
    {:noreply, put_flash(socket, :info, "Thanks! We'll notify you when Streampai launches.")}
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
          <.landing_hero />
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
