defmodule StreampaiWeb.WidgetSettingsComponents do
  @moduledoc """
  Shared components for widget settings pages to reduce template duplication
  and ensure consistent styling across all widget configuration interfaces.
  """
  use StreampaiWeb, :verified_routes
  use Phoenix.Component

  attr(:title, :string, required: true)
  attr(:current_user, :map, required: true)
  attr(:socket, :map, required: true)
  attr(:widget_type, :atom, required: true)
  attr(:url_path, :string, required: true)
  attr(:dimensions, :string, default: "400x600")
  attr(:copy_button_id, :string, required: true)

  def widget_preview_header(assigns) do
    ~H"""
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">{@title} Preview</h3>
      <div class="flex items-center space-x-2">
        <button
          id={@copy_button_id}
          class="text-sm text-purple-600 hover:text-purple-700 font-medium"
          phx-hook="CopyToClipboard"
          data-clipboard-text={unverified_url(@socket, @url_path, user_id: @current_user.id)}
          data-clipboard-message="Browser source URL copied!"
        >
          Copy Browser Source URL
        </button>
        <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
          Configure
        </button>
      </div>
    </div>
    """
  end

  attr(:title, :string, required: true)
  attr(:current_user, :map, required: true)
  attr(:socket, :map, required: true)
  attr(:widget_type, :atom, required: true)
  attr(:url_path, :string, required: true)
  attr(:dimensions, :string, default: "400x600")
  attr(:copy_button_id, :string, required: true)
  attr(:vue_component, :string, required: true)
  attr(:preview_class, :string, default: nil)
  attr(:container_class, :string, default: nil)
  slot(:inner_block, required: true)

  def widget_preview(assigns) do
    # Set default container class based on dimensions for common cases
    default_container_class =
      case assigns.dimensions do
        "400x600" ->
          "max-w-md mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-96 overflow-hidden"

        "800x600" ->
          "max-w-2xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-[32rem] overflow-hidden relative"

        "400x200" ->
          "w-full max-w-4xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 mt-4 min-h-[400px]"

        _ ->
          "mx-auto bg-gray-900 border border-gray-200 rounded p-4 overflow-hidden"
      end

    assigns =
      assign(assigns, :final_container_class, assigns.container_class || default_container_class)

    ~H"""
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <.widget_preview_header
        title={@title}
        current_user={@current_user}
        socket={@socket}
        widget_type={@widget_type}
        url_path={@url_path}
        dimensions={@dimensions}
        copy_button_id={@copy_button_id}
      />

      <div class={@final_container_class}>
        <div class="text-xs text-gray-400 mb-2">
          Preview (actual widget has transparent background)
        </div>
        <div class={@preview_class || "w-full h-full"}>
          {render_slot(@inner_block)}
        </div>
      </div>
    </div>
    """
  end

  attr(:title, :string, required: true)
  attr(:socket, :map, required: true)
  attr(:url_path, :string, required: true)
  attr(:current_user, :map, required: true)
  attr(:dimensions, :string, required: true)
  attr(:instructions, :list, default: [])

  def obs_usage_instructions(assigns) do
    default_instructions = [
      "Copy the browser source URL above",
      "In OBS, add a \"Browser Source\"",
      "Paste the URL and set dimensions to #{assigns.dimensions}",
      "Position the widget on your stream layout"
    ]

    assigns = assign(assigns, :final_instructions, assigns.instructions ++ default_instructions)

    ~H"""
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 class="text-lg font-medium text-blue-900 mb-4">How to use in OBS</h3>
      <div class="space-y-2 text-sm text-blue-800">
        <%= for {instruction, index} <- Enum.with_index(@final_instructions, 1) do %>
          <p><strong>{index}.</strong> {instruction}</p>
        <% end %>
      </div>

      <div class="mt-4 p-3 bg-white border border-blue-200 rounded">
        <p class="text-xs text-gray-600 font-mono break-all">
          {unverified_url(@socket, @url_path, user_id: @current_user.id)}
        </p>
      </div>
    </div>
    """
  end

  attr(:title, :string, required: true)
  slot(:inner_block, required: true)

  def settings_section(assigns) do
    ~H"""
    <div class="space-y-4">
      <h4 class="font-medium text-gray-700">{@title}</h4>
      <div class="space-y-3">
        {render_slot(@inner_block)}
      </div>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:label, :string, required: true)
  attr(:checked, :boolean, required: true)

  def checkbox_setting(assigns) do
    ~H"""
    <label class="flex items-center">
      <input
        type="checkbox"
        name={@name}
        class="rounded border-gray-300 text-purple-600"
        checked={@checked}
      />
      <span class="ml-2 text-sm text-gray-700">{@label}</span>
    </label>
    """
  end

  attr(:name, :string, required: true)
  attr(:label, :string, required: true)
  attr(:value, :any, required: true)
  attr(:min, :integer, default: nil)
  attr(:max, :integer, default: nil)
  attr(:help_text, :string, default: nil)

  def number_input_setting(assigns) do
    ~H"""
    <div>
      <label class="block text-sm text-gray-700 mb-1">{@label}</label>
      <input
        type="number"
        name={@name}
        value={@value}
        min={@min}
        max={@max}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
      />
      <%= if @help_text do %>
        <p class="text-xs text-gray-500 mt-1">{@help_text}</p>
      <% end %>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:label, :string, required: true)
  attr(:value, :string, required: true)
  attr(:placeholder, :string, default: "")
  attr(:help_text, :string, default: nil)

  def text_input_setting(assigns) do
    ~H"""
    <div>
      <label class="block text-sm text-gray-700 mb-1">{@label}</label>
      <input
        type="text"
        name={@name}
        value={@value}
        placeholder={@placeholder}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
      />
      <%= if @help_text do %>
        <p class="text-xs text-gray-500 mt-1">{@help_text}</p>
      <% end %>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:label, :string, required: true)
  attr(:value, :any, required: true)
  attr(:options, :list, required: true)

  def select_setting(assigns) do
    ~H"""
    <div>
      <label class="block text-sm text-gray-700 mb-1">{@label}</label>
      <select
        name={@name}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
      >
        <%= for {option_value, option_label} <- @options do %>
          <option value={option_value} selected={@value == option_value}>
            {option_label}
          </option>
        <% end %>
      </select>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:label, :string, required: true)
  attr(:value, :integer, required: true)
  attr(:min, :integer, default: 0)
  attr(:max, :integer, default: 100)

  def range_setting(assigns) do
    ~H"""
    <div>
      <label class="block text-sm text-gray-700 mb-1">{@label}</label>
      <input
        type="range"
        name={@name}
        value={@value}
        min={@min}
        max={@max}
        class="w-full"
      />
      <p class="text-xs text-gray-500 mt-1">{@label}: {@value}%</p>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:label, :string, required: true)
  attr(:value, :string, required: true)
  attr(:default_color, :string, default: "#6b46c1")

  def color_picker_setting(assigns) do
    ~H"""
    <div>
      <label for={@name} class="block text-sm font-medium text-gray-700 mb-1">
        {@label}
      </label>
      <div class="flex items-center space-x-2">
        <input
          type="color"
          name={"#{@name}_picker"}
          id={@name}
          value={@value}
          class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={@value}
          name={"#{@name}_text"}
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          pattern="^#[0-9A-Fa-f]{6}$"
          placeholder={@default_color}
        />
      </div>
    </div>
    """
  end

  attr(:widget_config, :map, required: true)
  slot(:inner_block, required: true)

  def settings_container(assigns) do
    ~H"""
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Widget Settings</h3>
      <form id="widget-config-form" phx-change="update_settings" phx-hook="ColorPickerSync">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {render_slot(@inner_block)}
        </div>
      </form>
    </div>
    """
  end
end
