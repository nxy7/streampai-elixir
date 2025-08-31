defmodule StreampaiWeb.SupportLive do
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
        <title>Support - Streampai</title>
        <meta
          name="description"
          content="Get help and support for Streampai - FAQ, documentation, and contact information."
        />
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
              <h1 class="text-4xl font-bold text-white mb-8">Support Center</h1>

              <div class="space-y-8">
                <!-- Quick Help -->
                <div class="bg-purple-500/20 border border-purple-500/30 rounded-xl p-6">
                  <h2 class="text-2xl font-semibold text-white mb-4 flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Quick Help
                  </h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white/10 rounded-lg p-4">
                      <h3 class="text-white font-semibold mb-2">Getting Started</h3>
                      <p class="text-gray-300 text-sm mb-3">
                        New to Streampai? Learn the basics of multi-platform streaming.
                      </p>
                      <a href="#" class="text-purple-400 hover:text-purple-300 text-sm font-medium">
                        Read Guide →
                      </a>
                    </div>
                    <div class="bg-white/10 rounded-lg p-4">
                      <h3 class="text-white font-semibold mb-2">Platform Setup</h3>
                      <p class="text-gray-300 text-sm mb-3">
                        Connect your Twitch, YouTube, and other streaming accounts.
                      </p>
                      <a href="#" class="text-purple-400 hover:text-purple-300 text-sm font-medium">
                        Setup Guide →
                      </a>
                    </div>
                  </div>
                </div>
                
    <!-- FAQ -->
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
                  <div class="space-y-4">
                    <div class="bg-white/5 border border-white/10 rounded-lg p-6">
                      <h3 class="text-lg font-medium text-white mb-2">
                        How many platforms can I stream to simultaneously?
                      </h3>
                      <p class="text-gray-300">
                        Free users can stream to 1 platform at a time. Pro users can stream to all supported platforms simultaneously (Twitch, YouTube, Facebook, Kick, and more).
                      </p>
                    </div>
                    <div class="bg-white/5 border border-white/10 rounded-lg p-6">
                      <h3 class="text-lg font-medium text-white mb-2">
                        Is there a limit on streaming hours?
                      </h3>
                      <p class="text-gray-300">
                        Free users get {Streampai.Constants.free_tier_hour_limit()} hours per month. Pro users have unlimited streaming time.
                      </p>
                    </div>
                    <div class="bg-white/5 border border-white/10 rounded-lg p-6">
                      <h3 class="text-lg font-medium text-white mb-2">
                        How does the AI moderation work?
                      </h3>
                      <p class="text-gray-300">
                        Our AI moderation analyzes chat messages across all platforms in real-time, automatically filtering spam, toxicity, and inappropriate content based on customizable rules.
                      </p>
                    </div>
                    <div class="bg-white/5 border border-white/10 rounded-lg p-6">
                      <h3 class="text-lg font-medium text-white mb-2">
                        Can I cancel my subscription anytime?
                      </h3>
                      <p class="text-gray-300">
                        Yes! You can cancel your Pro subscription at any time. You'll continue to have Pro features until the end of your billing period.
                      </p>
                    </div>
                  </div>
                </div>
                
    <!-- Contact Support -->
                <div class="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
                  <h2 class="text-2xl font-semibold text-white mb-4 flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.196l-4.243 4.243a1 1 0 000 1.414L12 12.097l4.243-4.244a1 1 0 000-1.414L12 2.196z"
                      />
                    </svg>
                    Still Need Help?
                  </h2>
                  <p class="text-gray-300 mb-6">
                    Our support team is here to help you succeed with your streaming journey.
                  </p>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                      href="/contact"
                      class="block bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-4 transition-colors"
                    >
                      <div class="flex items-center mb-2">
                        <svg
                          class="w-5 h-5 text-blue-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span class="text-white font-medium">Contact Form</span>
                      </div>
                      <p class="text-gray-300 text-sm">
                        Send us a detailed message and we'll get back to you within 24 hours.
                      </p>
                    </a>

                    <div class="bg-white/10 border border-white/20 rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <svg
                          class="w-5 h-5 text-green-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6H3a1 1 0 110-2h4z"
                          />
                        </svg>
                        <span class="text-white font-medium">Email Support</span>
                      </div>
                      <p class="text-gray-300 text-sm">
                        <a
                          href="mailto:support@streampai.com"
                          class="text-blue-400 hover:text-blue-300"
                        >
                          support@streampai.com
                        </a>
                      </p>
                      <p class="text-gray-400 text-xs mt-1">Pro users get priority support</p>
                    </div>
                  </div>
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
