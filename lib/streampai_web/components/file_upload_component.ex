defmodule StreampaiWeb.Components.FileUploadComponent do
  @moduledoc """
  Generic file upload component with progress indicator and preview functionality.

  Can be used for any file type by configuring the accepted types and max size.

  ## Usage

      <.live_component
        module={StreampaiWeb.Components.FileUploadComponent}
        id="document-upload"
        current_user={@current_user}
        file_type={:document}
        accept="application/pdf,.pdf"
        max_size={20_000_000}
        title="Upload Document"
        description="Upload a PDF document up to 20MB"
      />
  """
  use Phoenix.LiveComponent

  import StreampaiWeb.CoreComponents
  import StreampaiWeb.AnalyticsComponents
  alias StreampaiWeb.Utils.FormatHelpers

  require Logger

  @impl true
  def render(assigns) do
    ~H"""
    <div class="space-y-4">
      <div class="flex items-start space-x-4">
        <%= if @show_preview do %>
          <div class="relative">
            <div class={preview_container_class(@file_type)}>
              <%= render_preview(assigns) %>
            </div>
            <%= if @uploading do %>
              <div class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin">
                </div>
              </div>
            <% end %>
          </div>
        <% end %>

        <div class="flex-1">
          <h4 class="font-medium text-gray-900">{@title}</h4>
          <p class="text-sm text-gray-600">{@description}</p>
        </div>
      </div>

      <form phx-submit="upload_file" phx-change="validate_file" phx-target={@myself}>
        <div class="space-y-3">
          <div class="flex items-center justify-center w-full">
            <label
              for={"file-upload-#{@id}"}
              class={"flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors #{if @dragover, do: "border-purple-500 bg-purple-50", else: "border-gray-300 hover:bg-gray-50"}"}
              phx-hook="FileUpload"
              phx-target={@myself}
              id={"file-upload-zone-#{@id}"}
              data-max-size={@max_size}
              data-accept={@accept}
              data-upload-event="upload_file"
              data-validate-event="validate_file"
              data-confirm-event="confirm_upload"
            >
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <.icon name={upload_icon(@file_type)} class="w-8 h-8 mb-3 text-gray-400" />
                <p class="mb-2 text-sm text-gray-500">
                  <span class="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-gray-500">
                  {format_accept_text(@accept)} (Max {FormatHelpers.format_file_size(@max_size)})
                </p>
              </div>
              <input
                id={"file-upload-#{@id}"}
                type="file"
                accept={@accept}
                class="hidden"
                name="file"
                phx-target={@myself}
              />
            </label>
          </div>

          <%= if @file_info do %>
            <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div class={file_icon_class(@file_info.type)}>
                <.icon name={file_type_icon(@file_info.type)} class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Ready to upload</p>
                <p class="text-xs text-gray-500">
                  {@file_info.name} • {FormatHelpers.format_file_size(@file_info.size)}
                </p>
              </div>
              <button
                type="button"
                phx-click="clear_file"
                phx-target={@myself}
                class="text-gray-400 hover:text-gray-600"
              >
                <.icon name="hero-x-mark" class="w-5 h-5" />
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

          <%= if @file_info do %>
            <div class="flex space-x-3">
              <button
                type="submit"
                disabled={@uploading}
                class={"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors #{if @uploading, do: "opacity-50 cursor-not-allowed", else: "hover:bg-purple-700"}"}
              >
                <%= if @uploading do %>
                  Uploading...
                <% else %>
                  Upload {@upload_button_text}
                <% end %>
              </button>
              <button
                type="button"
                phx-click="clear_file"
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
     |> assign_defaults()}
  end

  @impl true
  def update(assigns, socket) do
    {:ok,
     socket
     |> assign(assigns)
     |> assign_computed_values()}
  end

  @impl true
  def handle_event("validate_file", %{"file" => file_params}, socket) do
    case validate_file(file_params, socket.assigns) do
      {:ok, file_info} ->
        {:noreply,
         socket
         |> assign(:file_info, file_info)
         |> assign(:error, nil)}

      {:error, reason} ->
        {:noreply,
         socket
         |> assign(:error, reason)
         |> assign(:file_info, nil)}
    end
  end

  @impl true
  def handle_event("validate_file", _params, socket) do
    # Fallback for non-JS file input
    {:noreply, socket}
  end

  @impl true
  def handle_event("upload_file", _params, socket) do
    user = socket.assigns.current_user
    file_info = socket.assigns.file_info

    if file_info do
      case request_s3_upload(user, file_info, socket.assigns.file_type) do
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

    case confirm_file_upload(file_id, user) do
      {:ok, file} ->
        # Send event to parent LiveView
        send(self(), {:file_uploaded, socket.assigns.id, file})

        {:noreply,
         socket
         |> assign(:uploading, false)
         |> assign(:upload_progress, 100)
         |> assign(:file_info, nil)
         |> assign(:pending_file_id, nil)
         |> assign(:success, "File uploaded successfully!")}

      {:error, reason} ->
        Logger.error("File upload confirmation failed: #{inspect(reason)}")
        {:noreply,
         socket
         |> assign(:uploading, false)
         |> assign(:upload_progress, 0)
         |> assign(:error, "Failed to confirm upload: #{inspect(reason)}")}
    end
  end

  @impl true
  def handle_event("clear_file", _params, socket) do
    {:noreply,
     socket
     |> assign(:file_info, nil)
     |> assign(:error, nil)
     |> assign(:upload_progress, 0)}
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

  # Private functions

  defp assign_defaults(socket) do
    socket
    |> assign(:uploading, false)
    |> assign(:upload_progress, 0)
    |> assign(:file_info, nil)
    |> assign(:pending_file_id, nil)
    |> assign(:error, nil)
    |> assign(:success, nil)
    |> assign(:dragover, false)
  end

  defp assign_computed_values(socket) do
    socket
    |> assign_new(:file_type, fn -> :other end)
    |> assign_new(:accept, fn -> "*" end)
    |> assign_new(:max_size, fn -> 10_000_000 end) # 10MB default
    |> assign_new(:title, fn -> "Upload File" end)
    |> assign_new(:description, fn -> "Choose a file to upload" end)
    |> assign_new(:show_preview, fn -> false end)
    |> assign_new(:upload_button_text, fn -> "File" end)
  end

  defp validate_file(%{"name" => name, "size" => size, "type" => type} = file_params, assigns) do
    max_size = assigns.max_size
    accept = assigns.accept

    cond do
      size > max_size ->
        {:error, "File size must be less than #{FormatHelpers.format_file_size(max_size)}"}

      not accepted_type?(type, name, accept) ->
        {:error, "Invalid file type. Please upload #{format_accept_text(accept)}"}

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

  defp validate_file(_, _), do: {:error, "Invalid file"}

  defp accepted_type?(_type, _name, "*"), do: true

  defp accepted_type?(type, name, accept) do
    accepts = String.split(accept, ",") |> Enum.map(&String.trim/1)

    Enum.any?(accepts, fn pattern ->
      cond do
        String.starts_with?(pattern, ".") ->
          # Extension check
          String.downcase(name) |> String.ends_with?(String.downcase(pattern))

        String.contains?(pattern, "*") ->
          # Wildcard MIME type (e.g., "image/*")
          prefix = String.replace(pattern, "*", "")
          String.starts_with?(type, prefix)

        true ->
          # Exact MIME type
          type == pattern
      end
    end)
  end

  defp request_s3_upload(user, file_info, file_type) do
    case Streampai.Storage.File.request_upload(
           %{
             filename: file_info.name,
             content_type: file_info.type,
             file_type: file_type,
             estimated_size: file_info.size
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

  defp confirm_file_upload(file_id, user) do
    with {:ok, file} <- Streampai.Storage.File.get_by_id(%{id: file_id}, actor: user),
         {:ok, uploaded_file} <- Streampai.Storage.File.mark_uploaded(file, actor: user) do
      {:ok, uploaded_file}
    end
  end

  defp render_preview(%{file_type: :avatar, current_file_url: url} = assigns) when not is_nil(url) do
    ~H"""
    <img src={@current_file_url} alt="Current avatar" class="w-full h-full object-cover" />
    """
  end

  defp render_preview(%{file_type: :avatar} = assigns) do
    ~H"""
    <span class="text-white font-bold text-xl">
      {@current_user.email |> String.first() |> String.upcase()}
    </span>
    """
  end

  defp render_preview(assigns) do
    ~H"""
    <.icon name={file_type_icon(@file_type)} class="w-8 h-8 text-gray-400" />
    """
  end

  defp preview_container_class(:avatar) do
    "w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden"
  end

  defp preview_container_class(_) do
    "w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"
  end

  defp file_icon_class(type) when is_binary(type) do
    cond do
      String.starts_with?(type, "image/") -> "bg-blue-100 text-blue-600"
      String.starts_with?(type, "video/") -> "bg-purple-100 text-purple-600"
      String.starts_with?(type, "audio/") -> "bg-green-100 text-green-600"
      type == "application/pdf" -> "bg-red-100 text-red-600"
      true -> "bg-gray-100 text-gray-600"
    end
    <> " w-12 h-12 rounded-lg flex items-center justify-center"
  end

  defp upload_icon(:avatar), do: "hero-user-circle"
  defp upload_icon(:document), do: "hero-document-arrow-up"
  defp upload_icon(:video), do: "hero-video-camera"
  defp upload_icon(_), do: "hero-arrow-up-tray"

  defp file_type_icon("image/" <> _), do: "hero-photo"
  defp file_type_icon("video/" <> _), do: "hero-video-camera"
  defp file_type_icon("audio/" <> _), do: "hero-musical-note"
  defp file_type_icon("application/pdf"), do: "hero-document"
  defp file_type_icon(:avatar), do: "hero-user-circle"
  defp file_type_icon(:document), do: "hero-document"
  defp file_type_icon(:video), do: "hero-video-camera"
  defp file_type_icon(_), do: "hero-document"

  defp format_accept_text("*"), do: "Any file type"
  defp format_accept_text("image/*"), do: "Images (JPG, PNG, GIF, etc.)"
  defp format_accept_text("video/*"), do: "Videos"
  defp format_accept_text("audio/*"), do: "Audio files"
  defp format_accept_text("application/pdf"), do: "PDF files"
  defp format_accept_text(".pdf"), do: "PDF files"
  defp format_accept_text(accept) do
    accept
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.map(&format_single_accept/1)
    |> Enum.join(", ")
  end

  defp format_single_accept("." <> ext), do: String.upcase(ext)
  defp format_single_accept(mime), do: mime
end