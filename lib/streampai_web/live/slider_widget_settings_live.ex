defmodule StreampaiWeb.SliderWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring slider widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :slider_widget,
    fake_module: StreampaiWeb.Utils.FakeSlider

  alias StreampaiWeb.Utils.FakeSlider
  alias StreampaiWeb.Utils.WidgetHelpers

  defp widget_title, do: "Slider Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Ensure images from config are available to Vue component
    config_with_images = Map.put_new(socket.assigns.widget_config, :images, [])

    # Generate initial event with existing images or demo images
    user_images = config_with_images[:images]

    initial_event =
      if Enum.empty?(user_images) do
        @fake_module.generate_event()
      else
        %{
          id: Streampai.Fake.Base.generate_hex_id(),
          type: "slider_update",
          images: user_images,
          timestamp: DateTime.utc_now()
        }
      end

    socket
    |> assign(:widget_config, config_with_images)
    |> assign(:current_event, initial_event)
    |> assign(:uploaded_images, [])
    |> assign(:image_upload_errors, [])
  end

  defp update_widget_settings(config, params) do
    WidgetHelpers.update_unified_settings(config, params, converter: &convert_setting_value/2)
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate demo images if user has no uploaded images
    user_images = socket.assigns.widget_config[:images] || []

    if Enum.empty?(user_images) do
      # Generate fake demo images for preview
      new_event = @fake_module.generate_event()
      assign(socket, :current_event, new_event)
    else
      # User has uploaded images, use those for preview
      # Create an event with user's images to trigger Vue component
      event = %{
        id: Streampai.Fake.Base.generate_hex_id(),
        type: "slider_update",
        images: user_images,
        timestamp: DateTime.utc_now()
      }

      assign(socket, :current_event, event)
    end
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :slide_duration ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 60)

      :transition_duration ->
        WidgetHelpers.parse_numeric_setting(value, min: 100, max: 3000)

      :transition_type ->
        valid_types = Enum.map(FakeSlider.transition_types(), & &1.value)
        WidgetHelpers.validate_config_value(:transition_type, value, valid_types, "fade")

      :fit_mode ->
        valid_modes = Enum.map(FakeSlider.fit_modes(), & &1.value)
        WidgetHelpers.validate_config_value(:fit_mode, value, valid_modes, "contain")

      _ ->
        value
    end
  end

  # Handle image uploads
  def handle_event("upload_images", %{"images" => images}, socket) when is_list(images) do
    current_config = socket.assigns.widget_config
    current_images = current_config[:images] || []

    # Check current image count limit
    if length(current_images) + length(images) > 20 do
      socket =
        socket
        |> assign(:image_upload_errors, ["Maximum of 20 images allowed"])
        |> put_flash(:error, "Too many images. Maximum of 20 images allowed.")

      {:noreply, socket}
    else
      case process_image_uploads(images, socket.assigns.current_user) do
        {:ok, new_images} ->
          updated_images = current_images ++ new_images
          updated_config = Map.put(current_config, :images, updated_images)

          save_and_broadcast_config(socket, updated_config)

          # Create new event with updated images to trigger Vue component update
          new_event = %{
            id: Streampai.Fake.Base.generate_hex_id(),
            type: "slider_update",
            images: updated_images,
            timestamp: DateTime.utc_now()
          }

          socket =
            socket
            |> assign(:widget_config, updated_config)
            |> assign(:current_event, new_event)
            |> assign(:image_upload_errors, [])
            |> put_flash(:info, "Images uploaded successfully!")

          {:noreply, socket}

        {:error, reason} ->
          socket =
            socket
            |> assign(:image_upload_errors, ["Failed to save configuration: #{reason}"])
            |> put_flash(:error, "Failed to save widget configuration")

          {:noreply, socket}
      end
    end
  end

  def handle_event("upload_images", _params, socket) do
    {:noreply, put_flash(socket, :error, "No images provided")}
  end

  def handle_event("remove_image", %{"image_id" => image_id}, socket) do
    current_config = socket.assigns.widget_config
    current_images = current_config[:images] || []

    initial_count = length(current_images)
    updated_images = Enum.reject(current_images, &(to_string(&1["id"]) == image_id))

    if length(updated_images) == initial_count do
      # No image was removed
      {:noreply, put_flash(socket, :error, "Image not found")}
    else
      updated_config = Map.put(current_config, :images, updated_images)
      save_and_broadcast_config(socket, updated_config)

      # Create new event with updated images to trigger Vue component update
      new_event =
        if Enum.empty?(updated_images) do
          # If no images left, generate demo event
          @fake_module.generate_event()
        else
          %{
            id: Streampai.Fake.Base.generate_hex_id(),
            type: "slider_update",
            images: updated_images,
            timestamp: DateTime.utc_now()
          }
        end

      socket =
        socket
        |> assign(:widget_config, updated_config)
        |> assign(:current_event, new_event)
        |> put_flash(:info, "Image removed successfully!")

      {:noreply, socket}
    end
  end

  def handle_event("reorder_images", %{"image_ids" => image_ids}, socket) when is_list(image_ids) do
    current_config = socket.assigns.widget_config
    current_images = current_config[:images] || []

    if length(image_ids) == length(current_images) do
      # Reorder images based on the provided order
      reordered_images = reorder_images_by_ids(image_ids, current_images)

      if length(reordered_images) == length(current_images) do
        updated_config = Map.put(current_config, :images, reordered_images)
        save_and_broadcast_config(socket, updated_config)

        # Create new event with reordered images to trigger Vue component update
        new_event = %{
          id: Streampai.Fake.Base.generate_hex_id(),
          type: "slider_update",
          images: reordered_images,
          timestamp: DateTime.utc_now()
        }

        socket =
          socket
          |> assign(:widget_config, updated_config)
          |> assign(:current_event, new_event)

        {:noreply, socket}
      else
        {:noreply, put_flash(socket, :error, "Some images could not be found for reordering")}
      end
    else
      {:noreply, put_flash(socket, :error, "Invalid reorder operation")}
    end
  end

  def handle_event("reorder_images", _params, socket) do
    {:noreply, put_flash(socket, :error, "Invalid reorder data")}
  end

  defp reorder_images_by_ids(image_ids, current_images) do
    image_ids
    |> Enum.with_index()
    |> Enum.map(fn {image_id, new_index} ->
      image = Enum.find(current_images, &(to_string(&1["id"]) == image_id))
      if image, do: Map.put(image, "index", new_index)
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp process_image_uploads(images, user) do
    {successes, errors} =
      images
      |> Enum.with_index()
      |> Enum.map(&process_single_image(&1, user))
      |> Enum.split_with(&match?({:ok, _}, &1))

    success_images = Enum.map(successes, fn {:ok, image} -> image end)
    error_messages = Enum.map(errors, fn {:error, msg} -> msg end)

    case error_messages do
      [] -> {:ok, success_images}
      _ -> {:error, error_messages}
    end
  end

  defp process_single_image({image_params, index}, user) do
    with {:ok, validated} <- validate_image_upload(image_params),
         {:ok, file_path} <- save_image_file(validated, user, index) do
      {:ok,
       %{
         "id" => Streampai.Fake.Base.generate_hex_id(),
         "url" => file_path,
         "alt" => validated.name,
         "index" => index
       }}
    end
  end

  defp validate_image_upload(%{"data" => data, "name" => name, "type" => type, "size" => size}) do
    with :ok <- validate_file_size(size, name),
         :ok <- validate_mime_type(type, name),
         :ok <- validate_filename(name),
         {:ok, decoded_data} <- validate_base64_data(data, name),
         :ok <- validate_image_content(decoded_data, name) do
      sanitized_name = sanitize_filename(name)
      {:ok, %{name: sanitized_name, data: data, type: type, size: size}}
    end
  end

  defp validate_image_upload(_), do: {:error, "Invalid image upload format"}

  defp validate_file_size(size, name) when size > 10_000_000 do
    {:error, "Image #{name} is too large (max 10MB)"}
  end

  defp validate_file_size(_size, _name), do: :ok

  defp validate_mime_type(type, name) do
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

    if type in allowed_types do
      :ok
    else
      {:error, "#{name} is not a supported image format (JPEG, PNG, GIF, WebP only)"}
    end
  end

  defp validate_filename(name) do
    if String.contains?(name, ["../", "..\\", "\0"]) or String.starts_with?(name, "/") do
      {:error, "Invalid filename: #{name}"}
    else
      :ok
    end
  end

  defp validate_base64_data(data, name) do
    case String.split(data, ",", parts: 2) do
      [_header, base64_data] ->
        case Base.decode64(base64_data) do
          {:ok, decoded} -> {:ok, decoded}
          :error -> {:error, "Invalid base64 data for #{name}"}
        end

      _ ->
        {:error, "Invalid data URL format for #{name}"}
    end
  end

  defp validate_image_content(binary_data, name) do
    case binary_data do
      <<0xFF, 0xD8, 0xFF, _rest::binary>> -> :ok
      <<0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, _rest::binary>> -> :ok
      <<"GIF87a", _rest::binary>> -> :ok
      <<"GIF89a", _rest::binary>> -> :ok
      <<"RIFF", _::32, "WEBP", _rest::binary>> -> :ok
      _ -> {:error, "#{name} does not appear to be a valid image file"}
    end
  end

  defp sanitize_filename(name) do
    name
    |> Path.basename()
    |> String.replace(~r/[^a-zA-Z0-9._-]/, "_")
    |> String.slice(0, 255)
  end

  defp save_image_file(%{data: data_url, name: sanitized_name}, user, index) do
    with {:ok, decoded_data} <- extract_base64_data(data_url),
         {:ok, filepath, url_path} <- generate_secure_filepath(sanitized_name, user, index),
         :ok <- write_file_safely(filepath, decoded_data) do
      {:ok, url_path}
    end
  end

  defp extract_base64_data(data_url) do
    case String.split(data_url, ",", parts: 2) do
      [_header, data] ->
        case Base.decode64(data) do
          {:ok, decoded} -> {:ok, decoded}
          :error -> {:error, "Failed to decode image data"}
        end

      _ ->
        {:error, "Invalid data URL format"}
    end
  end

  defp generate_secure_filepath(sanitized_name, user, index) do
    extension = Path.extname(sanitized_name)

    # Validate extension
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

    if String.downcase(extension) in allowed_extensions do
      timestamp = System.system_time(:millisecond)
      filename = "slider_#{user.id}_#{timestamp}_#{index}#{extension}"

      # Create slider images directory with secure permissions
      slider_dir = Path.join([Application.app_dir(:streampai), "priv", "static", "slider_images"])

      case File.mkdir_p(slider_dir) do
        :ok ->
          filepath = Path.join(slider_dir, filename)
          url_path = "/slider_images/#{filename}"
          {:ok, filepath, url_path}

        {:error, reason} ->
          {:error, "Failed to create directory: #{reason}"}
      end
    else
      {:error, "Invalid file extension"}
    end
  end

  defp write_file_safely(filepath, data) do
    case File.write(filepath, data) do
      :ok -> :ok
      {:error, reason} -> {:error, "Failed to save image: #{reason}"}
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Slider Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Slider Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:slider_widget}
          url_path={~p"/widgets/slider/display"}
          dimensions="800x450"
          copy_button_id="copy-slider-url-button"
          vue_component="SliderWidget"
          container_class="max-w-3xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-[500px] overflow-hidden"
        >
          <.vue
            v-component="SliderWidget"
            v-socket={@socket}
            config={@widget_config}
            event={@current_event}
            class="w-full h-full"
            id="preview-slider-widget"
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Image Upload Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Upload Images</h2>

          <div class="space-y-4">
            <!-- Upload Area -->
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div class="text-center">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <div class="mt-4">
                  <label for="file-upload" class="cursor-pointer">
                    <span class="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload images or drag and drop
                    </span>
                    <span class="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    class="sr-only"
                    phx-hook="SliderImageUpload"
                  />
                </div>
              </div>
            </div>
            
    <!-- Error Messages -->
            <%= if @image_upload_errors != [] do %>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 class="text-sm font-medium text-red-800">Upload Errors:</h3>
                <ul class="mt-2 list-disc list-inside text-sm text-red-700">
                  <%= for error <- @image_upload_errors do %>
                    <li>{error}</li>
                  <% end %>
                </ul>
              </div>
            <% end %>
            
    <!-- Current Images -->
            <%= if @widget_config[:images] && not Enum.empty?(@widget_config[:images]) do %>
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-3">
                  Current Images ({Enum.count(@widget_config[:images])})
                </h3>
                <div
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                  id="image-list"
                  phx-hook="SortableImages"
                >
                  <%= for image <- @widget_config[:images] do %>
                    <div class="relative group cursor-move" data-image-id={image["id"]}>
                      <img
                        src={image["url"]}
                        alt={image["alt"] || "Slider image"}
                        class="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                      />
                      <button
                        type="button"
                        phx-click="remove_image"
                        phx-value-image_id={image["id"]}
                        class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Remove image"
                      >
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                      <div class="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                        {(image["index"] || 0) + 1}
                      </div>
                    </div>
                  <% end %>
                </div>
                <p class="mt-2 text-sm text-gray-500">
                  <svg class="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                  </svg>
                  Drag images to reorder them
                </p>
              </div>
            <% end %>
          </div>
        </div>
        
    <!-- Slider Settings Form -->
        <form phx-change="update_settings" class="space-y-6">
          <!-- Timing Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Timing Settings</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  Slide Duration (seconds)
                </label>
                <input
                  type="number"
                  name="slide_duration"
                  value={@widget_config[:slide_duration]}
                  min="1"
                  max="60"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
                <p class="mt-1 text-xs text-gray-500">How long each image is displayed</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">
                  Transition Duration (milliseconds)
                </label>
                <input
                  type="number"
                  name="transition_duration"
                  value={@widget_config[:transition_duration]}
                  min="100"
                  max="3000"
                  step="100"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
                <p class="mt-1 text-xs text-gray-500">How long the transition between images takes</p>
              </div>
            </div>
          </div>
          
    <!-- Visual Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Visual Settings</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Transition Effect</label>
                <select
                  name="transition_type"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <%= for transition <- FakeSlider.transition_types() do %>
                    <option
                      value={transition.value}
                      selected={@widget_config[:transition_type] == transition.value}
                    >
                      {transition.label}
                    </option>
                  <% end %>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Image Fit Mode</label>
                <select
                  name="fit_mode"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <%= for fit_mode <- FakeSlider.fit_modes() do %>
                    <option
                      value={fit_mode.value}
                      selected={@widget_config[:fit_mode] == fit_mode.value}
                    >
                      {fit_mode.label}
                    </option>
                  <% end %>
                </select>
                <p class="mt-1 text-xs text-gray-500">
                  <%= case @widget_config[:fit_mode] do %>
                    <% "contain" -> %>
                      Scale image to fit within container
                    <% "cover" -> %>
                      Scale image to fill container, may crop parts
                    <% "fill" -> %>
                      Stretch image to fill container exactly
                    <% _ -> %>
                      Scale image to fit within container
                  <% end %>
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Background Color</label>
                <div class="mt-1 flex items-center space-x-3">
                  <input
                    type="color"
                    name="background_color"
                    value={@widget_config[:background_color] || "#000000"}
                    class="h-10 w-16 rounded border border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    name="background_color"
                    value={@widget_config[:background_color] || "transparent"}
                    placeholder="transparent or #000000"
                    class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
                <p class="mt-1 text-xs text-gray-500">Use "transparent" for OBS overlay</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </.dashboard_layout>
    """
  end
end
