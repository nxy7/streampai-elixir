defmodule StreampaiWeb.Components.LandingFooter do
  use StreampaiWeb, :html

  def landing_footer(assigns) do
    ~H"""
    <!-- Footer -->
    <footer class="bg-black/40 border-t border-white/10 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-2 mb-4 md:mb-0">
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-white">Streampai</span>
          </div>
          
          <div class="flex space-x-6 text-gray-300">
            <a href="#" class="hover:text-white transition-colors">Privacy</a>
            <a href="#" class="hover:text-white transition-colors">Terms</a>
            <a href="#" class="hover:text-white transition-colors">Support</a>
            <a href="#" class="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        
        <div class="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
          <p>&copy; 2024 Streampai. All rights reserved. Made with ❤️ for streamers.</p>
        </div>
      </div>
    </footer>
    """
  end
end