defmodule StreampaiWeb.SettingsLive do
  @moduledoc """
  Settings LiveView for managing user account settings and platform connections.
  """
  use StreampaiWeb.BaseLive
  import StreampaiWeb.Components.SubscriptionWidget

  alias Streampai.Dashboard
  alias Streampai.Accounts.StreamingAccountManager
  alias Streampai.Accounts.NameValidator

  def mount_page(socket, _params, _session) do
    user_data = Dashboard.get_dashboard_data(socket.assigns.current_user)
    platform_connections = Dashboard.get_platform_connections(socket.assigns.current_user)

    {:ok,
     socket
     |> assign(:current_plan, "free")
     |> assign(:usage, user_data.usage)
     |> assign(:platform_connections, platform_connections)
     |> assign(
       :name_form,
       AshPhoenix.Form.for_update(socket.assigns.current_user, :update_name) |> to_form()
     )
     |> assign(:name_error, nil)
     |> assign(:name_success, nil)
     |> assign(:name_available, nil), layout: false}
  end

  def handle_event("upgrade_to_pro", _params, socket) do
    # TODO: Integrate with payment processor
    updated_usage =
      Map.merge(socket.assigns.usage, %{
        hours_limit: :unlimited,
        platforms_limit: :unlimited
      })

    {:noreply,
     socket
     |> assign(:current_plan, "pro")
     |> assign(:usage, updated_usage)
     |> put_flash(:info, "Successfully upgraded to Pro plan!")}
  end

  def handle_event("downgrade_to_free", _params, socket) do
    # TODO: Integrate with payment processor
    {:noreply,
     socket
     |> assign(:current_plan, "free")
     |> put_flash(:info, "Successfully downgraded to Free plan!")}
  end

  def handle_event("validate_name", %{"form" => form_params}, socket) do
    form =
      AshPhoenix.Form.validate(socket.assigns.name_form, form_params, errors: true) |> to_form()

    # Reset availability when input changes
    socket =
      socket
      |> assign(:name_form, form)
      |> assign(:name_available, nil)
      |> assign(:name_success, nil)

    {:noreply, socket}
  end

  def handle_event("check_name_availability", %{"name" => name}, socket) do
    current_user = socket.assigns.current_user

    case NameValidator.validate_availability(name, current_user) do
      {:ok, :available, message} ->
        socket = assign(socket, :name_available, true)
        {:reply, %{available: true, message: message}, socket}

      {:ok, :current_name, message} ->
        socket = assign(socket, :name_available, true)
        {:reply, %{available: true, message: message}, socket}

      {:error, _reason, message} ->
        socket = assign(socket, :name_available, false)
        {:reply, %{available: false, message: message}, socket}
    end
  end

  def handle_event("update_name", %{"form" => form_params}, socket) do
    # Don't submit if name is not available
    if socket.assigns.name_available == false do
      {:noreply,
       socket
       |> assign(:name_error, "Cannot update to an invalid or taken name")
       |> assign(:name_success, nil)}
    else
      case AshPhoenix.Form.submit(socket.assigns.name_form, params: form_params) do
        {:ok, user} ->
          {:noreply,
           socket
           |> assign(:current_user, user)
           |> assign(:name_form, AshPhoenix.Form.for_update(user, :update_name) |> to_form())
           |> assign(:name_error, nil)
           |> assign(:name_success, "Name updated successfully!")
           |> assign(:name_available, nil)
           |> put_flash(:info, "Name updated successfully!")}

        {:error, form} ->
          {:noreply,
           socket
           |> assign(:name_form, form |> to_form())
           |> assign(:name_error, "Failed to update name")
           |> assign(:name_success, nil)}
      end
    end
  end

  def handle_event("disconnect_platform", %{"platform" => platform_str}, socket) do
    platform = String.to_existing_atom(platform_str)
    user = socket.assigns.current_user

    case StreamingAccountManager.disconnect_account(user, platform) do
      :ok ->
        # Refresh platform connections after successful disconnect
        platform_connections = StreamingAccountManager.refresh_platform_connections(user)

        socket =
          socket
          |> assign(:platform_connections, platform_connections)
          |> put_flash(
            :info,
            "Successfully disconnected #{String.capitalize(platform_str)} account"
          )

        {:noreply, socket}

      {:error, reason} ->
        socket =
          socket
          |> put_flash(:error, "Failed to disconnect account: #{inspect(reason)}")

        {:noreply, socket}
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="settings" page_title="Settings">
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Subscription Widget -->
        <.subscription_widget
          current_plan={@current_plan}
          usage={@usage}
          platform_connections={@platform_connections}
        />
        
    <!-- Account Settings -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Account Settings</h3>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={if @current_user && @current_user.email, do: @current_user.email, else: ""}
                class="w-full border border-gray-300 rounded-lg px-3 py-2"
                readonly
              />
              <p class="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
            </div>
            <div>
              <.form for={@name_form} phx-change="validate_name" phx-submit="update_name">
                <label class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <div class="relative">
                  <.input
                    field={@name_form[:name]}
                    type="text"
                    placeholder="Enter display name"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    phx-hook="NameAvailabilityChecker"
                    id="name-input"
                  />
                  <div
                    id="availability-status"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                  </div>
                </div>
                <div id="availability-message" class="text-xs mt-1 h-4"></div>
                <p id="validation-help" class="text-xs text-gray-500 mt-1 hidden">
                  {NameValidator.validation_help_text()}
                </p>
                <%= if @name_success do %>
                  <p class="text-xs text-green-600 mt-1">{@name_success}</p>
                <% end %>
                <%= if @name_error do %>
                  <p class="text-xs text-red-600 mt-1">{@name_error}</p>
                <% end %>
                <div class="mt-3">
                  <button
                    type="submit"
                    disabled={@name_available == false}
                    class={
                      if @name_available == false do
                        "bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed text-sm"
                      else
                        "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      end
                    }
                  >
                    Update Name
                  </button>
                </div>
              </.form>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Streaming Platforms</label>
              <div class="space-y-2">
                <%= for connection <- @platform_connections do %>
                  <.platform_connection
                    name={connection.name}
                    platform={connection.platform}
                    connected={connection.connected}
                    connect_url={connection.connect_url}
                    color={connection.color}
                    show_disconnect={true}
                  />
                <% end %>
              </div>
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
                <span class="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                </span>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900">Stream Alerts</h4>
                <p class="text-sm text-gray-500">Get alerts when your stream goes live</p>
              </div>
              <button class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 bg-gray-200">
                <span class="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
