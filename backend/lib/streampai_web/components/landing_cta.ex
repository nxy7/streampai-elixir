defmodule StreampaiWeb.Components.LandingCTA do
  use StreampaiWeb, :html

  def landing_cta(assigns) do
    ~H"""
    <!-- CTA Section -->
    <section class="py-24 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Level Up Your Stream?
        </h2>
        <p class="text-xl text-gray-300">
          Join streamers who are already growing their audience with Streampai
        </p>
        <%!-- <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/sign-in"
            class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl"
          >
            Start Free Trial - No Credit Card
          </a>
          <button class="border border-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
            Schedule a Demo
          </button>
        </div> --%>
      </div>
    </section>
    """
  end
end
