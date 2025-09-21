defmodule StreampaiWeb.Utils.FakeSlider do
  @moduledoc """
  Utility module for generating fake slider widget data and providing default configuration.
  """

  alias Streampai.Fake.Base

  @sample_images [
    "https://picsum.photos/800/450?random=1",
    "https://picsum.photos/800/450?random=2",
    "https://picsum.photos/800/450?random=3",
    "https://picsum.photos/800/450?random=4",
    "https://picsum.photos/800/450?random=5",
    "https://picsum.photos/800/450?random=6",
    "https://picsum.photos/800/450?random=7",
    "https://picsum.photos/800/450?random=8"
  ]

  @doc """
  Returns default configuration for the slider widget.
  """
  def default_config do
    %{
      slide_duration: 5,
      transition_duration: 500,
      transition_type: "fade",
      fit_mode: "contain",
      background_color: "transparent",
      images: []
    }
  end

  @doc """
  Generates a fake slider event with sample images.
  """
  def generate_event do
    %{
      id: Base.generate_hex_id(),
      type: "slider_update",
      images: generate_sample_images(:rand.uniform(5) + 2),
      timestamp: DateTime.utc_now()
    }
  end

  @doc """
  Generates sample images for preview/demo purposes.
  """
  def generate_sample_images(count \\ 3) do
    @sample_images
    |> Enum.shuffle()
    |> Enum.take(count)
    |> Enum.with_index()
    |> Enum.map(fn {url, index} ->
      %{
        "id" => Base.generate_hex_id(),
        "url" => url,
        "alt" => "Sample Image #{index + 1}",
        "index" => index
      }
    end)
  end

  @doc """
  Returns available transition types for the slider.
  """
  def transition_types do
    [
      %{value: "fade", label: "Fade"},
      %{value: "slide", label: "Slide Left"},
      %{value: "slide-up", label: "Slide Up"},
      %{value: "zoom", label: "Zoom"},
      %{value: "flip", label: "Flip"}
    ]
  end

  @doc """
  Returns available image fit modes.
  """
  def fit_modes do
    [
      %{
        value: "contain",
        label: "Fit (Contain)",
        description: "Scale image to fit within container"
      },
      %{
        value: "cover",
        label: "Fill (Cover)",
        description: "Scale image to fill container, may crop"
      },
      %{
        value: "fill",
        label: "Stretch (Fill)",
        description: "Stretch image to fill container exactly"
      }
    ]
  end

  @doc """
  Validates slider configuration values.
  """
  def validate_config(config) do
    errors = []

    errors = validate_slide_duration(config[:slide_duration], errors)
    errors = validate_transition_duration(config[:transition_duration], errors)
    errors = validate_transition_type(config[:transition_type], errors)
    errors = validate_fit_mode(config[:fit_mode], errors)
    errors = validate_images(config[:images], errors)

    case errors do
      [] -> {:ok, config}
      _ -> {:error, errors}
    end
  end

  defp validate_slide_duration(duration, errors) when is_integer(duration) and duration >= 1 and duration <= 60 do
    errors
  end

  defp validate_slide_duration(_, errors) do
    ["Slide duration must be between 1 and 60 seconds" | errors]
  end

  defp validate_transition_duration(duration, errors)
       when is_integer(duration) and duration >= 100 and duration <= 3000 do
    errors
  end

  defp validate_transition_duration(_, errors) do
    ["Transition duration must be between 100 and 3000 milliseconds" | errors]
  end

  defp validate_transition_type(type, errors) do
    valid_types = Enum.map(transition_types(), & &1.value)

    if type in valid_types do
      errors
    else
      ["Invalid transition type. Must be one of: #{Enum.join(valid_types, ", ")}" | errors]
    end
  end

  defp validate_fit_mode(mode, errors) do
    valid_modes = Enum.map(fit_modes(), & &1.value)

    if mode in valid_modes do
      errors
    else
      ["Invalid fit mode. Must be one of: #{Enum.join(valid_modes, ", ")}" | errors]
    end
  end

  defp validate_images(images, errors) when is_list(images) do
    if length(images) <= 20 do
      errors
    else
      ["Maximum of 20 images allowed" | errors]
    end
  end

  defp validate_images(nil, errors), do: errors

  defp validate_images(_, errors) do
    ["Images must be a list" | errors]
  end
end
