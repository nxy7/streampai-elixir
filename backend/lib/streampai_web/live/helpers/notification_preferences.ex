defmodule StreampaiWeb.Live.Helpers.NotificationPreferences do
  @moduledoc """
  Simple helper functions for notification preferences.
  This is a simpler alternative to the macro approach.
  """

  import Phoenix.LiveView, only: [put_flash: 3]
  import Phoenix.Component, only: [assign: 3, sigil_H: 2]

  @doc """
  Loads user preferences and assigns them to the socket.
  """
  def load_user_preferences(socket) do
    current_user = socket.assigns.current_user

    user_preferences =
      case Streampai.Accounts.UserPreferences.get_by_user_id(
             %{user_id: current_user.id},
             actor: current_user
           ) do
        {:ok, preferences} ->
          preferences

        {:error, %Ash.Error.Query.NotFound{}} ->
          %{email_notifications: true}

        {:error, _error} ->
          %{email_notifications: true}
      end

    assign(socket, :user_preferences, user_preferences)
  end

  @doc """
  Handles the email notification toggle event.
  """
  def handle_notification_toggle(socket) do
    current_preferences = socket.assigns.user_preferences
    current_user = socket.assigns.current_user
    new_value = not current_preferences.email_notifications

    case Streampai.Accounts.UserPreferences.create(
           %{
             user_id: current_user.id,
             email_notifications: new_value
           },
           actor: current_user
         ) do
      {:ok, updated_preferences} ->
        {:noreply,
         socket
         |> assign(:user_preferences, updated_preferences)
         |> put_flash(
           :info,
           if(new_value, do: "Email notifications enabled", else: "Email notifications disabled")
         )}

      {:error, _error} ->
        {:noreply,
         socket
         |> put_flash(:error, "Failed to update notification preferences")}
    end
  end

  @doc """
  Renders the notification preferences section.
  """
  def render_notification_preferences(assigns) do
    ~H"""
    <!-- Notifications Settings -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium text-gray-900">Email Notifications</h4>
            <p class="text-sm text-gray-500">Get notified about important account updates</p>
          </div>
          <button
            phx-click="toggle_email_notifications"
            class={"relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 #{if @user_preferences.email_notifications, do: "bg-purple-600", else: "bg-gray-200"}"}
          >
            <span class={"inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out #{if @user_preferences.email_notifications, do: "translate-x-5", else: "translate-x-0"}"}>
            </span>
          </button>
        </div>
      </div>
    </div>
    """
  end
end
