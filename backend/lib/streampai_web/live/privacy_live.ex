defmodule StreampaiWeb.PrivacyLive do
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.StaticPageLayout

  def mount(_params, _session, socket) do
    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <.static_page_layout
      title="Privacy Policy"
      description="Streampai Privacy Policy - Learn how we collect, use, and protect your personal information."
    >
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
    </.static_page_layout>
    """
  end
end
