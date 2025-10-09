defmodule StreampaiWeb.Components.ThumbnailSelectorComponent do
  @moduledoc """
  Simple thumbnail selector component that shows a preview and allows file selection.

  The actual upload happens when the parent component needs it (e.g., before starting a stream).
  This provides a seamless UX where users just select a file and click GO LIVE.

  ## Usage

      <.live_component
        module={StreampaiWeb.Components.ThumbnailSelectorComponent}
        id="thumbnail-selector"
        current_thumbnail_url={@metadata.thumbnail_url}
      />
  """
  use Phoenix.LiveComponent

  import StreampaiWeb.CoreComponents

  @impl true
  def render(assigns) do
    ~H"""
    <div class="space-y-3" phx-hook="ThumbnailSelector" id={"thumbnail-selector-#{@id}"}>
      <label class="block text-sm font-medium text-gray-700">Thumbnail</label>

      <div class="flex items-start space-x-4">
        <!-- Thumbnail Preview (16:9 aspect ratio) -->
        <div class="relative">
          <div class="w-48 aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
            <%= if @preview_url do %>
              <img
                src={@preview_url}
                alt="Thumbnail preview"
                class="w-full h-full object-cover"
              />
            <% else %>
              <.icon name="hero-photo" class="w-8 h-8 text-gray-400" />
            <% end %>
          </div>
          <%= if @has_selected_file do %>
            <div class="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1">
              <.icon name="hero-check" class="w-3 h-3" />
            </div>
          <% end %>
        </div>
        
    <!-- File Selection -->
        <div class="flex-1">
          <label
            for={"thumbnail-file-#{@id}"}
            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <.icon name="hero-photo" class="w-4 h-4 mr-2" />
            {if @has_selected_file, do: "Change Thumbnail", else: "Select Thumbnail"}
          </label>
          <input
            type="file"
            id={"thumbnail-file-#{@id}"}
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            class="hidden"
            phx-change="file_selected"
            phx-target={@myself}
          />

          <%= if @has_selected_file do %>
            <button
              type="button"
              phx-click="clear_file"
              phx-target={@myself}
              class="ml-2 text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          <% end %>

          <p class="text-xs text-gray-500 mt-1">
            JPG or PNG, max 5MB
          </p>

          <%= if @file_info do %>
            <p class="text-xs text-green-600 mt-1">
              ✓ {Path.basename(@file_info.name)} selected
            </p>
          <% end %>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def mount(socket) do
    {:ok,
     socket
     |> assign(:preview_url, nil)
     |> assign(:file_info, nil)
     |> assign(:has_selected_file, false)}
  end

  @impl true
  def update(assigns, socket) do
    socket = assign(socket, assigns)

    # Set initial preview from current thumbnail URL
    socket =
      if !socket.assigns[:preview_url] && assigns[:current_thumbnail_url] do
        assign(socket, :preview_url, assigns.current_thumbnail_url)
      else
        socket
      end

    {:ok, socket}
  end

  @impl true
  def handle_event("file_selected", %{"_target" => [_input_id]}, socket) do
    # The file data will come through the ThumbnailSelector hook via JavaScript
    # For now, we just mark that a file selection is in progress
    {:noreply, socket}
  end

  @impl true
  def handle_event("file_selected", _params, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event("file_validated", %{"file" => file_params}, socket) do
    # File has been read and validated by the client
    # Store the file info and preview URL
    file_info = %{
      name: file_params["name"],
      size: file_params["size"],
      type: file_params["type"],
      data_url: file_params["data_url"],
      content_hash: file_params["content_hash"]
    }

    # Notify parent that a file has been selected
    send(self(), {:thumbnail_selected, socket.assigns.id, file_info})

    {:noreply,
     socket
     |> assign(:file_info, file_info)
     |> assign(:preview_url, file_params["data_url"])
     |> assign(:has_selected_file, true)}
  end

  @impl true
  def handle_event("clear_file", _params, socket) do
    # Notify parent that file was cleared
    send(self(), {:thumbnail_cleared, socket.assigns.id})

    # Restore to original thumbnail URL if available
    preview_url = socket.assigns[:current_thumbnail_url]

    {:noreply,
     socket
     |> assign(:file_info, nil)
     |> assign(:preview_url, preview_url)
     |> assign(:has_selected_file, false)}
  end

  @doc """
  Get the currently selected file info from this component.
  Returns nil if no file is selected.
  """
  def get_selected_file(_socket, _component_id) do
    # This would be called from the parent LiveView
    # In practice, the parent will track this via the messages
    nil
  end
end
