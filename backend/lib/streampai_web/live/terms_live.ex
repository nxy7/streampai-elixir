defmodule StreampaiWeb.TermsLive do
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
        <title>Terms of Service - Streampai</title>
        <meta
          name="description"
          content="Streampai Terms of Service - Legal terms and conditions for using our streaming platform."
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
              <h1 class="text-4xl font-bold text-white mb-8">Terms of Service</h1>

              <div class="space-y-6 text-gray-300">
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
                  <p>
                    By accessing and using Streampai, you accept and agree to be bound by the terms and provision of this agreement.
                    If you do not agree with any of these terms, you should not use Streampai.
                  </p>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Service Description</h2>
                  <p class="mb-4">
                    Streampai provides multi-platform streaming services, including:
                  </p>
                  <ul class="list-disc pl-6 space-y-2">
                    <li>Simultaneous streaming to multiple platforms</li>
                    <li>Unified chat management across platforms</li>
                    <li>Real-time analytics and performance metrics</li>
                    <li>AI-powered moderation tools</li>
                    <li>Custom widgets and branding options</li>
                  </ul>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">User Responsibilities</h2>
                  <p class="mb-4">As a user of Streampai, you agree to:</p>
                  <ul class="list-disc pl-6 space-y-2">
                    <li>Comply with all applicable laws and platform terms of service</li>
                    <li>Not use the service for any illegal or harmful activities</li>
                    <li>Respect the rights and privacy of other users</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Not attempt to circumvent or interfere with our security measures</li>
                  </ul>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Content Ownership</h2>
                  <p>
                    You retain all rights to your original content. By using Streampai, you grant us a limited license to
                    process and transmit your content to connected streaming platforms. We do not claim ownership of your content.
                  </p>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Service Availability</h2>
                  <p>
                    While we strive for high availability, we cannot guarantee 100% uptime. We reserve the right to
                    modify, suspend, or discontinue any part of the service with reasonable notice.
                  </p>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
                  <p>
                    Streampai shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                    resulting from your use of the service.
                  </p>
                </div>

                <div>
                  <h2 class="text-2xl font-semibold text-white mb-4">Contact Information</h2>
                  <p>
                    Questions about these Terms of Service should be sent to us at
                    <a href="/contact" class="text-purple-400 hover:text-purple-300">
                      our contact page
                    </a>
                    or email <a
                      href="mailto:legal@streampai.com"
                      class="text-purple-400 hover:text-purple-300"
                    >legal@streampai.com</a>.
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
