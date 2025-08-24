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
        <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
        <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
        </script>
      </head>
      <body class="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <.landing_navigation current_user={@current_user} />
          <.landing_hero />
          <.landing_features />
          <.landing_pricing current_user={@current_user} />
          <.landing_cta />
          <.landing_footer />
        </div>
      </body>
    </html>
    """
  end
end
