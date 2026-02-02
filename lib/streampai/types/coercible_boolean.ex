defmodule Streampai.Types.CoercibleBoolean do
  @moduledoc """
  A boolean type that coerces PostgreSQL text representations.

  Electric SQL sends boolean values as "t"/"f" strings from PostgreSQL.
  The default Ash Boolean type doesn't accept these, causing cast errors
  during Electric shape sync.
  """
  use Ash.Type

  def typescript_type_name, do: "boolean"

  @impl Ash.Type
  def storage_type(_), do: :boolean

  @impl Ash.Type
  def cast_input(nil, _), do: {:ok, nil}
  def cast_input(value, _) when is_boolean(value), do: {:ok, value}
  def cast_input("t", _), do: {:ok, true}
  def cast_input("f", _), do: {:ok, false}
  def cast_input("true", _), do: {:ok, true}
  def cast_input("false", _), do: {:ok, false}
  def cast_input(1, _), do: {:ok, true}
  def cast_input(0, _), do: {:ok, false}
  def cast_input(_, _), do: :error

  @impl Ash.Type
  def cast_stored(nil, _), do: {:ok, nil}
  def cast_stored(value, _) when is_boolean(value), do: {:ok, value}
  def cast_stored("t", _), do: {:ok, true}
  def cast_stored("f", _), do: {:ok, false}
  def cast_stored("true", _), do: {:ok, true}
  def cast_stored("false", _), do: {:ok, false}
  def cast_stored(1, _), do: {:ok, true}
  def cast_stored(0, _), do: {:ok, false}
  def cast_stored(_, _), do: :error

  @impl Ash.Type
  def dump_to_native(nil, _), do: {:ok, nil}
  def dump_to_native(value, _) when is_boolean(value), do: {:ok, value}
  def dump_to_native(_, _), do: :error
end
