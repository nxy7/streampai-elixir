defmodule StreampaiWeb.SvelteTestLive do
  use StreampaiWeb, :live_view
  import LiveSvelte

  def mount(_params, _session, socket) do
    {:ok, assign(socket, message: "LiveSvelte is working!")}
  end

  def render(assigns) do
    ~H"""
    <div class="p-8">
      <h1 class="text-2xl mb-4">LiveSvelte Test Page</h1>
      <p class="mb-4">This should work if LiveSvelte is properly configured.</p>

      <.svelte name="SimpleTest" props={%{message: @message}} />

      <div class="mt-4 p-4 bg-gray-100">
        <p>If you see the blue box above, LiveSvelte is working!</p>
      </div>
    </div>
    """
  end
end
