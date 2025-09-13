defmodule StreampaiWeb.WidgetBehaviour do
  @moduledoc """
  Shared behavior module for all widget LiveViews.

  This module provides common patterns for widget settings and OBS display LiveViews:

  ## For Widget Settings LiveViews:
  - Configuration loading and saving
  - Form handling and validation  
  - PubSub broadcasting for real-time preview updates
  - Fake data generation for preview

  ## For OBS Display LiveViews:
  - Configuration subscription via PubSub
  - Transparent background setup
  - Real event handling

  ## Usage:

      use StreampaiWeb.WidgetBehaviour, 
        type: :settings,
        widget_type: :chat_widget,
        fake_module: Streampai.Fake.Chat

      use StreampaiWeb.WidgetBehaviour,
        type: :display, 
        widget_type: :alertbox_widget
  """

  defmacro __using__(opts \\ []) do
    behaviour_type = Keyword.fetch!(opts, :type)
    widget_type = Keyword.fetch!(opts, :widget_type)
    fake_module = Keyword.get(opts, :fake_module)

    case behaviour_type do
      :settings ->
        quote do
          use StreampaiWeb.BaseLive

          alias Streampai.Accounts.WidgetConfig

          @widget_type unquote(widget_type)
          @fake_module unquote(fake_module)

          # Common mount pattern for widget settings
          def mount_page(socket, _params, _session) do
            current_user = socket.assigns.current_user

            if connected?(socket) and @fake_module do
              schedule_demo_event()
            end

            {:ok, %{config: initial_config}} =
              WidgetConfig.get_by_user_and_type(
                %{
                  user_id: current_user.id,
                  type: @widget_type
                },
                actor: current_user
              )

            socket =
              socket
              |> assign(:widget_config, initial_config)
              |> assign(:page_title, widget_title())
              |> initialize_widget_specific_assigns()

            {:ok, socket, layout: false}
          end

          # Common event handlers for widget settings

          def handle_event("update_settings", params, socket) do
            current_config = socket.assigns.widget_config
            updated_config = update_widget_settings(current_config, params)

            save_and_broadcast_config(socket, updated_config)
            {:noreply, assign(socket, :widget_config, updated_config)}
          end

          def handle_info(:generate_demo_event, socket) do
            if @fake_module do
              socket = generate_and_assign_demo_data(socket)
              schedule_demo_event()
              {:noreply, socket}
            else
              {:noreply, socket}
            end
          end

          # Helper functions to be overridden by implementing modules

          defp widget_title, do: "Widget Settings"
          defp initialize_widget_specific_assigns(socket), do: socket
          defp update_widget_settings(config, params), do: config
          defp generate_and_assign_demo_data(socket), do: socket
          defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 7000)

          defp save_and_broadcast_config(socket, config) do
            current_user = socket.assigns.current_user

            Phoenix.PubSub.broadcast(
              Streampai.PubSub,
              # credo:disable-for-next-line Credo.Check.Design.AliasUsage
              StreampaiWeb.Utils.WidgetHelpers.widget_config_topic(@widget_type, current_user.id),
              %{config: config, type: @widget_type}
            )

            WidgetConfig.create(
              %{
                user_id: current_user.id,
                type: @widget_type,
                config: config
              },
              actor: current_user
            )
          end

          defoverridable widget_title: 0,
                         initialize_widget_specific_assigns: 1,
                         update_widget_settings: 2,
                         generate_and_assign_demo_data: 1,
                         schedule_demo_event: 0
        end

      :display ->
        quote do
          use StreampaiWeb, :live_view

          @widget_type unquote(widget_type)

          def mount(%{"user_id" => user_id}, _session, socket) do
            if connected?(socket) do
              Phoenix.PubSub.subscribe(
                Streampai.PubSub,
                # credo:disable-for-next-line Credo.Check.Design.AliasUsage
                StreampaiWeb.Utils.WidgetHelpers.widget_config_topic(@widget_type, user_id)
              )

              subscribe_to_real_events(user_id)
            end

            # credo:disable-for-next-line Credo.Check.Design.AliasUsage
            {:ok, %{config: config}} =
              Streampai.Accounts.WidgetConfig.get_by_user_and_type(
                %{
                  user_id: user_id,
                  type: @widget_type
                },
                authorize?: false
              )

            socket =
              socket
              |> assign(:user_id, user_id)
              |> assign(:widget_config, config)
              |> initialize_display_assigns()

            {:ok, socket, layout: {StreampaiWeb.Layouts, :widget}}
          end

          # Handle config updates from PubSub
          def handle_info(%{config: new_config, type: type}, socket) when type == @widget_type do
            {:noreply, assign(socket, :widget_config, new_config)}
          end

          # Ignore other widget types
          def handle_info(%{config: _config, type: _other_type}, socket) do
            {:noreply, socket}
          end

          # Real event handler to be overridden
          def handle_info({:widget_event, event_data}, socket) do
            handle_real_event(socket, event_data)
          end

          # Handle demo message generation for chat widgets
          def handle_info(:generate_demo_message, socket) do
            handle_demo_message_generation(socket)
          end

          def handle_info(_msg, socket) do
            {:noreply, socket}
          end

          # Functions to be overridden by implementing modules
          defp initialize_display_assigns(socket), do: socket
          defp subscribe_to_real_events(_user_id), do: :ok
          defp handle_real_event(socket, _event_data), do: {:noreply, socket}
          defp handle_demo_message_generation(socket), do: {:noreply, socket}

          defoverridable initialize_display_assigns: 1,
                         subscribe_to_real_events: 1,
                         handle_real_event: 2,
                         handle_demo_message_generation: 1,
                         handle_info: 2
        end
    end
  end
end
