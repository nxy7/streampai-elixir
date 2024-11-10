defmodule StreampaiWeb.SettingsLive do
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout
  import StreampaiWeb.Components.SubscriptionWidget

  def mount(_params, _session, socket) do
    {:ok,
     assign(socket,
       sidebar_expanded: true,
       current_plan: "free",
       usage: %{
         hours_used: 1.5,
         hours_limit: Streampai.Constants.free_tier_hour_limit(),
         platforms_used: 1,
         platforms_limit: 1
       }
     ), layout: false}
  end

  def handle_event("toggle_sidebar", _params, socket) do
    {:noreply, assign(socket, sidebar_expanded: !socket.assigns.sidebar_expanded)}
  end

  def handle_event("upgrade_to_pro", _params, socket) do
    # In a real app, this would integrate with Stripe/payment processor
    {:noreply,
     socket
     |> assign(current_plan: "pro")
     |> assign(
       usage: %{
         hours_used: 2.5,
         hours_limit: :unlimited,
         platforms_used: 1,
         platforms_limit: :unlimited
       }
     )
     |> put_flash(:info, "Successfully upgraded to Pro plan!")}
  end

  def handle_event("downgrade_to_free", _params, socket) do
    # In a real app, this would integrate with Stripe/payment processor
    {:noreply,
     socket
     |> assign(current_plan: "free")
     |> put_flash(:info, "Successfully downgraded to Free plan!")}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout
      current_user={@current_user}
      sidebar_expanded={@sidebar_expanded}
      current_page="settings"
      page_title="Settings"
    >
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Subscription Widget -->
        <.subscription_widget current_plan={@current_plan} usage={@usage} />

        <!-- Account Settings -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Account Settings</h3>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={if @current_user && @current_user.email, do: @current_user.email, else: ""} class="w-full border border-gray-300 rounded-lg px-3 py-2" readonly>
              <p class="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input type="text" placeholder="Enter display name" class="w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Streaming Platforms</label>
              <div class="space-y-2">
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span class="text-sm text-gray-600">Twitch: Not connected</span>
                  <a href="/streaming/connect/twitch" class="text-purple-600 hover:text-purple-700 text-sm font-medium">Connect</a>
                </div>
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span class="text-sm text-gray-600">YouTube: Not connected</span>
                  <a href="/streaming/connect/google" class="text-red-600 hover:text-red-700 text-sm font-medium">Connect</a>
                </div>
              </div>
            </div>
            <div>
              <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications Settings -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p class="text-sm text-gray-500">Get notified about important account updates</p>
              </div>
              <button class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 bg-purple-600">
                <span class="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900">Stream Alerts</h4>
                <p class="text-sm text-gray-500">Get alerts when your stream goes live</p>
              </div>
              <button class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 bg-gray-200">
                <span class="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
