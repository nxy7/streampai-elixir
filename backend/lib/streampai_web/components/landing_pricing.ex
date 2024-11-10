defmodule StreampaiWeb.Components.LandingPricing do
  use StreampaiWeb, :html

  attr :current_user, :any, default: nil

  def landing_pricing(assigns) do
    ~H"""
    <!-- Pricing Section -->
    <section id="pricing" class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-20">
          <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple,
            <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transparent
            </span>
            Pricing
          </h2>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto">
            Start free, scale when you're ready. No hidden fees, no surprises.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Free Tier -->
          <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all relative">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-white mb-2">Free Trial</h3>
              <div class="text-4xl font-bold text-white mb-2">$0</div>
              <div class="text-gray-300">Perfect for testing</div>
            </div>

            <ul class="space-y-4 mb-8">
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-300">
                  {Streampai.Constants.free_tier_hour_limit()} hours of streaming time
                </span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span class="text-gray-300">One streaming platform at a time</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-300">Unified chat & widgets</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-gray-300">Basic analytics</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-gray-300">
                  Data from last {Streampai.Constants.free_tier_data_retention_days()} days only
                </span>
              </li>
            </ul>

            <%= if @current_user do %>
              <a
                href="/dashboard"
                class="block w-full text-center border border-white/30 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                Go to Dashboard
              </a>
            <% else %>
              <a
                href="/auth/sign-in"
                class="block w-full text-center border border-white/30 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                Start Free Trial
              </a>
            <% end %>
          </div>
          
    <!-- Pro Tier -->
          <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-2 border-purple-500/50 rounded-2xl p-8 hover:from-purple-500/30 hover:to-pink-500/30 transition-all relative">
            <!-- Popular badge -->
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            </div>

            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-white mb-2">Pro</h3>
              <div class="text-4xl font-bold text-white mb-2">
                {Streampai.Pricing.monthly_price_formatted()}
                <span class="text-lg text-gray-300 font-normal">/month</span>
              </div>
              <div class="text-sm text-purple-200 mb-2">
                or {Streampai.Pricing.yearly_price_formatted()}/year
                <span class="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-semibold ml-1">
                  Save {Streampai.Pricing.yearly_discount_formatted()}
                </span>
              </div>
              <div class="text-gray-300">For serious streamers</div>
              <!-- Price Lock Banner -->
              <div class="mt-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-2">
                <div class="flex items-center text-yellow-300 text-xs">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="font-semibold">Price Lock Guarantee</span>
                </div>
                <div class="text-yellow-200 text-xs mt-1">
                  Subscribe now to lock in this price and avoid future increases
                </div>
              </div>
            </div>

            <ul class="space-y-4 mb-8">
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white font-semibold">Unlimited streaming time</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white font-semibold">Stream to ALL platforms simultaneously</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white">Advanced AI moderation</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white">Custom widgets & branding</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white">Complete analytics & insights</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white">Team & moderator management</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-white">Priority support</span>
              </li>
              <li class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <span class="text-white font-semibold">Full historical data access</span>
              </li>
            </ul>

            <%= if @current_user do %>
              <a
                href="/dashboard?upgrade=pro"
                class="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl"
              >
                Upgrade to Pro
              </a>
            <% else %>
              <a
                href="/auth"
                class="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl"
              >
                Start Pro Plan
              </a>
            <% end %>

            <div class="text-center mt-4">
              <span class="text-sm text-gray-300">
                {Streampai.Constants.money_back_guarantee_days()}-day money-back guarantee
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
    """
  end
end
