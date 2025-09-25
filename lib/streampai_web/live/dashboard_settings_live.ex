defmodule StreampaiWeb.DashboardSettingsLive do
  @moduledoc """
  Settings LiveView for managing user account settings and platform connections.
  """
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Components.SubscriptionWidget
  import StreampaiWeb.Live.Helpers.NotificationPreferences
  import StreampaiWeb.Live.Helpers.RoleManagementHelpers
  import StreampaiWeb.LiveHelpers.FlashHelpers

  alias Streampai.Accounts.NameValidator
  alias Streampai.Accounts.UserPreferences
  alias Streampai.Accounts.UserRoleHelpers
  alias Streampai.Billing
  alias Streampai.Dashboard
  alias StreampaiWeb.Components.AvatarUploadComponent
  alias StreampaiWeb.LiveHelpers.FormHelpers
  alias StreampaiWeb.LiveHelpers.UserHelpers

  def mount_page(socket, _params, _session) do
    current_user = socket.assigns.current_user
    user_data = Dashboard.get_dashboard_data(current_user)
    platform_connections = Dashboard.get_platform_connections(current_user)

    current_plan = UserHelpers.get_current_plan(current_user)

    {:ok,
     socket
     |> assign(:current_plan, current_plan)
     |> assign(:usage, user_data.usage)
     |> assign(:platform_connections, platform_connections)
     |> load_user_preferences()
     |> load_role_data(current_user)
     |> assign(
       :name_form,
       socket.assigns.current_user |> AshPhoenix.Form.for_update(:update_name) |> to_form()
     )
     |> assign(:name_error, nil)
     |> assign(:name_success, nil)
     |> assign(:name_available, nil)
     |> assign(:invite_username, "")
     |> assign(:invite_error, nil)
     |> assign(:invite_success, nil)
     |> assign(:page_title, "Settings"), layout: false}
  end

  def handle_event("upgrade_to_pro", _params, socket) do
    current_user = socket.assigns.current_user

    case Billing.create_checkout_session(current_user) do
      {:ok, session} ->
        {:noreply, redirect(socket, external: session.url)}

      {:error, reason} ->
        {:noreply, flash_error(socket, "Failed to start upgrade process: #{reason}")}
    end
  end

  def handle_event("downgrade_to_free", _params, socket) do
    {:noreply,
     socket
     |> assign(:current_plan, "free")
     |> flash_success("Successfully downgraded to Free plan!")}
  end

  def handle_event("validate_name", %{"form" => form_params}, socket) do
    form =
      socket.assigns.name_form |> AshPhoenix.Form.validate(form_params, errors: true) |> to_form()

    socket =
      socket
      |> assign(:name_form, form)
      |> assign(:name_available, nil)

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
    socket = socket |> assign(:name_error, nil) |> assign(:name_success, nil)
    actor = socket.assigns.current_user

    if socket.assigns.name_available == false do
      {:noreply, assign(socket, :name_error, "Cannot update to an invalid or taken name")}
    else
      case AshPhoenix.Form.submit(socket.assigns.name_form,
             params: form_params,
             action_opts: [actor: actor]
           ) do
        {:ok, user} ->
          {:noreply,
           socket
           |> assign(
             :name_form,
             user
             |> AshPhoenix.Form.for_update(:update_name, actor: actor)
             |> to_form()
           )
           |> assign(:name_success, "Name updated successfully!")
           |> assign(:name_available, nil)
           |> flash_success("Name updated successfully!")}

        {:error, form} ->
          {:noreply,
           socket
           |> assign(:name_form, to_form(form))
           |> assign(:name_error, "Failed to update name")}
      end
    end
  end

  def handle_event("toggle_email_notifications", _params, socket) do
    handle_notification_toggle(socket)
  end

  def handle_event("accept_role", %{"role_id" => role_id}, socket) do
    handle_role_action(
      socket,
      role_id,
      &find_pending_invitation/2,
      &UserRoleHelpers.accept_role_invitation/2,
      "Role accepted successfully!",
      "Role invitation not found",
      "Failed to accept role"
    )
  end

  def handle_event("decline_role", %{"role_id" => role_id}, socket) do
    handle_role_action(
      socket,
      role_id,
      &find_pending_invitation/2,
      &UserRoleHelpers.decline_role_invitation/2,
      "Role invitation declined",
      "Role invitation not found",
      "Failed to decline role"
    )
  end

  def handle_event("revoke_role", %{"role_id" => role_id}, socket) do
    handle_role_action(
      socket,
      role_id,
      &find_granted_role/2,
      &UserRoleHelpers.revoke_role/2,
      "Role revoked successfully",
      "Role not found",
      "Failed to revoke role"
    )
  end

  def handle_event("revoke_invitation", %{"role_id" => role_id}, socket) do
    handle_role_action(
      socket,
      role_id,
      &find_sent_invitation/2,
      &UserRoleHelpers.revoke_role/2,
      "Invitation revoked successfully",
      "Invitation not found",
      "Failed to revoke invitation"
    )
  end

  def handle_event("invite_user", %{"username" => username, "role_type" => role_type}, socket) do
    current_user = socket.assigns.current_user
    handle_invitation_request(socket, username, role_type, current_user)
  end

  # Handle avatar upload events delegated from the JavaScript hook
  def handle_event("validate_avatar", params, socket) do
    # Try to send the event to the component manually
    send_update(AvatarUploadComponent,
      id: "avatar-upload",
      action: :validate_avatar,
      params: params
    )

    {:noreply, socket}
  end

  def handle_event("drag_over", _params, socket), do: {:noreply, socket}
  def handle_event("drag_leave", _params, socket), do: {:noreply, socket}
  def handle_event("file_error", _params, socket), do: {:noreply, socket}

  def handle_event("update_donation_preferences", %{"preferences" => params}, socket) do
    current_user = socket.assigns.current_user

    min_amount = parse_amount(params["min_donation_amount"])
    max_amount = parse_amount(params["max_donation_amount"])
    currency = params["donation_currency"] || "USD"

    preferences_params = %{
      user_id: current_user.id,
      min_donation_amount: min_amount,
      max_donation_amount: max_amount,
      donation_currency: currency
    }

    case UserPreferences.create(preferences_params, actor: current_user) do
      {:ok, _preferences} ->
        {:noreply,
         socket
         |> load_user_preferences()
         |> flash_success("Donation preferences updated successfully!")}

      {:error, _changeset} ->
        {:noreply,
         flash_error(
           socket,
           "Failed to update donation preferences. Please check your values."
         )}
    end
  end

  def handle_info({:avatar_uploaded, _avatar_url}, socket) do
    current_user = socket.assigns.current_user

    # Reload the user to get the updated avatar
    updated_user = Ash.reload!(current_user, actor: current_user)

    {:noreply,
     socket
     |> assign(:current_user, updated_user)
     |> flash_success("Avatar updated successfully!")}
  end

  # Catch-all for other messages like presence_diff
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  defp parse_amount(amount), do: FormHelpers.parse_numeric_setting(amount, min: 1)

  defp role_icon_component(assigns) do
    icon_name =
      if assigns.role_type == :moderator, do: "hero-shield-check", else: "hero-cog-6-tooth"

    assigns = assign(assigns, :icon_name, icon_name)

    ~H"""
    <div class={"w-10 h-10 #{@bg_color} rounded-full flex items-center justify-center"}>
      <StreampaiWeb.CoreComponents.icon name={@icon_name} class={"w-5 h-5 #{@icon_color}"} />
    </div>
    """
  end

  defp role_invitation_card(assigns) do
    ~H"""
    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div class="flex items-center space-x-3">
        <.role_icon_component
          role_type={@invitation.role_type}
          bg_color="bg-purple-100"
          icon_color="text-purple-600"
        />
        <div>
          <p class="font-medium text-gray-900">
            {String.capitalize(to_string(@invitation.role_type))} Role from {if @invitation.granter,
              do: @invitation.granter.name,
              else: "Unknown"}
          </p>
          <p class="text-sm text-gray-600">
            Invited on {Calendar.strftime(@invitation.granted_at, "%B %d, %Y")}
          </p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button
          phx-click="accept_role"
          phx-value-role_id={@invitation.id}
          class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
        >
          Accept
        </button>
        <button
          phx-click="decline_role"
          phx-value-role_id={@invitation.id}
          class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
    """
  end

  defp active_role_card(assigns) do
    ~H"""
    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div class="flex items-center space-x-3">
        <.role_icon_component
          role_type={@role.role_type}
          bg_color="bg-green-100"
          icon_color="text-green-600"
        />
        <div>
          <p class="font-medium text-gray-900">
            {String.capitalize(to_string(@role.role_type))} for {if @role.granter,
              do: @role.granter.name,
              else: "Unknown"}
          </p>
          <p class="text-sm text-gray-600">
            Active since {Calendar.strftime(@role.accepted_at, "%B %d, %Y")}
          </p>
        </div>
      </div>
      <div>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      </div>
    </div>
    """
  end

  defp granted_role_card(assigns) do
    ~H"""
    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div class="flex items-center space-x-3">
        <.role_icon_component
          role_type={@role.role_type}
          bg_color="bg-purple-100"
          icon_color="text-purple-600"
        />
        <div>
          <p class="font-medium text-gray-900">
            {if @role.user, do: @role.user.name, else: "Unknown"} - {String.capitalize(
              to_string(@role.role_type)
            )}
          </p>
          <p class="text-sm text-gray-600">
            Active since {Calendar.strftime(@role.accepted_at, "%B %d, %Y")}
          </p>
        </div>
      </div>
      <div>
        <button
          phx-click="revoke_role"
          phx-value-role_id={@role.id}
          class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
          onclick="return confirm('Are you sure you want to revoke this role?')"
        >
          Revoke
        </button>
      </div>
    </div>
    """
  end

  defp pending_invitation_card(assigns) do
    ~H"""
    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-yellow-50">
      <div class="flex items-center space-x-3">
        <.role_icon_component
          role_type={@invitation.role_type}
          bg_color="bg-yellow-100"
          icon_color="text-yellow-600"
        />
        <div>
          <p class="font-medium text-gray-900">
            {if @invitation.user, do: @invitation.user.name, else: "Unknown"} - {String.capitalize(
              to_string(@invitation.role_type)
            )}
          </p>
          <p class="text-sm text-gray-600">
            Invited on {Calendar.strftime(@invitation.granted_at, "%B %d, %Y")}
          </p>
        </div>
      </div>
      <div>
        <button
          phx-click="revoke_invitation"
          phx-value-role_id={@invitation.id}
          class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
          onclick="return confirm('Are you sure you want to revoke this invitation?')"
        >
          Revoke
        </button>
      </div>
    </div>
    """
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
            
    <!-- Avatar Upload Section -->
            <div>
              <.live_component
                module={AvatarUploadComponent}
                id="avatar-upload"
                current_user={@current_user}
                user_name={@current_user.name}
              />
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
                    current_user={@current_user}
                    account_data={connection.account_data}
                    show_disconnect={true}
                  />
                <% end %>
              </div>
            </div>
          </div>
        </div>
        
    <!-- Donation Page Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Donation Page</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Public Donation URL</label>
              <div class="flex items-center space-x-3">
                <input
                  type="text"
                  value={url(~p"/u/#{@current_user.name}")}
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  readonly
                />
                <button
                  id="copy-donation-url-button"
                  class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  phx-hook="CopyToClipboard"
                  data-clipboard-text={url(~p"/u/#{@current_user.name}")}
                  data-clipboard-message="Donation page URL copied!"
                >
                  Copy URL
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Share this link with your viewers so they can support you with donations
              </p>
            </div>
            
    <!-- Quick Preview -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <%= if @current_user.display_avatar do %>
                    <img
                      src={@current_user.display_avatar}
                      alt="Avatar"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                  <% else %>
                    <span class="text-white font-bold">
                      {@current_user.name |> String.first() |> String.upcase()}
                    </span>
                  <% end %>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">Support {@current_user.name}</h4>
                  <p class="text-sm text-gray-600">Public donation page</p>
                </div>
              </div>
              <.link
                navigate={~p"/u/#{@current_user.name}"}
                target="_blank"
                class="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Preview →
              </.link>
            </div>
          </div>
        </div>
        
    <!-- Donation Preferences -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Donation Settings</h3>

          <form phx-submit="update_donation_preferences">
            <div class="space-y-4">
              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Amount
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 text-sm">{@user_preferences.donation_currency}</span>
                    </div>
                    <input
                      type="number"
                      name="preferences[min_donation_amount]"
                      value={@user_preferences.min_donation_amount}
                      min="1"
                      max="1000"
                      placeholder="No minimum"
                      class="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Amount
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 text-sm">{@user_preferences.donation_currency}</span>
                    </div>
                    <input
                      type="number"
                      name="preferences[max_donation_amount]"
                      value={@user_preferences.max_donation_amount}
                      min="1"
                      max="10000"
                      placeholder="No maximum"
                      class="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="preferences[donation_currency]"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <%= for currency <- ["USD", "EUR", "GBP", "CAD", "AUD"] do %>
                      <option
                        value={currency}
                        selected={@user_preferences.donation_currency == currency}
                      >
                        {currency}
                      </option>
                    <% end %>
                  </select>
                </div>
              </div>

              <div class="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <StreampaiWeb.CoreComponents.icon
                  name="hero-information-circle"
                  class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                />
                <div class="text-sm text-blue-800">
                  <p class="font-medium mb-1">How donation limits work:</p>
                  <ul class="space-y-1 text-blue-700">
                    <li>• Set limits to control the donation amounts your viewers can send</li>
                    <li>• Both fields are optional - leave empty to allow any amount</li>
                    <li>• Preset buttons and custom input will be filtered based on your limits</li>
                    <li>• Changes apply immediately to your donation page</li>
                  </ul>
                </div>
              </div>

              <div class="pt-4">
                <button
                  type="submit"
                  class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Save Donation Settings
                </button>
              </div>
            </div>
          </form>
        </div>
        
    <!-- Role Invitations Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Role Invitations</h3>
          <%= if Enum.empty?(@pending_invitations) do %>
            <div class="text-center py-8 text-gray-500">
              <StreampaiWeb.CoreComponents.icon
                name="hero-users"
                class="w-12 h-12 mx-auto mb-3 text-gray-400"
              />
              <p class="text-sm">No pending role invitations</p>
              <p class="text-xs text-gray-400 mt-1">
                You'll see invitations here when streamers invite you to moderate their channels
              </p>
            </div>
          <% else %>
            <div class="space-y-3">
              <%= for invitation <- @pending_invitations do %>
                <.role_invitation_card invitation={invitation} />
              <% end %>
            </div>
          <% end %>
        </div>
        
    <!-- My Roles in Other Channels -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">My Roles in Other Channels</h3>
          <%= if Enum.empty?(@user_roles) do %>
            <div class="text-center py-8 text-gray-500">
              <StreampaiWeb.CoreComponents.icon
                name="hero-identification"
                class="w-12 h-12 mx-auto mb-3 text-gray-400"
              />
              <p class="text-sm">You don't have any roles in other channels</p>
              <p class="text-xs text-gray-400 mt-1">
                Roles granted to you by other streamers will appear here
              </p>
            </div>
          <% else %>
            <div class="space-y-3">
              <%= for role <- @user_roles do %>
                <.active_role_card role={role} />
              <% end %>
            </div>
          <% end %>
        </div>
        
    <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">Channel Management</span>
          </div>
        </div>
        
    <!-- Role Management Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-6">Role Management</h3>
          
    <!-- Invite User Form -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-3">Invite User</h4>
            <form phx-submit="invite_user" class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    name="username"
                    value={@invite_username}
                    placeholder="Enter username"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <select
                    name="role_type"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="moderator">Moderator</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
              <%= if @invite_success do %>
                <p class="text-sm text-green-600">{@invite_success}</p>
              <% end %>
              <%= if @invite_error do %>
                <p class="text-sm text-red-600">{@invite_error}</p>
              <% end %>
            </form>
            <div class="mt-3 p-3 bg-blue-50 rounded-lg">
              <div class="flex">
                <StreampaiWeb.CoreComponents.icon
                  name="hero-information-circle"
                  class="w-5 h-5 text-blue-500 flex-shrink-0 mr-2"
                />
                <div class="text-sm text-blue-800">
                  <p class="font-medium">Role Permissions:</p>
                  <ul class="mt-1 text-blue-700 text-xs space-y-1">
                    <li>
                      • <strong>Moderator:</strong> Can moderate chat and manage stream settings
                    </li>
                    <li>
                      • <strong>Manager:</strong> Can manage channel operations and configurations
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
    <!-- Current Roles -->
          <%= if Enum.empty?(@granted_roles) do %>
            <div class="text-center py-8 text-gray-500">
              <StreampaiWeb.CoreComponents.icon
                name="hero-user-group"
                class="w-12 h-12 mx-auto mb-3 text-gray-400"
              />
              <p class="text-sm">No roles granted yet</p>
              <p class="text-xs text-gray-400 mt-1">
                Users you've granted permissions to will appear here
              </p>
            </div>
          <% else %>
            <div class="space-y-6">
              <!-- Active Roles -->
              <div>
                <h4 class="font-medium text-gray-900 mb-3">Active Roles</h4>
                <div class="space-y-3">
                  <%= for role <- @granted_roles do %>
                    <.granted_role_card role={role} />
                  <% end %>
                </div>
              </div>
              
    <!-- Pending Sent Invitations -->
              <%= if length(Enum.filter(@sent_invitations, &(&1.role_status == :pending))) > 0 do %>
                <div>
                  <h4 class="font-medium text-gray-900 mb-3">Pending Invitations</h4>
                  <div class="space-y-3">
                    <%= for invitation <- Enum.filter(@sent_invitations, &(&1.role_status == :pending)) do %>
                      <.pending_invitation_card invitation={invitation} />
                    <% end %>
                  </div>
                </div>
              <% end %>
            </div>
          <% end %>
        </div>

        {render_notification_preferences(assigns)}
      </div>
    </.dashboard_layout>
    """
  end
end
