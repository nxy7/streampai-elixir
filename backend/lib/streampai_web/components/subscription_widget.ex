defmodule StreampaiWeb.Components.SubscriptionWidget do
  use StreampaiWeb, :html

  def subscription_widget(assigns) do
    assigns =
      assigns
      |> assign_new(:current_plan, fn -> "free" end)
      |> assign_new(:usage, fn ->
        %{
          hours_used: 1.5,
          hours_limit: Streampai.Constants.free_tier_hour_limit(),
          platforms_used: 1,
          platforms_limit: 1
        }
      end)
      |> assign_new(:platform_connections, fn -> [] end)

    ~H"""
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-900">Plan & Billing</h3>
        <span class={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{plan_badge_classes(@current_plan)}"}>
          {String.capitalize(@current_plan)} Plan
        </span>
      </div>
      
    <!-- Current Plan Overview -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Streaming Hours -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Streaming Hours</span>
              <span class="text-sm text-gray-500">
                {@usage.hours_used}/{if @usage.hours_limit == :unlimited,
                  do: "∞",
                  else: "#{@usage.hours_limit}h"}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <%= if @usage.hours_limit == :unlimited do %>
                <div
                  class="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style="width: 25%"
                >
                </div>
              <% else %>
                <div
                  class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={"width: #{min((@usage.hours_used / @usage.hours_limit) * 100, 100)}%"}
                >
                </div>
              <% end %>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              <%= if @usage.hours_limit == :unlimited do %>
                Unlimited streaming time
              <% else %>
                {Float.round(@usage.hours_limit - @usage.hours_used, 1)} hours remaining this month
              <% end %>
            </p>
          </div>
          
    <!-- Platforms -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Platforms</span>
              <span class="text-sm text-gray-500">
                {@usage.platforms_used}/{if @usage.platforms_limit == :unlimited,
                  do: "∞",
                  else: @usage.platforms_limit}
              </span>
            </div>
            <div class="flex space-x-2 mt-2">
              <%= for connection <- @platform_connections do %>
                <div class={"w-8 h-8 rounded-lg flex items-center justify-center #{if connection.connected, do: "bg-#{connection.color}-500", else: "bg-gray-200"}"}>
                  <%= if connection.platform == :twitch do %>
                    <svg
                      class={"w-5 h-5 #{if connection.connected, do: "text-white", else: "text-gray-400"}"}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z" />
                    </svg>
                  <% else %>
                    <svg
                      class={"w-5 h-5 #{if connection.connected, do: "text-white", else: "text-gray-400"}"}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  <% end %>
                </div>
              <% end %>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              <%= if @usage.platforms_limit == :unlimited do %>
                All platforms available
              <% else %>
                {if @usage.platforms_used >= @usage.platforms_limit,
                  do: "Platform limit reached",
                  else: "#{@usage.platforms_limit - @usage.platforms_used} more platform(s) available"}
              <% end %>
            </p>
          </div>
        </div>
      </div>
      
    <!-- Plan Comparison -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Available Plans</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Free Plan -->
          <div class={"border-2 rounded-lg p-4 transition-all duration-200 #{if @current_plan == "free", do: "border-purple-500 bg-purple-50", else: "border-gray-200 hover:border-gray-300"}"}>
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900">Free</h5>
              <span class="text-lg font-bold text-gray-900">$0</span>
            </div>
            <ul class="text-sm text-gray-600 space-y-1 mb-4">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                {Streampai.Constants.free_tier_hour_limit()} hours/month
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                1 platform
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Basic widgets
              </li>
            </ul>
            <%= if @current_plan == "free" do %>
              <button
                disabled
                class="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-lg text-sm cursor-not-allowed"
              >
                Current Plan
              </button>
            <% else %>
              <button
                phx-click="downgrade_to_free"
                class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Downgrade to Free
              </button>
            <% end %>
          </div>
          
    <!-- Pro Plan -->
          <div class={"border-2 rounded-lg p-4 transition-all duration-200 #{if @current_plan == "pro", do: "border-purple-500 bg-purple-50", else: "border-gray-200 hover:border-gray-300"}"}>
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-medium text-gray-900">Pro</h5>
              <div class="text-right">
                <span class="text-lg font-bold text-gray-900">
                  {Streampai.Pricing.monthly_price_formatted()}<span class="text-sm font-normal text-gray-500">/mo</span>
                </span>
                <div class="text-xs text-gray-600">
                  or {Streampai.Pricing.yearly_monthly_equivalent_formatted()}/mo billed yearly
                </div>
              </div>
            </div>
            <!-- Yearly discount banner -->
            <div class="bg-green-100 border border-green-200 rounded-lg p-2 mb-3">
              <div class="flex items-center text-green-700 text-xs">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="font-medium">
                  Save {Streampai.Pricing.yearly_discount_formatted()} with yearly billing
                </span>
              </div>
              <div class="text-green-600 text-xs mt-1">
                {Streampai.Pricing.yearly_price_formatted()}/year (normally {:erlang.float_to_binary(
                  Streampai.Pricing.monthly_price() * 12,
                  decimals: 2
                )
                |> then(&("$" <> &1))})
              </div>
            </div>
            <ul class="text-sm text-gray-600 space-y-1 mb-4">
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Unlimited hours
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                All platforms
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Premium widgets
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Priority support
              </li>
            </ul>
            <%= if @current_plan == "pro" do %>
              <button
                disabled
                class="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-lg text-sm cursor-not-allowed"
              >
                Current Plan
              </button>
            <% else %>
              <button
                phx-click="upgrade_to_pro"
                class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                Upgrade to Pro
              </button>
            <% end %>
          </div>
        </div>
      </div>
      
    <!-- Billing History -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-gray-900">Billing History</h4>
          <button class="text-sm text-purple-600 hover:text-purple-700">View All</button>
        </div>

        <%= if @current_plan == "free" do %>
          <div class="text-center py-6 text-gray-500">
            <svg
              class="mx-auto h-8 w-8 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p class="text-sm">No billing history yet</p>
            <p class="text-xs text-gray-400">Upgrade to Pro</p>
          </div>
        <% else %>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p class="text-sm font-medium text-gray-900">Pro Plan - December 2024</p>
                <p class="text-xs text-gray-500">Paid on Dec 1, 2024</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">
                  {Streampai.Pricing.monthly_price_formatted()}
                </p>
                <button class="text-xs text-purple-600 hover:text-purple-700">Download</button>
              </div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p class="text-sm font-medium text-gray-900">Pro Plan - November 2024</p>
                <p class="text-xs text-gray-500">Paid on Nov 1, 2024</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">
                  {Streampai.Pricing.monthly_price_formatted()}
                </p>
                <button class="text-xs text-purple-600 hover:text-purple-700">Download</button>
              </div>
            </div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp plan_badge_classes("free"), do: "bg-gray-100 text-gray-800"
  defp plan_badge_classes("pro"), do: "bg-purple-100 text-purple-800"
  defp plan_badge_classes(_), do: "bg-gray-100 text-gray-800"
end
