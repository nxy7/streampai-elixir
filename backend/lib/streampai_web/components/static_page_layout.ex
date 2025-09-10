defmodule StreampaiWeb.Components.StaticPageLayout do
  @moduledoc false
  use StreampaiWeb, :html

  attr :title, :string, required: true
  attr :description, :string, required: true
  slot :inner_block, required: true

  def static_page_layout(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{@title} - Streampai</title>
        <meta name="description" content={@description} />
      </head>
      <body class="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <.simple_navigation />
          
    <!-- Content -->
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
              {render_slot(@inner_block)}
            </div>
          </div>
        </div>
      </body>
    </html>
    """
  end

  defp simple_navigation(assigns) do
    ~H"""
    <!-- Simple Navigation -->
    <nav class="relative z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <a href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span class="text-2xl font-bold text-white">Streampai</span>
          </a>
          <a href="/" class="text-gray-300 hover:text-white transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </nav>
    """
  end
end
