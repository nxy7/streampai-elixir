defmodule StreampaiWeb.Components.LandingNavigation do
  use StreampaiWeb, :html

  attr :current_user, :any, default: nil

  def landing_navigation(assigns) do
    ~H"""
    <nav class="relative z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span class="text-2xl font-bold text-white">Streampai</span>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" class="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" class="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#about" class="text-gray-300 hover:text-white transition-colors">About</a>

            <%= if @current_user do %>
              <a
                href="/dashboard"
                class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Dashboard
              </a>
            <% else %>
              <a
                href="/auth/sign-in"
                class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Get Started
              </a>
            <% end %>
          </div>
          
    <!-- Mobile menu button -->
          <div class="md:hidden">
            <button type="button" class="text-gray-300 hover:text-white">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
    """
  end
end
