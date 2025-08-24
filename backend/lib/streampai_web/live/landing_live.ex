defmodule StreampaiWeb.LandingLive do
  use StreampaiWeb, :live_view

  def mount(_params, session, socket) do
    csrf_token = Map.get(session, "_csrf_token", "")

    {:ok, assign(socket, csrf_token: csrf_token), layout: false}
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content={@csrf_token} />
        <title>Streampai - Multi-Platform Streaming Solution</title>
        <meta name="description" content="Stream to Twitch, YouTube, Kick, Facebook simultaneously. Unified chat, analytics, and AI moderation for content creators." />
        <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
        <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
        </script>
      </head>
      <body class="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <!-- Navigation -->
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
                <a href="/dashboard" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
                  Dashboard
                </a>
              <% else %>
                <a href="/sign-in" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
                  Get Started
                </a>
              <% end %>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative overflow-hidden">
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

            <p class="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect all your streaming platforms, unify your audience, and supercharge your content with AI-powered tools.
              Stream to Twitch, YouTube, Kick, Facebook and more simultaneously.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a href="/sign-in" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl">
                Start Free Trial
              </a>
              <button class="border border-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
                Watch Demo
              </button>
            </div>

            <!-- Platform Logos -->
            <div class="flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.149 0L.537 4.119v13.836c0 .44.26.806.684.956L2.149 24h11.983l1.695-4.956c.426-.15.685-.516.685-.956V4.119L14.676 0H2.149zm8.77 4.119v2.836h2.836V4.119h-2.836zm-5.673 0v2.836h2.836V4.119H5.246zm11.346 5.673v2.836h2.836v-2.836h-2.836zm-5.673 0v2.836h2.836v-2.836h-2.836z"/>
                  </svg>
                </div>
                <span class="text-white font-medium">Twitch</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <svg class="w-6 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
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
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span class="text-white font-medium">Facebook</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <span class="text-white font-medium">+More</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Elements -->
        <div class="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div class="absolute top-40 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div class="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-24 bg-black/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-20">
            <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to
              <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Dominate</span>
            </h2>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful tools designed for serious streamers who want to grow their audience across all platforms
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Multi-Platform Streaming -->
            <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div class="flex items-start space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white flex-grow">Multi-Platform Streaming</h3>
              </div>
              <p class="text-gray-300 leading-relaxed">
                Stream to Twitch, YouTube, Kick, Facebook, and more simultaneously. One stream, maximum reach.
              </p>
            </div>

            <!-- Unified Chat -->
            <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div class="flex items-start space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white flex-grow">Unified Chat Management</h3>
              </div>
              <p class="text-gray-300 leading-relaxed">
                Merge all platform chats into one stream. Never miss a message from any platform again.
              </p>
            </div>

            <!-- Real-time Analytics -->
            <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div class="flex items-start space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white flex-grow">Real-time Analytics</h3>
              </div>
              <p class="text-gray-300 leading-relaxed">
                Track viewers, engagement, revenue, and growth across all platforms in one beautiful dashboard.
              </p>
            </div>

            <!-- Smart Moderation -->
            <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div class="flex items-start space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white flex-grow">AI-Powered Moderation</h3>
              </div>
              <p class="text-gray-300 leading-relaxed">
                Auto-moderation with custom rules, spam detection, and toxicity filtering across all platforms.
              </p>
            </div>

            <!-- Stream Widgets -->
            <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div class="flex items-start space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white flex-grow">Custom Stream Widgets</h3>
              </div>
              <p class="text-gray-300 leading-relaxed">
                Beautiful, customizable widgets for donations, follows, chat, and more. Perfect for your brand.
              </p>
            </div>

            <!-- Team Management -->
            <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
              <div class="flex items-start space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white flex-grow">Team & Moderator Tools</h3>
              </div>
              <p class="text-gray-300 leading-relaxed">
                Powerful moderator dashboard, team management, and collaborative stream management tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div class="group">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">5000+</div>
              <div class="text-gray-300">Active Streamers</div>
            </div>
            <div class="group">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">50M+</div>
              <div class="text-gray-300">Messages Processed</div>
            </div>
            <div class="group">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">99.9%</div>
              <div class="text-gray-300">Uptime</div>
            </div>
            <div class="group">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">8</div>
              <div class="text-gray-300">Platforms Supported</div>
            </div>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section id="about" class="py-24 bg-black/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">
                Built by Streamers,
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  for Streamers
                </span>
              </h2>
              <div class="space-y-6 text-lg text-gray-300">
                <p>
                  We understand the struggle of managing multiple streaming platforms. That's why we created Streampai -
                  the ultimate solution for content creators who want to maximize their reach without the complexity.
                </p>
                <p>
                  Gone are the days of juggling multiple chat windows, donation alerts, and analytics dashboards.
                  Streampai brings everything together in one powerful, intuitive platform that scales with your growth.
                </p>
                <p>
                  Whether you're a weekend warrior or a full-time content creator, our AI-powered tools help you
                  focus on what matters most: creating amazing content and building your community.
                </p>
              </div>

              <div class="mt-12 grid grid-cols-2 gap-8">
                <div class="text-center">
                  <div class="text-3xl font-bold text-purple-400 mb-2">50+</div>
                  <div class="text-gray-300">Platform Integrations</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-pink-400 mb-2">99.9%</div>
                  <div class="text-gray-300">Uptime Guaranteed</div>
                </div>
              </div>
            </div>

            <div class="relative">
              <div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-8 backdrop-blur-lg border border-white/10">
                <div class="space-y-6">
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="text-white font-semibold">Real-time Sync</h4>
                      <p class="text-gray-300">Chat and events synchronized across all platforms instantly</p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="text-white font-semibold">Advanced Analytics</h4>
                      <p class="text-gray-300">Deep insights into viewer behavior and engagement patterns</p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="text-white font-semibold">AI-Powered Growth</h4>
                      <p class="text-gray-300">Smart recommendations to optimize your content strategy</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Floating decoration -->
              <div class="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

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
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-300"><%= Streampai.Constants.free_tier_hour_limit %> hours of streaming time</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span class="text-gray-300">One streaming platform at a time</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-300">Unified chat & widgets</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-300">Basic analytics</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-gray-300">Data from last 3 days only</span>
                </li>
              </ul>

              <%= if @current_user do %>
                <a href="/dashboard" class="block w-full text-center border border-white/30 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/10 transition-all">
                  Go to Dashboard
                </a>
              <% else %>
                <a href="/sign-in" class="block w-full text-center border border-white/30 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/10 transition-all">
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
                  <%= Streampai.Pricing.monthly_price_formatted() %>
                  <span class="text-lg text-gray-300 font-normal">/month</span>
                </div>
                <div class="text-sm text-purple-200 mb-2">
                  or <%= Streampai.Pricing.yearly_price_formatted() %>/year
                  <span class="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-semibold ml-1">
                    Save <%= Streampai.Pricing.yearly_discount_formatted() %>
                  </span>
                </div>
                <div class="text-gray-300">For serious streamers</div>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white font-semibold">Unlimited streaming time</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white font-semibold">Stream to ALL platforms simultaneously</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white">Advanced AI moderation</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white">Custom widgets & branding</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white">Complete analytics & insights</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white">Team & moderator management</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-white">Priority support</span>
                </li>
                <li class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span class="text-white font-semibold">Full historical data access</span>
                </li>
              </ul>

              <%= if @current_user do %>
                <a href="/dashboard?upgrade=pro" class="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl">
                  Upgrade to Pro
                </a>
              <% else %>
                <a href="/sign-in" class="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl">
                  Start Pro Plan
                </a>
              <% end %>

              <div class="text-center mt-4">
                <span class="text-sm text-gray-300">30-day money-back guarantee</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-24 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Level Up Your Stream?
          </h2>
          <p class="text-xl text-gray-300 mb-12">
            Join thousands of streamers who are already growing their audience with Streampai
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-xl">
              Start Free Trial - No Credit Card
            </button>
            <button class="border border-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

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
            <p>&copy; <%= Date.utc_today().year %> Streampai. All rights reserved. Made with ❤️ for streamers.</p>
          </div>
        </div>
      </footer>
        </div>
      </body>
    </html>
    """
  end
end
