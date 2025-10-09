defmodule StreampaiWeb.DashboardStreamLive do
  @moduledoc false
  use StreampaiWeb.BaseLive

  import StreampaiWeb.LiveHelpers

  alias Ash.Error.Forbidden
  alias Streampai.Dashboard
  alias Streampai.LivestreamManager.CloudflareManager
  alias Streampai.Storage.Adapters.S3
  alias Streampai.Stream.Livestream
  alias Streampai.Stream.StreamAction

  require Logger

  @max_chat_messages 50
  @max_stream_events 20

  def mount_page(socket, _params, _session) do
    user_id = socket.assigns.current_user.id

    # Ensure UserStreamManager exists (but don't create new stream)
    Streampai.LivestreamManager.start_user_stream(user_id)

    platform_connections = Dashboard.get_platform_connections(socket.assigns.current_user)

    stream_status = get_stream_status(user_id)

    if Phoenix.LiveView.connected?(socket) do
      subscribe_to_stream_channels(user_id)
    end

    stream_data = load_stream_data(user_id, stream_status)
    stream_metadata = load_last_stream_metadata(user_id)

    # Load recent chat messages and events if streaming
    {chat_messages, stream_events} = load_recent_activity_if_streaming(user_id, stream_status)

    socket =
      socket
      |> assign(:platform_connections, platform_connections)
      |> assign(:page_title, "Stream")
      |> assign(:stream_status, stream_status)
      |> assign(:loading, false)
      |> assign(:show_stream_key, false)
      |> assign(:stream_metadata, stream_metadata)
      |> assign(:stream_data, stream_data)
      |> assign(:chat_messages, chat_messages)
      |> assign(:stream_events, stream_events)

    {:ok, socket, layout: false}
  end

  def handle_event("start_streaming", _params, %{assigns: %{stream_status: %{manager_available: false}}} = socket) do
    socket =
      put_flash(
        socket,
        :error,
        "Streaming services not yet available. Please wait a moment and try again."
      )

    {:noreply, socket}
  end

  def handle_event("start_streaming", _params, socket) do
    user_id = socket.assigns.current_user.id
    metadata = socket.assigns.stream_metadata
    socket = assign(socket, :loading, true)

    # Check if there's a selected thumbnail that needs to be uploaded
    case socket.assigns[:selected_thumbnail_file] do
      nil ->
        # No thumbnail selected, start stream immediately
        start_stream_with_metadata(socket, user_id, metadata)

      file_info ->
        # Upload thumbnail first, then start stream
        upload_thumbnail_and_start_stream(socket, user_id, metadata, file_info)
    end
  end

  def handle_event("stop_streaming", _params, %{assigns: %{stream_status: %{manager_available: false}}} = socket) do
    socket = handle_error(socket, :timeout, "Streaming services not available.")
    {:noreply, socket}
  end

  def handle_event("stop_streaming", _params, socket) do
    user_id = socket.assigns.current_user.id
    socket = assign(socket, :loading, true)

    case StreamAction.stop_stream(
           %{user_id: user_id},
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:info, "Stream stopped successfully")

        {:noreply, socket}

      {:error, %Forbidden{}} ->
        Logger.error("Authorization failed for user #{user_id}")

        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:error, "Not authorized to stop stream")

        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to stop stream for user #{user_id}: #{inspect(reason)}")

        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:error, "Failed to stop stream. Please try again later.")

        {:noreply, socket}
    end
  end

  def handle_event("toggle_stream_key_visibility", _params, socket) do
    {:noreply, assign(socket, :show_stream_key, !socket.assigns.show_stream_key)}
  end

  def handle_event("update_stream_metadata", %{"metadata" => metadata_params}, socket) do
    metadata =
      socket.assigns.stream_metadata
      |> Map.put(:title, Map.get(metadata_params, "title", ""))
      |> Map.put(:description, Map.get(metadata_params, "description", ""))

    {:noreply, assign(socket, :stream_metadata, metadata)}
  end

  def handle_event("update_stream_metadata", metadata_params, socket) when is_map(metadata_params) do
    metadata =
      socket.assigns.stream_metadata
      |> Map.put(:title, Map.get(metadata_params, "title", ""))
      |> Map.put(:description, Map.get(metadata_params, "description", ""))

    {:noreply, assign(socket, :stream_metadata, metadata)}
  end

  def handle_event("thumbnail_upload_complete", %{"file_id" => file_id}, socket) do
    # Thumbnail upload completed, trigger stream start
    send(self(), {:thumbnail_upload_complete, file_id})
    {:noreply, socket}
  end

  def handle_event("file_upload_complete", %{"file_id" => file_id}, socket) do
    # Update stream metadata with the new thumbnail file ID
    metadata = Map.put(socket.assigns.stream_metadata, :thumbnail_file_id, file_id)

    # Reload the metadata to get the thumbnail URL
    user_id = socket.assigns.current_user.id
    updated_metadata = load_last_stream_metadata(user_id)

    {:noreply, assign(socket, :stream_metadata, Map.merge(metadata, updated_metadata))}
  end

  def handle_event("settings_thumbnail_upload_complete", %{"file_id" => file_id}, socket) do
    # Settings thumbnail upload completed, trigger settings save
    send(self(), {:settings_thumbnail_upload_complete, file_id})
    {:noreply, socket}
  end

  def handle_event("settings_thumbnail_file_selected", file_params, socket) do
    Logger.info("Phoenix: Received settings_thumbnail_file_selected event with params: #{inspect(file_params)}")

    # Store thumbnail file info for later upload when user saves settings
    file_info = %{
      name: file_params["name"],
      size: file_params["size"],
      type: file_params["type"]
    }

    Logger.info("Phoenix: Storing selected_thumbnail_file: #{inspect(file_info)}")
    {:noreply, assign(socket, :selected_thumbnail_file, file_info)}
  end

  # Delegate other events to BaseLive
  def handle_event("regenerate_stream_key", _params, socket) do
    user_id = socket.assigns.current_user.id

    case CloudflareManager.regenerate_live_input(user_id) do
      {:ok, _stream_config} ->
        # Get the full stream status with all required fields
        stream_status = get_stream_status(user_id)

        socket =
          socket
          |> assign(:stream_status, stream_status)
          |> put_flash(:info, "Stream key regenerated successfully")

        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to regenerate stream key: #{inspect(reason)}")

        socket = put_flash(socket, :error, "Failed to regenerate stream key")

        {:noreply, socket}
    end
  end

  # Delegate other events to BaseLive
  def handle_event(event, params, socket) do
    super(event, params, socket)
  end

  def handle_info({event_type, _event}, socket)
      when event_type in [
             :stream_status_changed,
             :stream_auto_stopped,
             :input_streaming_started,
             :input_streaming_stopped
           ] do
    user_id = socket.assigns.current_user.id
    stream_status = get_stream_status(user_id)
    stream_data = load_stream_data(user_id, stream_status)

    socket =
      socket
      |> assign(:stream_status, stream_status)
      |> assign(:stream_data, stream_data)

    {:noreply, socket}
  end

  def handle_info({:toggle_stream_key_visibility}, socket) do
    {:noreply, assign(socket, :show_stream_key, !socket.assigns.show_stream_key)}
  end

  def handle_info({:update_stream_metadata, %{"metadata" => metadata_params}}, socket) do
    metadata =
      socket.assigns.stream_metadata
      |> Map.put(:title, Map.get(metadata_params, "title", ""))
      |> Map.put(:description, Map.get(metadata_params, "description", ""))

    {:noreply, assign(socket, :stream_metadata, metadata)}
  end

  def handle_info({:start_streaming, _params}, socket) do
    handle_event("start_streaming", %{}, socket)
  end

  def handle_info({:stop_streaming, _params}, socket) do
    handle_event("stop_streaming", %{}, socket)
  end

  def handle_info({:save_settings, params}, socket) do
    Logger.info("handle_info save_settings called with params: #{inspect(params)}")
    user_id = socket.assigns.current_user.id

    selected_thumbnail = socket.assigns[:selected_thumbnail_file]
    Logger.info("Phoenix: selected_thumbnail_file is: #{inspect(selected_thumbnail)}")

    # Check if there's a selected thumbnail that needs to be uploaded
    case selected_thumbnail do
      nil ->
        Logger.info("Phoenix: No thumbnail selected, saving without upload")
        # No new thumbnail, just update title and description
        save_settings_without_thumbnail_upload(socket, user_id, params)

      file_info ->
        Logger.info("Phoenix: Thumbnail selected, will upload: #{inspect(file_info)}")
        # Upload thumbnail first, then save settings
        upload_thumbnail_and_save_settings(socket, user_id, params, file_info)
    end
  end

  def handle_info({:send_chat_message, message}, socket) do
    user_id = socket.assigns.current_user.id

    case StreamAction.send_message(
           %{user_id: user_id, message: message, platforms: [:all]},
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to send chat message: #{inspect(reason)}")
        {:noreply, put_flash(socket, :error, "Failed to send message")}
    end
  end

  def handle_info({:viewer_update, platform, count}, socket) do
    stream_data = socket.assigns.stream_data
    viewer_counts = Map.get(stream_data, :viewer_counts, %{})
    updated_viewer_counts = Map.put(viewer_counts, platform, count)
    total_viewers = updated_viewer_counts |> Map.values() |> Enum.sum()

    updated_stream_data =
      stream_data
      |> Map.put(:viewer_counts, updated_viewer_counts)
      |> Map.put(:total_viewers, total_viewers)

    {:noreply, assign(socket, :stream_data, updated_stream_data)}
  end

  def handle_info({:chat_message, chat_event}, socket) do
    chat_messages = socket.assigns[:chat_messages] || []

    formatted_message = %{
      id: chat_event.id,
      sender_username: chat_event.username,
      message: chat_event.message,
      platform: to_string(chat_event.platform),
      timestamp: chat_event.timestamp || DateTime.utc_now()
    }

    updated_messages = Enum.take([formatted_message | chat_messages], @max_chat_messages)

    {:noreply, assign(socket, :chat_messages, updated_messages)}
  end

  def handle_info({:stream_updated, event}, socket) do
    Logger.info("Received stream_updated event: #{inspect(event)}")
    stream_events = socket.assigns[:stream_events] || []

    formatted_event = %{
      id: event.id,
      type: "stream_updated",
      username: event.username,
      metadata: event.metadata,
      timestamp: event.timestamp
    }

    Logger.info("Formatted event: #{inspect(formatted_event)}")
    updated_events = Enum.take([formatted_event | stream_events], @max_stream_events)
    Logger.info("Updated events count: #{length(updated_events)}")

    # Also update stream_data if metadata contains updated values
    stream_data = socket.assigns.stream_data

    stream_data =
      stream_data
      |> maybe_update_field(:title, get_in(event.metadata, [:title]))
      |> maybe_update_field(:description, get_in(event.metadata, [:description]))
      |> maybe_update_field(:thumbnail_url, get_in(event.metadata, [:thumbnail_url]))

    socket =
      socket
      |> assign(:stream_events, updated_events)
      |> assign(:stream_data, stream_data)

    {:noreply, socket}
  end

  def handle_info({:thumbnail_selected, _component_id, file_info}, socket) do
    # Store the selected file info for upload when user clicks GO LIVE
    {:noreply, assign(socket, :selected_thumbnail_file, file_info)}
  end

  def handle_info({:thumbnail_cleared, _component_id}, socket) do
    # Clear the selected file
    {:noreply, assign(socket, :selected_thumbnail_file, nil)}
  end

  def handle_info({:thumbnail_upload_complete, file_id}, socket) do
    user = socket.assigns.current_user

    # Mark file as uploaded
    case Streampai.Storage.File.get_by_id(%{id: file_id}, actor: user) do
      {:ok, file_record} ->
        case Streampai.Storage.File.mark_uploaded(file_record, actor: user) do
          {:ok, uploaded_file} ->
            # Update metadata with the new thumbnail
            metadata =
              socket.assigns.stream_metadata
              |> Map.put(:thumbnail_file_id, uploaded_file.id)
              |> Map.put(
                :thumbnail_url,
                S3.get_url(uploaded_file.storage_key)
              )

            # Now start the stream with the uploaded thumbnail
            user_id = socket.assigns.current_user.id
            start_stream_with_metadata(socket, user_id, metadata)

          {:error, reason} ->
            Logger.error("Failed to mark thumbnail as uploaded: #{inspect(reason)}")

            socket =
              socket
              |> assign(:loading, false)
              |> put_flash(:error, "Failed to process thumbnail upload")

            {:noreply, socket}
        end

      {:error, reason} ->
        Logger.error("Failed to get uploaded file: #{inspect(reason)}")

        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:error, "Failed to process thumbnail upload")

        {:noreply, socket}
    end
  end

  def handle_info({:file_uploaded, "thumbnail-upload", file}, socket) do
    # Legacy handler - update stream metadata with the new thumbnail file
    metadata =
      socket.assigns.stream_metadata
      |> Map.put(:thumbnail_file_id, file.id)
      |> Map.put(:thumbnail_url, S3.get_url(file.storage_key))

    {:noreply, assign(socket, :stream_metadata, metadata)}
  end

  def handle_info({:settings_thumbnail_upload_complete, file_id}, socket) do
    user = socket.assigns.current_user
    user_id = user.id
    params = socket.assigns[:pending_settings_params] || %{}

    # Mark file as uploaded
    case Streampai.Storage.File.get_by_id(%{id: file_id}, actor: user) do
      {:ok, file_record} ->
        case Streampai.Storage.File.mark_uploaded(file_record, actor: user) do
          {:ok, uploaded_file} ->
            # Update livestream record with thumbnail first
            update_livestream_metadata(user_id, %{
              title: Map.get(params, "title"),
              description: Map.get(params, "description"),
              thumbnail_file_id: uploaded_file.id
            })

            # Build metadata with thumbnail for platform managers
            metadata = %{
              title: Map.get(params, "title"),
              description: Map.get(params, "description"),
              thumbnail_file_id: uploaded_file.id
            }

            # Call platform managers directly to include thumbnail
            user_id_string = to_string(user_id)

            case Streampai.LivestreamManager.UserStreamManager.update_stream_metadata(
                   user_id_string,
                   metadata,
                   [:all]
                 ) do
              :ok ->
                # Broadcast stream_updated event manually
                thumbnail_url = S3.get_url(uploaded_file.storage_key)

                event = %{
                  id: Ash.UUID.generate(),
                  type: :stream_updated,
                  username: user.email,
                  metadata: %{
                    title: Map.get(params, "title"),
                    description: Map.get(params, "description"),
                    thumbnail_url: thumbnail_url
                  },
                  timestamp: DateTime.utc_now()
                }

                Phoenix.PubSub.broadcast(
                  Streampai.PubSub,
                  "stream_events:#{user_id}",
                  {:stream_updated, event}
                )

                # Update local UI state
                stream_data =
                  socket.assigns.stream_data
                  |> Map.put(:title, Map.get(params, "title"))
                  |> Map.put(:description, Map.get(params, "description"))
                  |> Map.put(:thumbnail_url, thumbnail_url)

                # Update stream metadata
                stream_metadata =
                  socket.assigns.stream_metadata
                  |> Map.put(:thumbnail_file_id, uploaded_file.id)
                  |> Map.put(:thumbnail_url, thumbnail_url)

                socket =
                  socket
                  |> assign(:stream_data, stream_data)
                  |> assign(:stream_metadata, stream_metadata)
                  |> assign(:selected_thumbnail_file, nil)
                  |> assign(:pending_settings_params, nil)
                  |> put_flash(:info, "Stream settings updated successfully")

                {:noreply, socket}

              {:error, reason} ->
                Logger.error("Failed to update stream settings: #{inspect(reason)}")

                socket =
                  put_flash(socket, :error, "Failed to update stream settings")

                {:noreply, socket}
            end

          {:error, reason} ->
            Logger.error("Failed to mark thumbnail as uploaded: #{inspect(reason)}")

            socket =
              put_flash(socket, :error, "Failed to process thumbnail upload")

            {:noreply, socket}
        end

      {:error, reason} ->
        Logger.error("Failed to get uploaded file: #{inspect(reason)}")

        socket =
          put_flash(socket, :error, "Failed to process thumbnail upload")

        {:noreply, socket}
    end
  end

  def handle_info({:platform_event, event}, socket) do
    if event_should_be_displayed?(event.type) do
      stream_events = socket.assigns[:stream_events] || []

      formatted_event = %{
        id: event.id,
        type: to_string(event.type),
        username: event.username,
        amount: Map.get(event, :amount),
        tier: Map.get(event, :tier),
        viewers: Map.get(event, :viewers),
        platform: to_string(event.platform),
        timestamp: event.timestamp || DateTime.utc_now()
      }

      updated_events = Enum.take([formatted_event | stream_events], @max_stream_events)

      {:noreply, assign(socket, :stream_events, updated_events)}
    else
      {:noreply, socket}
    end
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  # Private helper functions

  defp start_stream_with_metadata(socket, user_id, metadata) do
    Logger.info("Starting stream with metadata: #{inspect(metadata)}")

    case StreamAction.start_stream(
           %{
             user_id: user_id,
             title: metadata.title,
             description: metadata.description,
             metadata: %{
               thumbnail_file_id: metadata.thumbnail_file_id
             }
           },
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        socket =
          socket
          |> assign(:loading, false)
          |> assign(:selected_thumbnail_file, nil)
          |> put_flash(:info, "Stream started successfully!")

        {:noreply, socket}

      {:error, %Forbidden{}} ->
        Logger.error("Authorization failed for user #{user_id}")

        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:error, "Not authorized to start stream")

        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to start stream for user #{user_id}: #{inspect(reason)}")

        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:error, "Failed to start stream. Please try again later.")

        {:noreply, socket}
    end
  end

  defp upload_thumbnail_and_start_stream(socket, _user_id, _metadata, file_info) do
    user = socket.assigns.current_user

    # Request upload URL from backend
    case Streampai.Storage.File.request_upload(
           %{
             filename: file_info.name,
             content_type: file_info.type,
             file_type: :thumbnail,
             estimated_size: file_info.size
           },
           actor: user
         ) do
      {:ok, file_record} ->
        # Send upload info to frontend to trigger S3 upload
        upload_url = file_record.__metadata__.upload_url
        upload_headers = file_record.__metadata__.upload_headers

        socket =
          push_event(socket, "start_thumbnail_upload", %{
            file_id: file_record.id,
            upload_url: upload_url,
            upload_headers: upload_headers
          })

        # Store file ID to use after upload completes
        {:noreply, assign(socket, :pending_thumbnail_file_id, file_record.id)}

      {:error, reason} ->
        Logger.error("Failed to request thumbnail upload: #{inspect(reason)}")

        socket =
          socket
          |> assign(:loading, false)
          |> put_flash(:error, "Failed to upload thumbnail. Please try again.")

        {:noreply, socket}
    end
  end

  defp maybe_update_field(map, _key, nil), do: map
  defp maybe_update_field(map, key, value), do: Map.put(map, key, value)

  defp save_settings_without_thumbnail_upload(socket, user_id, params) do
    case StreamAction.update_stream_metadata(
           %{
             user_id: user_id,
             title: Map.get(params, "title"),
             description: Map.get(params, "description"),
             platforms: [:all]
           },
           actor: socket.assigns.current_user
         ) do
      {:ok, _result} ->
        # Update livestream record
        update_livestream_metadata(user_id, %{
          title: Map.get(params, "title"),
          description: Map.get(params, "description")
        })

        # Update local UI state
        stream_data =
          socket.assigns.stream_data
          |> Map.put(:title, Map.get(params, "title"))
          |> Map.put(:description, Map.get(params, "description"))

        socket =
          socket
          |> assign(:stream_data, stream_data)
          |> put_flash(:info, "Stream settings updated successfully")

        {:noreply, socket}

      {:error, %Forbidden{}} ->
        Logger.error("Authorization failed for user #{user_id}")
        socket = put_flash(socket, :error, "Not authorized to update stream settings")
        {:noreply, socket}

      {:error, reason} ->
        Logger.error("Failed to update stream settings: #{inspect(reason)}")
        socket = put_flash(socket, :error, "Failed to update stream settings")
        {:noreply, socket}
    end
  end

  defp upload_thumbnail_and_save_settings(socket, _user_id, params, file_info) do
    user = socket.assigns.current_user

    # Request upload URL from backend
    case Streampai.Storage.File.request_upload(
           %{
             filename: file_info.name,
             content_type: file_info.type,
             file_type: :thumbnail,
             estimated_size: file_info.size
           },
           actor: user
         ) do
      {:ok, file_record} ->
        # Send upload info to frontend to trigger S3 upload
        upload_url = file_record.__metadata__.upload_url
        upload_headers = file_record.__metadata__.upload_headers

        socket =
          push_event(socket, "start_settings_thumbnail_upload", %{
            file_id: file_record.id,
            upload_url: upload_url,
            upload_headers: upload_headers,
            params: params
          })

        # Store params to use after upload completes
        {:noreply, assign(socket, :pending_settings_params, params)}

      {:error, reason} ->
        Logger.error("Failed to request thumbnail upload: #{inspect(reason)}")

        socket =
          put_flash(socket, :error, "Failed to upload thumbnail. Please try again.")

        {:noreply, socket}
    end
  end

  defp event_should_be_displayed?(:donation), do: true
  defp event_should_be_displayed?(:subscription), do: true
  defp event_should_be_displayed?(:follow), do: true
  defp event_should_be_displayed?(:raid), do: true
  defp event_should_be_displayed?(_), do: false

  defp lookup_registry(registry_key) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, registry_key) do
      [{pid, _}] -> {:ok, pid}
      [] -> {:error, :not_found}
    end
  end

  defp default_stream_data do
    %{
      started_at: DateTime.utc_now(),
      viewer_counts: %{twitch: 0, youtube: 0, facebook: 0, kick: 0},
      total_viewers: 0,
      initial_message_count: 0,
      title: "",
      description: "",
      thumbnail_url: nil
    }
  end

  defp get_stream_status(user_id) do
    case lookup_registry({:cloudflare_manager, user_id}) do
      {:ok, _pid} ->
        cloudflare_config =
          CloudflareManager.get_stream_config(
            {:via, Registry, {Streampai.LivestreamManager.Registry, {:cloudflare_manager, user_id}}}
          )

        youtube_broadcast_id = get_youtube_broadcast_id(user_id)

        %{
          status: cloudflare_config.stream_status,
          input_streaming_status: cloudflare_config.input_streaming_status,
          can_start_streaming: cloudflare_config.can_start_streaming,
          rtmp_url: cloudflare_config.rtmp_url,
          stream_key: cloudflare_config.stream_key,
          manager_available: true,
          youtube_broadcast_id: youtube_broadcast_id
        }

      _ ->
        get_fallback_status()
    end
  rescue
    _ -> get_fallback_status()
  catch
    :exit, {:noproc, _} -> get_fallback_status()
  end

  defp get_youtube_broadcast_id(user_id) do
    with {:ok, _pid} <- lookup_registry({:platform_manager, user_id, :youtube}),
         {:ok, %{broadcast_id: broadcast_id}} when not is_nil(broadcast_id) <-
           Streampai.LivestreamManager.Platforms.YouTubeManager.get_status(user_id) do
      broadcast_id
    else
      _ -> nil
    end
  rescue
    _ -> nil
  catch
    :exit, {:noproc, _} -> nil
  end

  defp get_fallback_status do
    %{
      status: :inactive,
      input_streaming_status: :offline,
      can_start_streaming: false,
      rtmp_url: nil,
      stream_key: nil,
      manager_available: false,
      youtube_broadcast_id: nil
    }
  end

  defp update_livestream_metadata(user_id, metadata) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [livestream]} ->
        {:ok, user} = Ash.get(Streampai.Accounts.User, user_id, authorize?: false)

        update_attrs =
          maybe_put_thumbnail_file_id(
            %{title: metadata.title, description: metadata.description},
            Map.get(metadata, :thumbnail_file_id)
          )

        Livestream.update(
          livestream,
          update_attrs,
          actor: user
        )

      _ ->
        {:error, :no_active_stream}
    end
  end

  defp maybe_put_thumbnail_file_id(attrs, nil), do: attrs

  defp maybe_put_thumbnail_file_id(attrs, thumbnail_file_id), do: Map.put(attrs, :thumbnail_file_id, thumbnail_file_id)

  defp load_stream_data(user_id, %{status: :streaming}) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id and is_nil(ended_at))
         |> Ash.Query.load([:messages_amount, :thumbnail_url, thumbnail_file: [:url]])
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [stream]} ->
        default_stream_data()
        |> Map.put(:started_at, stream.started_at || DateTime.utc_now())
        |> Map.put(:initial_message_count, stream.messages_amount || 0)
        |> Map.put(:title, stream.title || "")
        |> Map.put(:description, stream.description || "")
        |> Map.put(:thumbnail_url, stream.thumbnail_url)

      _ ->
        default_stream_data()
    end
  end

  defp load_stream_data(_user_id, _stream_status) do
    default_stream_data()
  end

  defp load_last_stream_metadata(user_id) do
    require Ash.Query

    case Livestream
         |> Ash.Query.for_read(:read)
         |> Ash.Query.filter(user_id == ^user_id)
         |> Ash.Query.load(thumbnail_file: [:url])
         |> Ash.Query.load(:thumbnail_url)
         |> Ash.Query.sort(started_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read(authorize?: false) do
      {:ok, [stream]} ->
        %{
          title: stream.title || "",
          description: stream.description || "",
          thumbnail_file_id: stream.thumbnail_file_id,
          thumbnail_url: stream.thumbnail_url
        }

      _ ->
        %{title: "", description: "", thumbnail_file_id: nil, thumbnail_url: nil}
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout
      {assigns}
      current_page="stream"
      page_title="Stream"
    >
      <div class="max-w-7xl mx-auto space-y-6">
        <.live_component
          module={StreampaiWeb.Components.StreamControlsLive}
          id="stream-controls"
          stream_status={@stream_status}
          loading={@loading}
          show_stream_key={@show_stream_key}
          stream_metadata={@stream_metadata}
          stream_data={@stream_data}
          current_user={@current_user}
          chat_messages={@chat_messages}
          stream_events={@stream_events}
        />
        <.platform_connections_section
          platform_connections={@platform_connections}
          current_user={@current_user}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
