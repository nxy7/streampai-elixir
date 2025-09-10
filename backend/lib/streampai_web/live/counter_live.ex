defmodule StreampaiWeb.CounterLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0, step: 1, color: "blue")}
  end

  def handle_event("increment", _params, socket) do
    {:noreply, assign(socket, count: socket.assigns.count + socket.assigns.step)}
  end

  def handle_event("decrement", _params, socket) do
    {:noreply, assign(socket, count: socket.assigns.count - socket.assigns.step)}
  end

  def handle_event("change_step", %{"step" => step}, socket) do
    step = String.to_integer(step)
    {:noreply, assign(socket, step: step)}
  end

  def handle_event("change_color", %{"color" => color}, socket) do
    {:noreply, assign(socket, color: color)}
  end

  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-100 py-8">
      <div class="max-w-4xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-center mb-8">Counter Demo</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-4">Counter</h3>
            <div class={"text-6xl font-bold text-center mb-6 text-#{@color}-600"}>
              {@count}
            </div>
            <div class="flex justify-center space-x-4">
              <button
                phx-click="increment"
                class={"px-6 py-2 bg-#{@color}-600 text-white rounded hover:bg-#{@color}-700"}
              >
                +{@step}
              </button>
              <button
                phx-click="decrement"
                class="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                -{@step}
              </button>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-4">Controls</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Step Size: {@step}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={@step}
                  phx-change="change_step"
                  name="step"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <select
                  phx-change="change_color"
                  name="color"
                  class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="blue" selected={@color == "blue"}>Blue</option>
                  <option value="red" selected={@color == "red"}>Red</option>
                  <option value="green" selected={@color == "green"}>Green</option>
                  <option value="purple" selected={@color == "purple"}>Purple</option>
                  <option value="orange" selected={@color == "orange"}>Orange</option>
                </select>
              </div>

              <div>
                <h4 class="text-lg font-medium text-gray-700 mb-2">Current State</h4>
                <div class="bg-gray-50 p-3 rounded">
                  <p><strong>Count:</strong> {@count}</p>
                  <p><strong>Step:</strong> {@step}</p>
                  <p><strong>Color:</strong> {@color}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center text-gray-600">
          <p>
            This counter widget is built with Svelte and embedded in a Phoenix LiveView using the ~H sigil!
          </p>
          <p class="mt-2">
            Click the buttons in the counter to see real-time updates between Svelte and LiveView.
          </p>
        </div>
      </div>
    </div>
    """
  end
end
