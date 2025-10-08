defmodule Streampai.Stream.StreamAction do
  @moduledoc """
  Ash resource for stream management actions.

  This is a stateless resource (no database storage) that provides
  authorization-aware actions for controlling live streams. It delegates
  to the LivestreamManager GenServer processes while enforcing policies.

  All actions require an actor and validate permissions before executing.
  """
  use Ash.Resource,
    domain: Streampai.Stream,
    data_layer: :embedded,
    authorizers: [Ash.Policy.Authorizer]

  alias Streampai.LivestreamManager.UserStreamManager
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwner
  alias Streampai.Stream.StreamAction.Checks.IsStreamOwnerOrModerator

  code_interface do
    define :start_stream
    define :stop_stream
    define :update_stream_metadata
    define :send_message
    define :ban_user
    define :unban_user
    define :timeout_user
  end

  actions do
    defaults []

    action :start_stream, :map do
      description "Start streaming on all connected platforms"

      argument :user_id, :uuid, allow_nil?: false
      argument :title, :string, allow_nil?: true
      argument :description, :string, allow_nil?: true
      argument :metadata, :map, default: %{}

      run fn input, _context ->
        user_id = input.arguments.user_id
        args = input.arguments

        metadata =
          args.metadata
          |> maybe_put(:title, Map.get(args, :title))
          |> maybe_put(:description, Map.get(args, :description))

        case UserStreamManager.start_stream(user_id, metadata) do
          {:ok, stream_uuid} ->
            {:ok,
             %{
               success: true,
               stream_uuid: stream_uuid,
               message: "Stream started successfully"
             }}

          {:error, reason} ->
            {:error, reason}
        end
      end
    end

    action :stop_stream, :map do
      description "Stop streaming on all platforms"

      argument :user_id, :uuid, allow_nil?: false

      run fn input, _context ->
        user_id = input.arguments.user_id

        case UserStreamManager.stop_stream(user_id) do
          :ok ->
            {:ok, %{success: true, message: "Stream stopped successfully"}}

          {:error, reason} ->
            {:error, reason}
        end
      end
    end

    action :update_stream_metadata, :map do
      description "Update stream title, description, or other metadata"

      argument :user_id, :uuid, allow_nil?: false
      argument :title, :string, allow_nil?: true
      argument :description, :string, allow_nil?: true
      argument :platforms, {:array, :atom}, default: [:all]

      run fn input, _context ->
        user_id = input.arguments.user_id
        platforms = input.arguments.platforms
        args = input.arguments

        metadata =
          %{}
          |> maybe_put(:title, Map.get(args, :title))
          |> maybe_put(:description, Map.get(args, :description))

        if map_size(metadata) == 0 do
          {:error, "No metadata provided to update"}
        else
          case UserStreamManager.update_stream_metadata(
                 user_id,
                 metadata,
                 platforms
               ) do
            :ok ->
              {:ok, %{success: true, message: "Metadata updated successfully"}}

            {:error, reason} ->
              {:error, reason}
          end
        end
      end
    end

    action :send_message, :map do
      description "Send a chat message to stream platforms"

      argument :user_id, :uuid, allow_nil?: false
      argument :message, :string, allow_nil?: false
      argument :platforms, {:array, :atom}, default: [:all]

      run fn input, _context ->
        user_id = input.arguments.user_id
        message = input.arguments.message
        platforms = input.arguments.platforms

        case UserStreamManager.send_chat_message(
               user_id,
               message,
               platforms
             ) do
          :ok ->
            {:ok, %{success: true, message: "Message sent successfully"}}

          {:error, reason} ->
            {:error, reason}
        end
      end
    end

    action :ban_user, :map do
      description "Ban a user from the stream chat"

      argument :user_id, :uuid, allow_nil?: false
      argument :target_username, :string, allow_nil?: false
      argument :platform, :atom, allow_nil?: false
      argument :reason, :string, allow_nil?: true

      run fn _input, _context ->
        # TODO: Implement ban_user in PlatformSupervisor
        # user_id = input.arguments.user_id
        # platform = input.arguments.platform
        # username = input.arguments.target_username
        {:error, "ban_user not yet implemented in PlatformSupervisor"}
      end
    end

    action :unban_user, :map do
      description "Unban a user from the stream chat"

      argument :user_id, :uuid, allow_nil?: false
      argument :target_username, :string, allow_nil?: false
      argument :platform, :atom, allow_nil?: false

      run fn _input, _context ->
        # TODO: Implement unban_user in PlatformSupervisor
        {:error, "unban_user not yet implemented in PlatformSupervisor"}
      end
    end

    action :timeout_user, :map do
      description "Timeout a user from the stream chat for a specified duration"

      argument :user_id, :uuid, allow_nil?: false
      argument :target_username, :string, allow_nil?: false
      argument :platform, :atom, allow_nil?: false
      argument :duration_seconds, :integer, allow_nil?: false

      run fn _input, _context ->
        # TODO: Implement timeout_user in PlatformSupervisor
        {:error, "timeout_user not yet implemented in PlatformSupervisor"}
      end
    end
  end

  policies do
    bypass AshOban.Checks.AshObanInteraction do
      authorize_if always()
    end

    policy action(:start_stream) do
      description "Only the stream owner can start their stream"
      authorize_if IsStreamOwner
      access_type :strict
    end

    policy action(:stop_stream) do
      description "Only the stream owner can stop their stream"
      authorize_if IsStreamOwner
      access_type :strict
    end

    policy action(:update_stream_metadata) do
      description "Stream owner and moderators can update metadata"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:send_message) do
      description "Stream owner and moderators can send messages"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:ban_user) do
      description "Stream owner and moderators can ban users"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:unban_user) do
      description "Stream owner and moderators can unban users"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end

    policy action(:timeout_user) do
      description "Stream owner and moderators can timeout users"
      authorize_if IsStreamOwnerOrModerator
      access_type :strict
    end
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
