defmodule StreampaiWeb.PrivacyLive do
  use StreampaiWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Privacy Policy - Streampai</title>
        <meta
          name="description"
          content="Streampai Privacy Policy - Learn how we collect, use, and protect your personal information."
        />
        <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
        <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
        </script>
      </head>
      <body class="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <!-- Simple Navigation -->
          <nav class="relative z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between items-center py-4">
                <a href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                  <span class="text-2xl font-bold text-white">Streampai</span>
                </a>
                <a href="/" class="text-gray-300 hover:text-white transition-colors">
                  ← Back to Home
                </a>
              </div>
            </div>
          </nav>
          
    <!-- Content -->
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
              <h1 class="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

              <div class="space-y-6 text-gray-300">
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
                  <p class="mb-4">
                    At Streampai, we collect information necessary to provide you with the best streaming experience across multiple platforms.
                  </p>
                  <ul class="list-disc pl-6 space-y-2">
                    <li>Account information (email, username, profile data)</li>
                    <li>Streaming platform authentication tokens</li>
                    <li>Usage analytics and performance metrics</li>
                    <li>Chat messages and stream interactions (processed in real-time)</li>
                  </ul>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
                  <p class="mb-4">We use your information to:</p>
                  <ul class="list-disc pl-6 space-y-2">
                    <li>Provide multi-platform streaming services</li>
                    <li>Aggregate and display chat from multiple platforms</li>
                    <li>Generate analytics and insights for your streams</li>
                    <li>Improve our AI moderation tools</li>
                    <li>Communicate important service updates</li>
                  </ul>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Data Security</h2>
                  <p>
                    We implement industry-standard security measures to protect your data. All streaming tokens are encrypted,
                    and we never store your platform passwords. Your streaming content passes through our systems but is not stored.
                  </p>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Third-Party Integrations</h2>
                  <p>
                    Streampai integrates with various streaming platforms (Twitch, YouTube, Facebook, etc.).
                    Each platform has its own privacy policy that governs how they handle your data.
                  </p>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                  <p>
                    If you have questions about this Privacy Policy, please contact us at
                    <a href="/contact" class="text-purple-400 hover:text-purple-300">
                      our contact page
                    </a>
                    or email <a
                      href="mailto:privacy@streampai.com"
                      class="text-purple-400 hover:text-purple-300"
                    >privacy@streampai.com</a>.
                  </p>
                </div>

                <div class="border-t border-white/20 pt-6 text-sm text-gray-400">
                  <p>Last updated: {Date.utc_today() |> Date.to_string()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
    """
  end
end
