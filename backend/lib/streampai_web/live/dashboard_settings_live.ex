defmodule StreampaiWeb.DashboardSettingsLive do
  @moduledoc """
  Settings LiveView for managing user account settings and platform connections.
  """
  use StreampaiWeb.BaseLive

  import StreampaiWeb.Components.SubscriptionWidget
  import StreampaiWeb.Live.Helpers.NotificationPreferences

  alias Streampai.Accounts.NameValidator
  alias Streampai.Accounts.UserPreferences
  alias Streampai.Billing
  alias Streampai.Dashboard

  def mount_page(socket, _params, _session) do
    current_user = socket.assigns.current_user
    user_data = Dashboard.get_dashboard_data(current_user)
    platform_connections = Dashboard.get_platform_connections(current_user)

    # Get current plan from user tier
    current_plan =
      case Map.get(current_user, :tier) do
        :pro -> "pro"
        _ -> "free"
      end

    # Load notification preferences using the shared module

    {:ok,
     socket
     |> assign(:current_plan, current_plan)
     |> assign(:usage, user_data.usage)
     |> assign(:platform_connections, platform_connections)
     |> load_user_preferences()
     |> assign(
       :name_form,
       socket.assigns.current_user |> AshPhoenix.Form.for_update(:update_name) |> to_form()
     )
     |> assign(:name_error, nil)
     |> assign(:name_success, nil)
     |> assign(:name_available, nil)
     |> assign(:page_title, "Settings"), layout: false}
  end

  def handle_event("upgrade_to_pro", _params, socket) do
    current_user = socket.assigns.current_user

    case Billing.create_checkout_session(current_user) do
      {:ok, session} ->
        {:noreply, redirect(socket, external: session.url)}

      {:error, reason} ->
        {:noreply, put_flash(socket, :error, "Failed to start upgrade process: #{reason}")}
    end
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
      socket.assigns.name_form |> AshPhoenix.Form.validate(form_params, errors: true) |> to_form()

    # Reset availability when input changes, but keep success message until next submission
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

    # Don't submit if name is not available
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
           |> put_flash(:info, "Name updated successfully!")}

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

  def handle_event("disconnect_platform", %{"platform" => platform_str} = _params, socket) do
    handle_platform_disconnect(socket, platform_str)
  end

  def handle_event("update_donation_preferences", %{"preferences" => params}, socket) do
    current_user = socket.assigns.current_user

    # Parse and validate amounts
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
         |> put_flash(:info, "Donation preferences updated successfully!")}

      {:error, _changeset} ->
        {:noreply,
         put_flash(
           socket,
           :error,
           "Failed to update donation preferences. Please check your values."
         )}
    end
  end

  defp parse_amount(""), do: nil
  defp parse_amount(nil), do: nil

  defp parse_amount(amount) when is_binary(amount) do
    case Integer.parse(amount) do
      {num, ""} when num > 0 -> num
      _ -> nil
    end
  end

  defp parse_amount(amount) when is_integer(amount) and amount > 0, do: amount
  defp parse_amount(_), do: nil

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
                  <%= if @current_user.avatar do %>
                    <img
                      src={@current_user.avatar}
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

        {render_notification_preferences(assigns)}
      </div>
    </.dashboard_layout>
    """
  end
end
