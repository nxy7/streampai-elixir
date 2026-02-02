defmodule Streampai.Types.CoercibleString do
  @moduledoc """
  A string type that coerces integers to strings.

  This is useful for fields like `viewer_id` where external systems (e.g., Twitch)
  return numeric IDs that may be parsed as integers by Electric SQL during sync,
  but should be stored and handled as strings.
  """
  use Ash.Type

  def typescript_type_name, do: "string"

  @impl Ash.Type
  def storage_type(_), do: :string

  @impl Ash.Type
  def cast_input(nil, _), do: {:ok, nil}
  def cast_input(value, _) when is_binary(value), do: {:ok, value}
  def cast_input(value, _) when is_integer(value), do: {:ok, Integer.to_string(value)}
  def cast_input(value, _) when is_float(value), do: {:ok, Float.to_string(value)}

  def cast_input(value, _) when is_atom(value) and not is_nil(value), do: {:ok, Atom.to_string(value)}

  def cast_input(_, _), do: :error

  @impl Ash.Type
  def cast_stored(nil, _), do: {:ok, nil}
  def cast_stored(value, _) when is_binary(value), do: {:ok, value}
  def cast_stored(value, _) when is_integer(value), do: {:ok, Integer.to_string(value)}
  def cast_stored(value, _) when is_float(value), do: {:ok, Float.to_string(value)}
  def cast_stored(_, _), do: :error

  @impl Ash.Type
  def dump_to_native(nil, _), do: {:ok, nil}
  def dump_to_native(value, _) when is_binary(value), do: {:ok, value}
  def dump_to_native(value, _) when is_integer(value), do: {:ok, Integer.to_string(value)}
  def dump_to_native(_, _), do: :error
end
