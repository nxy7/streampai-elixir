defmodule Streampai.LivestreamManager.HookActions.Template do
  @moduledoc """
  Simple `{{variable}}` interpolation for hook action templates.
  """

  @doc """
  Interpolates `{{variable}}` placeholders in a template string using event data.

  Returns the template with all known variables replaced. Unknown variables
  are left as-is.
  """
  @spec interpolate(String.t(), map()) :: String.t()
  def interpolate(template, variables) when is_binary(template) and is_map(variables) do
    Regex.replace(~r/\{\{(\w+)\}\}/, template, fn _match, key ->
      case Map.get(variables, key) do
        nil -> "{{#{key}}}"
        value -> to_string(value)
      end
    end)
  end

  @doc """
  Extracts template variables from a stream event.
  """
  @spec extract_variables(map()) :: map()
  def extract_variables(event) do
    data = extract_data(event)

    %{
      "username" => data[:username] || data[:donor_name] || data[:raider_name] || "",
      "message" => data[:message] || data[:comment] || "",
      "amount" => to_string(data[:amount] || ""),
      "currency" => to_string(data[:currency] || ""),
      "platform" => to_string(event[:platform] || event["platform"] || ""),
      "viewer_count" => to_string(data[:viewer_count] || ""),
      "event_type" => to_string(event[:type] || event["type"] || "")
    }
  end

  defp extract_data(%{data: %Ash.Union{value: value}}) when is_struct(value) do
    Map.from_struct(value)
  end

  defp extract_data(%{data: %Ash.Union{value: value}}) when is_map(value), do: value
  defp extract_data(%{data: data}) when is_map(data), do: data
  defp extract_data(%{"data" => data}) when is_map(data), do: data
  defp extract_data(_), do: %{}
end
