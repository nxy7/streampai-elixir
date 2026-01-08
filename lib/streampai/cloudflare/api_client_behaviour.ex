defmodule Streampai.Cloudflare.APIClientBehaviour do
  @moduledoc """
  Behaviour definition for Cloudflare API client.

  This allows for dependency injection and mocking in tests using Mox.
  """

  @doc """
  Creates a new live input for streaming.
  """
  @callback create_live_input(user_id :: String.t(), opts :: map()) ::
              {:ok, map()} | {:error, atom(), String.t()}

  @doc """
  Gets a live input by ID.
  """
  @callback get_live_input(input_id :: String.t()) ::
              {:ok, map()} | {:error, atom(), String.t()} | {:error, atom()}

  @doc """
  Deletes a live input.
  """
  @callback delete_live_input(input_id :: String.t()) ::
              :ok | {:error, atom(), String.t()}

  @doc """
  Lists all live inputs for the account.
  """
  @callback list_live_inputs(opts :: keyword()) ::
              {:ok, list(map()), integer()} | {:error, atom(), String.t()}

  @doc """
  Creates a live output for a platform.
  """
  @callback create_live_output(input_id :: String.t(), output_config :: map()) ::
              {:ok, map()} | {:error, atom(), String.t()}

  @doc """
  Gets a live output by ID.
  """
  @callback get_live_output(input_uid :: String.t(), output_id :: String.t()) ::
              {:ok, map()} | {:error, atom(), String.t()}

  @doc """
  Lists all live outputs for a given input.
  """
  @callback list_live_outputs(input_uid :: String.t()) ::
              {:ok, list(map())} | {:error, atom(), String.t()}

  @doc """
  Toggles live output enabled/disabled state.
  """
  @callback toggle_live_output(
              input_uid :: String.t(),
              output_id :: String.t(),
              enabled :: boolean()
            ) ::
              {:ok, map()} | {:error, atom(), String.t()}

  @doc """
  Deletes a live output.
  """
  @callback delete_live_output(input_uid :: String.t(), output_id :: String.t()) ::
              :ok | {:error, atom(), String.t()}

  @doc """
  Lists videos from Cloudflare Stream.
  """
  @callback list_videos(opts :: keyword()) ::
              {:ok, list(map()), integer()} | {:error, atom(), String.t()}

  @doc """
  Deletes a video from Cloudflare Stream.
  """
  @callback delete_video(video_id :: String.t()) ::
              :ok | {:error, atom(), String.t()}
end
