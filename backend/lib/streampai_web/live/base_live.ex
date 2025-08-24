defmodule StreampaiWeb.BaseLive do
  @moduledoc """
  Base LiveView module providing common patterns and behaviors.
  
  This module should be used instead of `use StreampaiWeb, :live_view` for
  dashboard pages to ensure consistent patterns and error handling.
  """
  
  defmacro __using__(opts \\ []) do
    quote do
      use StreampaiWeb, :live_view
      import StreampaiWeb.Components.DashboardLayout
      import StreampaiWeb.Components.DashboardComponents
      import StreampaiWeb.LiveHelpers
      
      # Common assigns that all dashboard pages might need
      @impl true
      def mount(params, session, socket) do
        socket = 
          socket
          |> assign_defaults()
          |> maybe_assign_page_specific(params, session)
        
        mount_page(socket, params, session)
      end
      
      # Override this in your LiveView
      def mount_page(socket, _params, _session) do
        {:ok, socket, layout: false}
      end
      
      # Common error handling
      @impl true
      def handle_info({:error, reason}, socket) do
        {:noreply, handle_error(socket, reason)}
      end
      
      def handle_info({:success, message}, socket) do
        {:noreply, show_success(socket, message)}
      end
      
      # Handle presence updates (for global presence tracking)
      def handle_info(%Phoenix.Socket.Broadcast{topic: "users_presence", event: "presence_diff"}, socket) do
        {:noreply, socket}
      end
      
      # Default assigns
      defp assign_defaults(socket) do
        socket
        |> assign_new(:loading, fn -> false end)
        |> assign_new(:errors, fn -> [] end)
      end
      
      defp maybe_assign_page_specific(socket, _params, _session) do
        # Override in child modules if needed
        socket
      end
      
      # Make it overridable
      defoverridable mount: 3, mount_page: 3, maybe_assign_page_specific: 3
      
      unquote(opts[:additional_imports] || [])
    end
  end
end