defmodule Streampai.Config do
  @moduledoc """
  Centralized configuration management for the Streampai application.

  This module provides a clean interface for accessing application configuration
  with proper defaults and validation. It helps avoid scattered `Application.get_env`
  calls throughout the codebase.
  """

  @doc """
  Streaming configuration values.
  """
  def streaming_config do
    %{
      processing_interval: get_env(:alert_processing_interval, 5000),
      max_queue_size: get_env(:max_alert_queue_size, 50),
      cloudflare_timeout: get_env(:cloudflare_timeout, 30_000),
      oauth_timeout: get_env(:oauth_timeout, 15_000)
    }
  end

  @doc """
  Database and performance configuration.
  """
  def database_config do
    %{
      pool_size: get_env(:pool_size, 10),
      timeout: get_env(:db_timeout, 15_000),
      queue_target: get_env(:queue_target, 5000),
      queue_interval: get_env(:queue_interval, 1000)
    }
  end

  @doc """
  Cache and memory management configuration.
  """
  def cache_config do
    %{
      chat_cache_ttl: get_env(:chat_cache_ttl, 300),
      error_retention_hours: get_env(:error_retention_hours, 48),
      max_error_count: get_env(:max_error_count, 1000),
      rate_limit_window: get_env(:rate_limit_window, 300_000),
      rate_limit_max_requests: get_env(:rate_limit_max_requests, 7)
    }
  end

  @doc """
  Security and authentication configuration.
  """
  def security_config do
    %{
      session_timeout: get_env(:session_timeout, 86_400),
      csrf_token_length: get_env(:csrf_token_length, 32),
      password_min_length: get_env(:password_min_length, 8),
      max_login_attempts: get_env(:max_login_attempts, 5),
      login_attempt_window: get_env(:login_attempt_window, 900)
    }
  end

  @doc """
  Background job and processing configuration.
  """
  def job_config do
    %{
      donation_queue_concurrency: get_env(:donation_queue_concurrency, 5),
      media_queue_concurrency: get_env(:media_queue_concurrency, 3),
      maintenance_queue_concurrency: get_env(:maintenance_queue_concurrency, 1),
      job_max_attempts: get_env(:job_max_attempts, 3),
      job_retry_backoff: get_env(:job_retry_backoff, :exponential)
    }
  end

  @doc """
  External service configuration.
  """
  def external_service_config do
    %{
      tts_service_timeout: get_env(:tts_service_timeout, 30_000),
      webhook_timeout: get_env(:webhook_timeout, 10_000),
      api_rate_limit: get_env(:api_rate_limit, 100),
      api_rate_limit_window: get_env(:api_rate_limit_window, 60_000)
    }
  end

  @doc """
  Development and debugging configuration.
  """
  def dev_config do
    %{
      enable_debug_logging: get_env(:enable_debug_logging, false),
      log_slow_queries: get_env(:log_slow_queries, true),
      slow_query_threshold: get_env(:slow_query_threshold, 2000),
      enable_profiling: get_env(:enable_profiling, false)
    }
  end

  @doc """
  Feature flag configuration.
  """
  def feature_flags do
    %{
      enable_tts: get_env(:enable_tts, true),
      enable_analytics: get_env(:enable_analytics, true),
      enable_premium_features: get_env(:enable_premium_features, true),
      enable_widget_caching: get_env(:enable_widget_caching, true),
      enable_error_tracking: get_env(:enable_error_tracking, true)
    }
  end

  @doc """
  Business logic configuration.
  """
  def business_config do
    %{
      free_tier_hour_limit: get_env(:free_tier_hour_limit, 10),
      max_widgets_per_user: get_env(:max_widgets_per_user, 20),
      max_platforms_free: get_env(:max_platforms_free, 1),
      max_platforms_pro: get_env(:max_platforms_pro, 99),
      premium_grace_period_days: get_env(:premium_grace_period_days, 7)
    }
  end

  @doc """
  Gets all configuration as a nested map for debugging.
  """
  def all_config do
    %{
      streaming: streaming_config(),
      database: database_config(),
      cache: cache_config(),
      security: security_config(),
      jobs: job_config(),
      external_services: external_service_config(),
      development: dev_config(),
      features: feature_flags(),
      business: business_config()
    }
  end

  @doc """
  Validates that all required configuration is present and valid.
  """
  def validate_config! do
    required_env_vars = [
      "SECRET_KEY_BASE",
      "DATABASE_URL"
    ]

    missing_vars =
      Enum.filter(required_env_vars, fn var ->
        System.get_env(var) in [nil, ""]
      end)

    if missing_vars != [] do
      raise """
      Missing required environment variables: #{Enum.join(missing_vars, ", ")}
      Please set these variables before starting the application.
      """
    end

    # Validate numeric configurations
    validate_positive_integer!(:alert_processing_interval, streaming_config().processing_interval)
    validate_positive_integer!(:max_alert_queue_size, streaming_config().max_queue_size)
    validate_positive_integer!(:pool_size, database_config().pool_size)

    :ok
  end

  # Private helper functions

  defp get_env(key, default) do
    Application.get_env(:streampai, key, default)
  end

  defp validate_positive_integer!(key, value) do
    if !(is_integer(value) and value > 0) do
      raise "Configuration #{key} must be a positive integer, got: #{inspect(value)}"
    end
  end

  @doc """
  Gets configuration specific to the current environment.
  """
  def env_config do
    case Application.get_env(:streampai, :env) do
      :prod -> prod_config()
      :test -> test_config()
      _ -> dev_config()
    end
  end

  defp prod_config do
    %{
      enable_debug_logging: false,
      log_slow_queries: true,
      slow_query_threshold: 5000,
      enable_profiling: false
    }
  end

  defp test_config do
    %{
      enable_debug_logging: false,
      log_slow_queries: false,
      slow_query_threshold: 10_000,
      enable_profiling: false
    }
  end
end
