defmodule StreampaiWeb.Components.AvatarUploadComponent do
  @moduledoc """
  Avatar upload component with progress indicator and preview functionality.
  """
  use Phoenix.LiveComponent

  import StreampaiWeb.AnalyticsComponents

  alias StreampaiWeb.Utils.FormatHelpers

  require Logger

  @impl true
  def render(assigns) do
    ~H"""
    <div class="space-y-4">
      <div class="flex items-center space-x-4">
        <div class="relative">
          <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
            <%= if @current_avatar do %>
              <img
                src={@current_avatar}
                alt="Current avatar"
                class="w-full h-full object-cover"
              />
            <% else %>
              <span class="text-white font-bold text-xl">
                {@user_name |> String.first() |> String.upcase()}
              </span>
            <% end %>
          </div>
          <%= if @uploading do %>
            <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin">
              </div>
            </div>
          <% end %>
        </div>

        <div class="flex-1">
          <h4 class="font-medium text-gray-900">Profile Picture</h4>
          <p class="text-sm text-gray-600">
            Upload a new avatar. JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </div>

      <form phx-submit="upload_avatar" phx-change="validate_avatar" phx-target={@myself}>
        <div class="space-y-3">
          <div class="flex items-center justify-center w-full">
            <label
              for="avatar-upload"
              class={"flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors #{if @dragover, do: "border-purple-500 bg-purple-50", else: "border-gray-300 hover:bg-gray-50"}"}
              phx-hook="AvatarUpload"
              phx-target={@myself}
              id="avatar-upload-zone"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  class="w-8 h-8 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  >
                  </path>
                </svg>
                <p class="mb-2 text-sm text-gray-500">
                  <span class="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-gray-500">PNG, JPG or GIF (Max 5MB)</p>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                class="hidden"
                name="avatar"
                phx-target={@myself}
              />
            </label>
          </div>

          <%= if @preview_url do %>
            <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img src={@preview_url} alt="Preview" class="w-12 h-12 rounded-full object-cover" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Ready to upload</p>
                <p class="text-xs text-gray-500">
                  {@file_name} • {FormatHelpers.format_file_size(@file_size)}
                </p>
              </div>
              <button
                type="button"
                phx-click="clear_preview"
                phx-target={@myself}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  >
                  </path>
                </svg>
              </button>
            </div>
          <% end %>

          <%= if @upload_progress > 0 do %>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-700">Uploading...</span>
                <span class="text-gray-500">{@upload_progress}%</span>
              </div>
              <.progress_bar
                value={@upload_progress}
                max_value={100.0}
                color_class="bg-purple-500"
                size={:medium}
                animate={true}
              />
            </div>
          <% end %>

          <%= if @error do %>
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-800">{@error}</p>
            </div>
          <% end %>

          <%= if @success do %>
            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-800">{@success}</p>
            </div>
          <% end %>

          <%= if @preview_url do %>
            <div class="flex space-x-3">
              <button
                type="submit"
                disabled={@uploading}
                class={"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors #{if @uploading, do: "opacity-50 cursor-not-allowed", else: "hover:bg-purple-700"}"}
              >
                <%= if @uploading do %>
                  Uploading...
                <% else %>
                  Upload Avatar
                <% end %>
              </button>
              <button
                type="button"
                phx-click="clear_preview"
                phx-target={@myself}
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          <% end %>
        </div>
      </form>
    </div>
    """
  end

  @impl true
  def mount(socket) do
    {:ok,
     socket
     |> assign(:uploading, false)
     |> assign(:upload_progress, 0)
     |> assign(:preview_url, nil)
     |> assign(:file_name, nil)
     |> assign(:file_size, nil)
     |> assign(:error, nil)
     |> assign(:success, nil)
     |> assign(:dragover, false)}
  end

  @impl true
  def update(assigns, socket) do
    current_user = assigns[:current_user]

    user_name =
      if current_user do
        current_user.email || "U"
      else
        "U"
      end

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:current_avatar, get_avatar_url(current_user))
     |> assign(:user_name, user_name)}
  end

  @impl true
  def handle_event("validate_avatar", %{"avatar" => avatar_params}, socket) do
    case validate_file(avatar_params) do
      {:ok, file_info} ->
        {:noreply,
         socket
         |> assign(:preview_url, file_info.data_url)
         |> assign(:file_name, file_info.name)
         |> assign(:file_size, file_info.size)
         |> assign(:error, nil)}

      {:error, reason} ->
        {:noreply,
         socket
         |> assign(:error, reason)
         |> assign(:preview_url, nil)}
    end
  end

  # Handle form-based file input change events (fallback)
  @impl true
  def handle_event("validate_avatar", _params, socket) do
    # Form-based file input change - ignore this for now as we handle it via JavaScript
    {:noreply, socket}
  end

  @impl true
  def handle_event("upload_avatar", %{"avatar" => avatar_params}, socket) do
    case process_avatar_upload(avatar_params, socket.assigns.current_user) do
      {:ok, avatar_url} ->
        # Send message to parent LiveView
        send(self(), {:avatar_uploaded, avatar_url})

        {:noreply,
         socket
         |> assign(:uploading, false)
         |> assign(:upload_progress, 100)
         |> assign(:preview_url, nil)
         |> assign(:file_name, nil)
         |> assign(:file_size, nil)
         |> assign(:current_avatar, avatar_url)
         |> assign(:success, "Avatar updated successfully!")}

      {:error, reason} ->
        Logger.error("Avatar upload failed: #{reason}")

        {:noreply,
         socket
         |> assign(:uploading, false)
         |> assign(:upload_progress, 0)
         |> assign(:error, reason)}
    end
  end

  @impl true
  def handle_event("upload_avatar", _params, socket) do
    # Handle form-based upload using data from assigns (from validation step)
    if socket.assigns.preview_url && socket.assigns.file_name do
      # Extract base64 data from preview URL
      [_header, data] = String.split(socket.assigns.preview_url, ",", parts: 2)

      avatar_params = %{
        "data" => data,
        "name" => socket.assigns.file_name,
        # Default to PNG since we have the data URL
        "type" => "image/png"
      }

      case process_avatar_upload(avatar_params, socket.assigns.current_user) do
        {:ok, avatar_url} ->
          # Send message to parent LiveView
          send(self(), {:avatar_uploaded, avatar_url})

          {:noreply,
           socket
           |> assign(:uploading, false)
           |> assign(:upload_progress, 100)
           |> assign(:preview_url, nil)
           |> assign(:file_name, nil)
           |> assign(:file_size, nil)
           |> assign(:current_avatar, avatar_url)
           |> assign(:success, "Avatar updated successfully!")}

        {:error, reason} ->
          Logger.error("Avatar upload failed: #{reason}")

          {:noreply,
           socket
           |> assign(:uploading, false)
           |> assign(:upload_progress, 0)
           |> assign(:error, reason)}
      end
    else
      {:noreply, assign(socket, :error, "No file selected for upload")}
    end
  end

  @impl true
  def handle_event("clear_preview", _params, socket) do
    {:noreply,
     socket
     |> assign(:preview_url, nil)
     |> assign(:file_name, nil)
     |> assign(:file_size, nil)
     |> assign(:error, nil)}
  end

  @impl true
  def handle_event("drag_over", _params, socket) do
    {:noreply, assign(socket, :dragover, true)}
  end

  @impl true
  def handle_event("drag_leave", _params, socket) do
    {:noreply, assign(socket, :dragover, false)}
  end

  @impl true
  def handle_event("file_error", %{"error" => error}, socket) do
    {:noreply, assign(socket, :error, error)}
  end

  defp get_avatar_url(nil), do: nil

  defp get_avatar_url(user) do
    cond do
      user.avatar -> user.avatar
      user.extra_data["picture"] -> user.extra_data["picture"]
      true -> nil
    end
  end

  defp validate_file(%{"name" => name, "size" => size, "type" => type} = file_params) do
    cond do
      size > 5_000_000 ->
        {:error, "File size must be less than 5MB"}

      not String.starts_with?(type, "image/") ->
        {:error, "File must be an image (JPG, PNG, or GIF)"}

      not Enum.any?(~w(.jpg .jpeg .png .gif), &String.ends_with?(String.downcase(name), &1)) ->
        {:error, "Invalid file extension. Use JPG, PNG, or GIF"}

      true ->
        {:ok,
         %{
           name: name,
           size: size,
           type: type,
           data_url: file_params["data_url"]
         }}
    end
  end

  defp validate_file(_), do: {:error, "Invalid file"}

  defp process_avatar_upload(%{"data" => data, "name" => name, "type" => _type}, user) do
    # Decode base64 data
    decoded_data = Base.decode64!(data)

    # Generate unique filename
    extension = Path.extname(name)
    filename = "#{user.id}_#{System.system_time(:millisecond)}#{extension}"

    filepath =
      Path.join([Application.app_dir(:streampai), "priv", "static", "avatars", filename])

    # Ensure directory exists
    File.mkdir_p!(Path.dirname(filepath))

    # Write file
    File.write!(filepath, decoded_data)

    # Update user avatar in database
    update_user_avatar(user, filename)

    {:ok, "/avatars/#{filename}"}
  rescue
    e ->
      {:error, "Failed to upload avatar: #{Exception.message(e)}"}
  end

  defp update_user_avatar(user, filename) do
    avatar_url = "/avatars/#{filename}"

    # Update user with new avatar URL using the update_avatar action
    user
    |> Ash.Changeset.for_update(:update_avatar, %{avatar_url: avatar_url})
    |> Ash.update!(actor: user)
  end
end
