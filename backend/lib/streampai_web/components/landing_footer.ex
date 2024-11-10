defmodule StreampaiWeb.Components.LandingFooter do
  use StreampaiWeb, :html

  def landing_footer(assigns) do
    ~H"""
    <!-- Footer -->
    <footer class="bg-black/40 border-t border-white/10 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/images/logo-white.png" alt="Streampai Logo" class="w-8 h-8" />
            <span class="ktext-xl font-bold text-white">Streampai</span>
          </div>

          <div class="flex space-x-6 text-gray-300">
            <a href="/privacy" class="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" class="hover:text-white transition-colors">Terms</a>
            <a href="/support" class="hover:text-white transition-colors">Support</a>
            <a href="/contact" class="hover:text-white transition-colors">Contact</a>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
          <p>
            &copy; {Date.utc_today().year} Streampai. All rights reserved. Made with ❤️ for streamers.
          </p>
        </div>
      </div>
    </footer>
    """
  end
end
