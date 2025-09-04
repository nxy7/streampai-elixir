defmodule StreampaiWeb.Components.LandingHero do
  use StreampaiWeb, :html

  def landing_hero(assigns) do
    ~H"""
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-5xl md:text-7xl font-bold text-white mb-8">
            Stream to
            <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Everyone
            </span>
            <br />at Once
          </h1>

          <div class="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <div class="flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-yellow-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h2 class="text-2xl font-bold text-yellow-400">Under Construction</h2>
            </div>
            <p class="text-white text-lg text-center mb-6">
              We're building something amazing! Streampai is currently under development.
              Join our newsletter to be the first to know when we launch.
            </p>

            <form
              class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              phx-submit="newsletter_signup"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
                class="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl"
              >
                Notify Me
              </button>
            </form>
          </div>

          <p class="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect all your streaming platforms, unify your audience, and supercharge your content with AI-powered tools.
            Stream to Twitch, YouTube, Kick, Facebook and more simultaneously.
          </p>

          {hero_auth_buttons(assigns)}
          
    <!-- Platform Logos -->
          <div class="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.149 0L.537 4.119v13.836c0 .44.26.806.684.956L2.149 24h11.983l1.695-4.956c.426-.15.685-.516.685-.956V4.119L14.676 0H2.149zm8.77 4.119v2.836h2.836V4.119h-2.836zm-5.673 0v2.836h2.836V4.119H5.246zm11.346 5.673v2.836h2.836v-2.836h-2.836zm-5.673 0v2.836h2.836v-2.836h-2.836z" />
                </svg>
              </div>
              <span class="text-white font-medium">Twitch</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <svg class="w-6 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </div>
              <span class="text-white font-medium">YouTube</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">K</span>
              </div>
              <span class="text-white font-medium">Kick</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span class="text-white font-medium">Facebook</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span class="text-white font-medium">More</span>
            </div>
          </div>
        </div>
      </div>
      
    <!-- Floating Elements -->
      <div class="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse">
      </div>
      <div class="absolute top-40 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-1000">
      </div>
      <div class="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500">
      </div>
    </section>
    """
  end

  if false do
    defp hero_auth_buttons(assigns) do
      ~H"""
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <a
          href="/auth/sign-in"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl"
        >
          Start Free Trial
        </a>
        <button class="border border-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
          Watch Demo
        </button>
      </div>
      """
    end
  else
    defp hero_auth_buttons(_assigns) do
      assigns = %{}
      ~H""
    end
  end
end
