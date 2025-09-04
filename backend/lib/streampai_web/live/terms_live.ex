defmodule StreampaiWeb.TermsLive do
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.StaticPageLayout

  def mount(_params, _session, socket) do
    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <.static_page_layout
      title="Terms of Service"
      description="Streampai Terms of Service - Legal terms and conditions for using our streaming platform."
    >
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
    </.static_page_layout>
    """
  end
end
