defmodule StreampaiWeb.Components.LandingFeatures do
  use StreampaiWeb, :html

  def landing_features(assigns) do
    ~H"""
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
    """
  end
end