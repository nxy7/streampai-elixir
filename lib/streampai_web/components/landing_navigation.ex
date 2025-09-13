defmodule StreampaiWeb.Components.LandingNavigation do
  @moduledoc false
  use StreampaiWeb, :html

  @nav_items [
    %{url: "#features", label: "Features"},
    # %{url: "#pricing", label: "Pricing"}, # HIDDEN: will be restored later
    %{url: "#about", label: "About"}
  ]

  attr(:current_user, :any, default: nil)

  def landing_navigation(assigns) do
    ~H"""
    <nav
      id="mobile-navigation"
      class="relative z-50 bg-black/20 border-b border-white/10"
      phx-hook="MobileNavigation"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/images/logo-white.png" alt="Streampai Logo" class="w-8 h-8" />
              <span class="ktext-xl font-bold text-white">Streampai</span>
            </div>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <.nav_links class="text-gray-300 hover:text-white transition-colors" />
            <.auth_buttons current_user={@current_user} />
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
        <div
          id="mobile-menu"
          class="absolute top-20 left-0 right-0 z-50 hidden"
        >
          <div class="mx-4 mt-2 px-4 py-4 space-y-4 bg-white/10 backdrop-blur-md rounded-lg">
            <.nav_links class="block text-gray-300 hover:text-white py-2" />
            <div class="pt-2">
              <.auth_buttons current_user={@current_user} class="w-full block text-center" />
            </div>
          </div>
        </div>
      </div>
    </nav>
    """
  end

  attr(:class, :string, default: "")

  defp nav_links(assigns) do
    nav_items = @nav_items
    assigns = assign(assigns, :nav_items, nav_items)

    ~H"""
    <a :for={item <- @nav_items} href={item.url} class={@class}>{item.label}</a>
    """
  end

  attr(:class, :string, default: "")
  attr(:current_user, :any, default: nil)

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
          class={[
            "bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all",
            @class
          ]}
        >
          Dashboard
        </.link>
      <% else %>
        <.link
          href="/auth/sign-in"
          class={[
            "bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all",
            @class
          ]}
        >
          Get Started
        </.link>
      <% end %>
      """
    end
  end
end
