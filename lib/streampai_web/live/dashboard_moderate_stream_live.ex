defmodule StreampaiWeb.DashboardModerateStreamLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  alias Ash.Error.Forbidden
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole
  alias Streampai.Stream.StreamAction

  require Logger

  def mount_page(socket, %{"user_id" => target_user_id}, _session) do
    moderator_id = socket.assigns.current_user.id

    # Verify this user is actually a moderator for the target user
    case verify_moderator_permission(moderator_id, target_user_id) do
      {:ok, target_user} ->
        # Subscribe to chat and events for the target user
        if Phoenix.LiveView.connected?(socket) do
          Phoenix.PubSub.subscribe(Streampai.PubSub, "chat:#{target_user_id}")
          Phoenix.PubSub.subscribe(Streampai.PubSub, "stream_events:#{target_user_id}")
        end

        socket =
          socket
          |> assign(:page_title, "Moderate Stream - #{target_user.name || target_user.email}")
          |> assign(:target_user, target_user)
          |> assign(:target_user_id, target_user_id)
          |> assign(:chat_messages, [])
          |> assign(:stream_events, [])

        {:ok, socket, layout: false}

      {:error, :not_authorized} ->
        socket =
          socket
          |> put_flash(:error, "You don't have moderator permissions for this user")
          |> Phoenix.LiveView.redirect(to: "/dashboard/moderate")

        {:ok, socket, layout: false}
    end
  end

  def handle_event("send_message", %{"message" => message}, socket) when message != "" do
    target_user_id = socket.assigns.target_user_id

    case StreamAction.send_message(
           %{user_id: target_user_id, message: message, platforms: [:all]},
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        {:noreply, socket}

      {:error, %Forbidden{}} ->
        {:noreply, put_flash(socket, :error, "Not authorized to send messages")}

      {:error, reason} ->
        Logger.error("Failed to send chat message: #{inspect(reason)}")
        {:noreply, put_flash(socket, :error, "Failed to send message")}
    end
  end

  def handle_event("send_message", _params, socket), do: {:noreply, socket}

  def handle_event("update_metadata", %{"title" => title, "description" => description}, socket) do
    target_user_id = socket.assigns.target_user_id

    case StreamAction.update_stream_metadata(
           %{
             user_id: target_user_id,
             title: title,
             description: description,
             platforms: [:all]
           },
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        {:noreply, put_flash(socket, :info, "Stream metadata updated successfully")}

      {:error, %Forbidden{}} ->
        {:noreply, put_flash(socket, :error, "Not authorized to update stream metadata")}

      {:error, reason} ->
        Logger.error("Failed to update metadata: #{inspect(reason)}")
        {:noreply, put_flash(socket, :error, "Failed to update stream metadata")}
    end
  end

  def handle_info({:chat_message, chat_event}, socket) do
    chat_messages = socket.assigns[:chat_messages] || []

    formatted_message = %{
      id: chat_event.id,
      sender_username: chat_event.username,
      message: chat_event.message,
      platform: to_string(chat_event.platform),
      timestamp: chat_event.timestamp || DateTime.utc_now()
    }

    updated_messages = Enum.take([formatted_message | chat_messages], 50)

    {:noreply, assign(socket, :chat_messages, updated_messages)}
  end

  def handle_info({:platform_event, event}, socket) do
    if event_should_be_displayed?(event.type) do
      stream_events = socket.assigns[:stream_events] || []

      formatted_event = %{
        id: event.id,
        type: to_string(event.type),
        username: event.username,
        amount: Map.get(event, :amount),
        tier: Map.get(event, :tier),
        viewers: Map.get(event, :viewers),
        platform: to_string(event.platform),
        timestamp: event.timestamp || DateTime.utc_now()
      }

      updated_events = Enum.take([formatted_event | stream_events], 20)

      {:noreply, assign(socket, :stream_events, updated_events)}
    else
      {:noreply, socket}
    end
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  defp verify_moderator_permission(moderator_id, target_user_id) do
    # Check if moderator has an accepted moderator role for target user
    case UserRole.check_permission(
           %{
             user_id: moderator_id,
             granter_id: target_user_id,
             role_type: :moderator
           },
           authorize?: false
         ) do
      {:ok, [_role]} ->
        # Load target user
        case User.get_by_id(%{id: target_user_id}, authorize?: false) do
          {:ok, [user]} -> {:ok, user}
          _ -> {:error, :not_authorized}
        end

      _ ->
        {:error, :not_authorized}
    end
  end

  defp event_should_be_displayed?(:donation), do: true
  defp event_should_be_displayed?(:subscription), do: true
  defp event_should_be_displayed?(:follow), do: true
  defp event_should_be_displayed?(:raid), do: true
  defp event_should_be_displayed?(_), do: false

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="moderate" page_title={@page_title}>
      <div class="max-w-7xl mx-auto">
        <!-- Back Button -->
        <div class="mb-6">
          <.link
            navigate="/dashboard/moderate"
            class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Moderated Users
          </.link>
        </div>
        <!-- Moderator Notice -->
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                You are moderating <strong>{@target_user.name || @target_user.email}</strong>'s stream. You can send messages and update stream metadata.
              </p>
            </div>
          </div>
        </div>
        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Stream Metadata -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Update Stream Metadata -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Stream Metadata</h3>
              <form phx-submit="update_metadata" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Stream Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter stream title"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter stream description"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  class="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update Metadata
                </button>
              </form>
            </div>
            <!-- Chat Messages -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Chat</h3>
              <div class="h-64 overflow-y-auto mb-4 space-y-2">
                <%= if Enum.empty?(@chat_messages) do %>
                  <p class="text-sm text-gray-500 text-center py-8">
                    No chat messages yet
                  </p>
                <% else %>
                  <%= for message <- @chat_messages do %>
                    <div class="text-sm">
                      <span class="font-medium text-gray-900">{message.sender_username}:</span>
                      <span class="text-gray-700">{message.message}</span>
                      <span class="text-xs text-gray-400 ml-2">
                        ({message.platform})
                      </span>
                    </div>
                  <% end %>
                <% end %>
              </div>
              
    <!-- Send Message Form -->
              <form phx-submit="send_message" class="flex gap-2">
                <input
                  type="text"
                  name="message"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Type a message..."
                  autocomplete="off"
                />
                <button
                  type="submit"
                  class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
          <!-- Right Column: Stream Events -->
          <div class="space-y-6">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Stream Events</h3>
              <div class="space-y-3">
                <%= if Enum.empty?(@stream_events) do %>
                  <p class="text-sm text-gray-500 text-center py-8">
                    No events yet
                  </p>
                <% else %>
                  <%= for event <- @stream_events do %>
                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                          <%= case event.type do %>
                            <% "follow" -> %>
                              <svg
                                class="w-5 h-5 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                              </svg>
                            <% "subscription" -> %>
                              <svg
                                class="w-5 h-5 text-purple-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            <% "donation" -> %>
                              <svg
                                class="w-5 h-5 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path
                                  fill-rule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            <% "raid" -> %>
                              <svg
                                class="w-5 h-5 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                            <% _ -> %>
                              <svg
                                class="w-5 h-5 text-gray-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                          <% end %>
                          <div class="text-sm">
                            <p class="font-medium text-gray-900">{event.username}</p>
                            <p class="text-gray-500 capitalize">{event.type}</p>
                          </div>
                        </div>
                      </div>
                      <%= if event.amount do %>
                        <p class="text-sm font-medium text-green-600 mt-2">
                          ${event.amount}
                        </p>
                      <% end %>
                    </div>
                  <% end %>
                <% end %>
              </div>
            </div>
          </div>
        </div>
      </div>
    </.dashboard_layout>
    """
  end
end
