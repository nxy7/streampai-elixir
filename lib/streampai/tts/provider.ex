defmodule Streampai.TTS.Provider do
  @moduledoc """
  Behaviour for TTS provider implementations.

  Each provider must implement functions to list available voices
  and generate TTS audio.

  ## Example Implementation

      defmodule MyApp.TTS.Providers.CustomProvider do
        @behaviour Streampai.TTS.Provider

        @impl true
        def name, do: :custom_provider

        @impl true
        def voices do
          [
            %{
              id: "custom_voice_1",
              name: "Custom Voice 1",
              provider: :custom_provider,
              voice_id: "cv1",
              language: "en"
            }
          ]
        end

        @impl true
        def generate(message, voice) do
          # Implementation
          {:ok, audio_binary}
        end

        @impl true
        def enabled? do
          not is_nil(Application.get_env(:my_app, :custom_api_key))
        end
      end
  """

  @type voice :: %{
          required(:id) => String.t(),
          required(:name) => String.t(),
          required(:provider) => atom(),
          required(:voice_id) => String.t(),
          required(:language) => String.t(),
          optional(:metadata) => map()
        }

  @doc """
  Returns the provider's name as an atom.
  """
  @callback name() :: atom()

  @doc """
  Returns a list of all voices available from this provider.
  """
  @callback voices() :: [voice()]

  @doc """
  Generates TTS audio for the given message using the specified voice.

  Returns {:ok, audio_binary} or {:error, reason}
  """
  @callback generate(message :: String.t(), voice :: voice()) ::
              {:ok, binary()} | {:error, term()}

  @doc """
  Checks if the provider is enabled (has required API keys, etc.).

  Returns true if the provider can be used, false otherwise.
  """
  @callback enabled?() :: boolean()

  @optional_callbacks [enabled?: 0]
end
