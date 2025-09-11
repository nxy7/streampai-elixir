defmodule StreampaiWeb.Components.LandingNavigation do
  @moduledoc false
  use StreampaiWeb, :html

  attr(:current_user, :any, default: nil)

  def landing_navigation(assigns) do
    ~H"""
    <nav id="mobile-navigation" class="relative z-50 bg-black/20 backdrop-blur-lg border-b border-white/10" phx-hook="MobileNavigation">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/images/logo-white.png" alt="Streampai Logo" class="w-8 h-8" />
              <span class="ktext-xl font-bold text-white">Streampai</span>
            </div>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" class="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <!-- HIDDEN: Pricing link will be restored later -->
            <div class="hidden">
              <a href="#pricing" class="text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
            </div>
            <a href="#about" class="text-gray-300 hover:text-white transition-colors">
              About
            </a>

            {auth_buttons(assigns)}
          </div>
          
    <!-- Mobile menu button -->
          <div class="md:hidden">
            <button 
              type="button" 
              class="text-gray-300 hover:text-white"
              data-mobile-toggle
            >
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

        <!-- Mobile menu -->
        <div id="mobile-menu" class="absolute top-full left-0 right-0 md:hidden opacity-0 scale-95 hidden z-50 transition-all duration-300 ease-in-out">
          <div class="mx-4 mt-2 px-4 py-4 space-y-4 bg-gray-900/90 rounded-lg shadow-xl">
            <a href="#features" class="block text-gray-300 hover:text-white transition-colors py-2">
              Features
            </a>
            <a href="#about" class="block text-gray-300 hover:text-white transition-colors py-2">
              About
            </a>
            <div class="pt-2">
              {auth_buttons(assigns)}
            </div>
          </div>
        </div>
      </div>
    </nav>
    """
  end

  if Mix.env() == :prod do
    defp auth_buttons(_assigns) do
      assigns = %{}
      ~H""
    end
  else
    defp auth_buttons(assigns) do
      ~H"""
      <%= if @current_user do %>
        <.link
          href="/dashboard"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Dashboard
        </.link>
      <% else %>
        <.link
          href="/auth/sign-in"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Get Started
        </.link>
      <% end %>
      """
    end
  end
end
