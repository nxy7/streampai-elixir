defmodule StreampaiWeb.Components.LandingNavigation do
  use StreampaiWeb, :html

  attr(:current_user, :any, default: nil)

  def landing_navigation(assigns) do
    ~H"""
    <nav class="relative z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/images/logo-white.png" alt="Streampai Logo" class="w-8 h-8" />
              <span class="ktext-xl font-bold text-white">Streampai</span>
            </div>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <.link navigate="#features" class="text-gray-300 hover:text-white transition-colors">
              Features
            </.link>
            <!-- HIDDEN: Pricing link will be restored later -->
            <div class="hidden">
              <.link navigate="#pricing" class="text-gray-300 hover:text-white transition-colors">
                Pricing
              </.link>
            </div>
            <.link navigate="#about" class="text-gray-300 hover:text-white transition-colors">
              About
            </.link>

            {auth_buttons(assigns)}
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

  if Mix.env() != :prod do
    defp auth_buttons(assigns) do
      ~H"""
      <%= if @current_user do %>
        <.link
          navigate="/dashboard"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Dashboard
        </.link>
      <% else %>
        <.link
          navigate="/auth/sign-in"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Get Started
        </.link>
      <% end %>
      """
    end
  else
    defp auth_buttons(_assigns) do
      assigns = %{}
      ~H""
    end
  end
end
