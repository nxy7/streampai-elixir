defmodule StreampaiWeb.Components.AvatarUploadComponent do
  @moduledoc """
  Avatar upload component with progress indicator and preview functionality.
  """
  use Phoenix.LiveComponent

  import StreampaiWeb.AnalyticsComponents

  alias Streampai.Storage.SizeLimits
  alias StreampaiWeb.Utils.FormatHelpers

  require Logger

  # Get avatar size limit from centralized configuration
  @max_avatar_size SizeLimits.max_size(:avatar)

  @impl true
  def render(assigns) do
    assigns =
      assigns
      |> assign(:max_size_bytes, @max_avatar_size)
      |> assign(:max_size_formatted, SizeLimits.format_size(@max_avatar_size))

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
            Upload a new avatar. JPG, PNG or GIF. Max size {@max_size_formatted}.
          </p>
        </div>
      </div>

      <form phx-submit="upload_avatar" phx-change="validate_avatar" phx-target={@myself}>
        <div class="space-y-3">
          <div class="flex items-center justify-center w-full">
            <label
              for="avatar-upload"
              class={"flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors #{if @dragover, do: "border-purple-500 bg-purple-50", else: "border-gray-300 hover:bg-gray-50"}"}
              phx-hook="FileUpload"
              phx-target={@myself}
              id="avatar-upload-zone"
              data-max-size={@max_size_bytes}
              data-accept="image/*"
              data-upload-event="upload_avatar"
              data-validate-event="validate_avatar"
              data-confirm-event="confirm_upload"
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
                <p class="text-xs text-gray-500">PNG, JPG or GIF (Max {@max_size_formatted})</p>
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
     |> assign(:file_type, nil)
     |> assign(:pending_file_id, nil)
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
  def handle_event("validate_avatar", %{"file" => file_params}, socket) do
    case validate_file(file_params) do
      {:ok, file_info} ->
        {:noreply,
         socket
         |> assign(:preview_url, file_info.data_url)
         |> assign(:file_name, file_info.name)
         |> assign(:file_size, file_info.size)
         |> assign(:file_type, file_info.type)
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
  def handle_event("upload_avatar", _params, socket) do
    user = socket.assigns.current_user
    file_name = socket.assigns.file_name
    file_type = socket.assigns.file_type
    file_size = socket.assigns.file_size

    if file_name && file_type && file_size do
      case request_s3_upload(user, file_name, file_type, file_size) do
        {:ok, file_id, upload_url, upload_headers} ->
          {:noreply,
           socket
           |> assign(:uploading, true)
           |> assign(:pending_file_id, file_id)
           |> push_event("start_s3_upload", %{
             url: upload_url,
             headers: upload_headers,
             file_id: file_id
           })}

        {:error, reason} ->
          Logger.error("Failed to request S3 upload: #{inspect(reason)}")

          {:noreply,
           socket
           |> assign(:error, reason)
           |> assign(:uploading, false)}
      end
    else
      {:noreply, assign(socket, :error, "No file selected for upload")}
    end
  end

  @impl true
  def handle_event("confirm_upload", %{"file_id" => file_id}, socket) do
    user = socket.assigns.current_user

    case confirm_avatar_upload(file_id, user) do
      {:ok, avatar_url} ->
        send(self(), {:avatar_uploaded, avatar_url})

        {:noreply,
         socket
         |> assign(:uploading, false)
         |> assign(:upload_progress, 100)
         |> assign(:preview_url, nil)
         |> assign(:file_name, nil)
         |> assign(:file_size, nil)
         |> assign(:file_type, nil)
         |> assign(:pending_file_id, nil)
         |> assign(:current_avatar, avatar_url)
         |> assign(:success, "Avatar updated successfully!")}

      {:error, reason} ->
        Logger.error("Avatar upload confirmation failed: #{inspect(reason)}")

        {:noreply,
         socket
         |> assign(:uploading, false)
         |> assign(:upload_progress, 0)
         |> assign(:error, "Failed to confirm upload: #{inspect(reason)}")}
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

  @impl true
  def handle_event("upload_progress", %{"progress" => progress}, socket) do
    {:noreply, assign(socket, :upload_progress, progress)}
  end

  defp get_avatar_url(nil), do: nil

  defp get_avatar_url(user) do
    user = Ash.load!(user, :display_avatar)
    user.display_avatar
  end

  defp validate_file(%{"name" => name, "size" => size, "type" => type} = file_params) do
    cond do
      size > @max_avatar_size ->
        {:error, "File size must be less than #{SizeLimits.format_size(@max_avatar_size)}"}

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

  defp request_s3_upload(user, filename, content_type, estimated_size) do
    case Streampai.Storage.File.request_upload(
           %{
             filename: filename,
             content_type: content_type,
             file_type: :avatar,
             estimated_size: estimated_size
           },
           actor: user
         ) do
      {:ok, file} ->
        {:ok, file.id, file.__metadata__.upload_url, file.__metadata__.upload_headers}

      {:error, %Ash.Error.Invalid{} = error} ->
        {:error, Exception.message(error)}

      {:error, error} ->
        {:error, inspect(error)}
    end
  end

  defp confirm_avatar_upload(file_id, user) do
    with {:ok, file} <-
           Streampai.Storage.File.get_by_id(%{id: file_id}, actor: user),
         {:ok, _uploaded_file} <-
           Streampai.Storage.File.mark_uploaded(file, actor: user),
         {:ok, updated_user} <-
           Streampai.Accounts.User.update_avatar(user, file_id, actor: user) do
      updated_user = Ash.load!(updated_user, :display_avatar)
      {:ok, updated_user.display_avatar}
    end
  end
end
