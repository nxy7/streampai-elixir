defmodule StreampaiWeb.Utils.CacheUtils do
  @moduledoc """
  ETS-based caching utilities for LiveView data.
  Provides consistent caching patterns across the application.
  """

  @doc """
  Gets cached data from an ETS table with expiration checking.

  ## Examples

      iex> get_cached(:stream_cache, :streams, 300, fn -> generate_streams() end)
      [%Stream{}, ...]
  """
  def get_cached(cache_name, key, ttl_seconds, generator_fn) do
    ensure_cache_table(cache_name)

    case :ets.lookup(cache_name, key) do
      [{^key, data, timestamp}] ->
        if expired?(timestamp, ttl_seconds) do
          regenerate_and_cache(cache_name, key, generator_fn)
        else
          data
        end

      [] ->
        regenerate_and_cache(cache_name, key, generator_fn)
    end
  end

  @doc """
  Stores data in an ETS cache with timestamp.

  ## Examples

      iex> put_cached(:stream_cache, :streams, data)
      :ok
  """
  def put_cached(cache_name, key, data) do
    ensure_cache_table(cache_name)
    :ets.insert(cache_name, {key, data, DateTime.utc_now()})
    :ok
  end

  @doc """
  Invalidates a specific cache entry.

  ## Examples

      iex> invalidate_cache(:stream_cache, :streams)
      :ok
  """
  def invalidate_cache(cache_name, key) do
    ensure_cache_table(cache_name)
    :ets.delete(cache_name, key)
    :ok
  end

  @doc """
  Clears all entries from a cache table.

  ## Examples

      iex> clear_cache(:stream_cache)
      :ok
  """
  def clear_cache(cache_name) do
    ensure_cache_table(cache_name)
    :ets.delete_all_objects(cache_name)
    :ok
  end

  @doc """
  Gets cached data with a custom expiration check function.

  ## Examples

      iex> get_cached_with_check(:cache, :key, fn timestamp -> check_expired(timestamp) end, fn -> generate() end)
      data
  """
  def get_cached_with_check(cache_name, key, expiry_check_fn, generator_fn) do
    ensure_cache_table(cache_name)

    case :ets.lookup(cache_name, key) do
      [{^key, data, timestamp}] ->
        if expiry_check_fn.(timestamp) do
          regenerate_and_cache(cache_name, key, generator_fn)
        else
          data
        end

      [] ->
        regenerate_and_cache(cache_name, key, generator_fn)
    end
  end

  # Private functions

  defp ensure_cache_table(cache_name) do
    if :ets.whereis(cache_name) == :undefined do
      :ets.new(cache_name, [:set, :public, :named_table])
    end
  end

  defp expired?(timestamp, ttl_seconds) do
    DateTime.diff(DateTime.utc_now(), timestamp, :second) >= ttl_seconds
  end

  defp regenerate_and_cache(cache_name, key, generator_fn) do
    data = generator_fn.()
    :ets.insert(cache_name, {key, data, DateTime.utc_now()})
    data
  end

  @doc """
  Creates a cache helper function for a specific cache table and TTL.

  ## Examples

      # In your LiveView module:
      defp get_cached_streams do
        CacheUtils.cached_helper(:stream_cache, :streams, 300, fn ->
          Livestream.generate_stream_history(15)
        end)
      end
  """
  def cached_helper(cache_name, key, ttl_seconds, generator_fn) do
    get_cached(cache_name, key, ttl_seconds, generator_fn)
  end
end
