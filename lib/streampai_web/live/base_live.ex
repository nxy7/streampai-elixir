defmodule StreampaiWeb.BaseLive do
  @moduledoc """
  Base LiveView module providing common patterns and behaviors.

  This module provides:
  - Common mount patterns for dashboard pages
  - Error handling and flash message management
  - Platform disconnect handling
  - Standard assigns and defaults

  Usage:
    use StreampaiWeb.BaseLive

  Then implement mount_page/3 in your LiveView:
    def mount_page(socket, _params, _session) do
      {:ok, socket |> assign(:page_title, "My Page"), layout: false}
    end
  """

  defmacro __using__(opts \\ []) do
    quote do
      use StreampaiWeb, :live_view

      import StreampaiWeb.Components.DashboardComponents
      import StreampaiWeb.Components.DashboardLayout
      import StreampaiWeb.LiveHelpers

      @impl true
      def mount(params, session, socket) do
        socket =
          socket
          |> assign_defaults()
          |> maybe_load_current_user(session)
          |> maybe_assign_page_specific(params, session)

        mount_page(socket, params, session)
      end

      # Override this in your LiveView - this is the main entry point
      def mount_page(socket, _params, _session) do
        {:ok, socket, layout: false}
      end

      # Common event handlers

      # Handle platform disconnection (used across multiple dashboard pages)
      @impl true
      def handle_event("disconnect_platform", %{"platform" => platform_str}, socket) do
        handle_platform_disconnect(socket, platform_str)
      end

      # Handle generic form validation
      def handle_event("validate_form", params, socket) do
        handle_form_validation(socket, params)
      end

      # Common info handlers

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

      # Catch-all for orphaned events (useful for debugging)
      def handle_event(_event, _params, socket) do
        {:noreply, socket}
      end

      @impl true
      def handle_info(_msg, socket) do
        {:noreply, socket}
      end

      # Private helper functions

      defp assign_defaults(socket) do
        socket
        |> assign_new(:loading, fn -> false end)
        |> assign_new(:errors, fn -> [] end)
        |> assign_new(:success_message, fn -> nil end)
        |> assign_new(:disconnecting_platform, fn -> nil end)
      end

      defp maybe_load_current_user(socket, session) do
        # If current_user is already assigned (by AshAuthentication), don't reload
        if Map.has_key?(socket.assigns, :current_user) do
          socket
        else
          # Try to load user from session
          case Map.get(session, "user") do
            nil ->
              socket

            user_token when is_binary(user_token) ->
              case load_user_from_token(user_token) do
                {:ok, user} -> assign(socket, :current_user, user)
                _ -> socket
              end

            _ ->
              socket
          end
        end
      end

      defp load_user_from_token(token) do
        # Parse the token format: "otp_app:resource?id=uuid"
        case String.split(token, "?") do
          [_resource_part, params_part] ->
            params = URI.decode_query(params_part)

            case Map.get(params, "id") do
              nil ->
                {:error, :no_id}

              user_id ->
                import Ash.Query

                alias Streampai.Accounts.User

                case User
                     |> for_read(:get_by_id_minimal, %{id: user_id}, authorize?: false)
                     |> Ash.read() do
                  {:ok, [user]} -> {:ok, user}
                  {:ok, []} -> {:error, :user_not_found}
                  {:error, reason} -> {:error, reason}
                end
            end

          _ ->
            {:error, :invalid_token_format}
        end
      end

      defp maybe_assign_page_specific(socket, _params, _session) do
        socket
      end

      # Helper for form validation (can be overridden)
      defp handle_form_validation(socket, _params) do
        {:noreply, socket}
      end

      # Make functions overridable
      defoverridable mount: 3,
                     mount_page: 3,
                     maybe_assign_page_specific: 3,
                     handle_event: 3,
                     handle_info: 2,
                     handle_form_validation: 2

      unquote(opts[:additional_imports] || [])
    end
  end
end
