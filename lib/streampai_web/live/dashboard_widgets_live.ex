defmodule StreampaiWeb.DashboardWidgetsLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  @widget_categories [
    %{
      title: "Chat Widgets",
      icon_color: "text-blue-500",
      icon_path:
        "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      widgets: [
        %{
          route: "/dashboard/widgets/chat",
          title: "Live Chat Overlay",
          description: "Display live chat on stream"
        },
        %{
          route: "/dashboard/widgets/poll",
          title: "Poll Widget",
          description: "Display live poll results in real-time"
        }
      ]
    },
    %{
      title: "Alerts & Donations",
      icon_color: "text-green-500",
      icon_path:
        "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
      widgets: [
        %{
          route: "/dashboard/widgets/alertbox",
          title: "Alertbox Widget",
          description: "Show donation, follow & subscription alerts"
        },
        %{
          route: "/dashboard/widgets/donation-goal",
          title: "Donation Goal",
          description: "Track donation progress"
        },
        %{
          route: "/dashboard/widgets/top-donors",
          title: "Top Donors",
          description: "Display biggest supporters with rankings"
        },
        %{
          route: "/dashboard/widgets/giveaway",
          title: "Giveaway Widget",
          description: "Run giveaways and show participation status"
        },
        %{
          route: "/dashboard/widgets/eventlist",
          title: "Event List",
          description: "Display recent donations, follows, subs & raids"
        }
      ]
    },
    %{
      title: "Stream Stats",
      icon_color: "text-purple-500",
      icon_path:
        "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      widgets: [
        %{
          route: "/dashboard/widgets/viewer-count",
          title: "Viewer Count Widget",
          description: "Display real-time viewer counts per platform"
        },
        %{
          route: "/dashboard/widgets/follower-count",
          title: "Follower Count Widget",
          description: "Display real-time follower counts per platform"
        },
        %{
          route: "/dashboard/widgets/timer",
          title: "Timer Widget",
          description: "Countdown/countup timer with event extensions"
        },
        %{
          route: "/dashboard/widgets/slider",
          title: "Image Slider Widget",
          description: "Slideshow of uploaded images with transitions"
        }
      ]
    }
  ]

  def mount_page(socket, _params, _session) do
    {:ok, assign(socket, :page_title, "Widgets"), layout: false}
  end

  defp widget_categories, do: @widget_categories

  def render(assigns) do
    ~H"""
    <.dashboard_layout
      {assigns}
      current_page="widgets"
      page_title="Widgets"
      show_action_button={true}
      action_button_text="Add Widget"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Widget Categories -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            :for={category <- widget_categories()}
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">{category.title}</h3>
              <svg
                class={"w-5 h-5 #{category.icon_color}"}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={category.icon_path}
                />
              </svg>
            </div>
            <div class="space-y-3">
              <.link
                :for={widget <- category.widgets}
                navigate={widget.route}
                class="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <h4 class="font-medium text-sm">{widget.title}</h4>
                <p class="text-xs text-gray-500">{widget.description}</p>
              </.link>
            </div>
          </div>
        </div>
        
    <!-- Active Widgets -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Active Widgets</h3>
          </div>
          <div class="p-6">
            <div class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M19 11H5a2 2 0 00-2 2v14a2 2 0 002 2h14m-6 4h18a2 2 0 002-2V13a2 2 0 00-2-2H23a2 2 0 00-2 2v18z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No widgets configured</h3>
              <p class="mt-1 text-sm text-gray-500">
                Get started by adding widgets from the categories above.
              </p>
              <div class="mt-6">
                <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Browse Widget Library
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
