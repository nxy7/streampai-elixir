defmodule StreampaiWeb.ChatWidgetLive do
  @moduledoc """
  LiveView for displaying the live chat widget.
  
  This can be used as a browser source in OBS or other streaming software.
  """
  use StreampaiWeb, :live_view
  import StreampaiWeb.Components.DashboardLayout

  def mount(_params, _session, socket) do
    {:ok, socket, layout: false}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Live Chat Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Live Chat Widget Preview</h3>
            <div class="flex items-center space-x-2">
              <button class="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Copy Browser Source URL
              </button>
              <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                Configure
              </button>
            </div>
          </div>
          
          <!-- Chat Widget Display -->
          <div class="max-w-md mx-auto">
            <iframe 
              src={~p"/widgets/chat/display"} 
              class="w-full h-96 border border-gray-200 rounded"
              frameborder="0">
            </iframe>
          </div>
        </div>

        <!-- Configuration Options -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Widget Settings</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Display Options -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-700">Display Options</h4>
              
              <div class="space-y-3">
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-purple-600" checked />
                  <span class="ml-2 text-sm text-gray-700">Show user badges</span>
                </label>
                
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-purple-600" checked />
                  <span class="ml-2 text-sm text-gray-700">Show emotes</span>
                </label>
                
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-purple-600" />
                  <span class="ml-2 text-sm text-gray-700">Hide bot messages</span>
                </label>
                
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-gray-300 text-purple-600" />
                  <span class="ml-2 text-sm text-gray-700">Show timestamps</span>
                </label>
              </div>
            </div>
            
            <!-- Message Limits -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-700">Message Settings</h4>
              
              <div class="space-y-3">
                <div>
                  <label class="block text-sm text-gray-700 mb-1">Max messages displayed</label>
                  <select class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
                    <option>25</option>
                    <option selected>50</option>
                    <option>75</option>
                    <option>100</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-700 mb-1">Message fade time</label>
                  <select class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
                    <option>Never</option>
                    <option>30 seconds</option>
                    <option selected>60 seconds</option>
                    <option>2 minutes</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-700 mb-1">Font size</label>
                  <select class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
                    <option>Small</option>
                    <option selected>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Usage Instructions -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="text-lg font-medium text-blue-900 mb-4">How to use in OBS</h3>
          <div class="space-y-2 text-sm text-blue-800">
            <p><strong>1.</strong> Copy the browser source URL above</p>
            <p><strong>2.</strong> In OBS, add a "Browser Source"</p>
            <p><strong>3.</strong> Paste the URL and set dimensions to 400x600</p>
            <p><strong>4.</strong> Position the widget on your stream layout</p>
          </div>
          
          <div class="mt-4 p-3 bg-white border border-blue-200 rounded">
            <p class="text-xs text-gray-600 font-mono break-all">
              https://your-domain.com/widgets/chat/display
            </p>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end