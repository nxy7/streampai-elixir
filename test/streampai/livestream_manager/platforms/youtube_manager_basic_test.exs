defmodule Streampai.LivestreamManager.Platforms.YouTubeManagerBasicTest do
  use ExUnit.Case, async: false

  alias Ecto.Adapters.SQL.Sandbox
  alias Streampai.LivestreamManager.Platforms.YouTubeManager

  setup do
    # Set database to shared mode for spawned processes
    Sandbox.mode(Streampai.Repo, {:shared, self()})

    # Create unique test registry to avoid conflicts
    test_registry = :"test_registry_#{System.unique_integer([:positive])}"
    {:ok, _} = Registry.start_link(keys: :unique, name: test_registry)

    user_id = Ash.UUID.generate()
    config = %{access_token: "test-token", refresh_token: "refresh-token"}

    # Set up test mode and registry for this process
    Process.put(:test_registry_name, test_registry)
    Application.put_env(:streampai, :test_mode, true)

    on_exit(fn ->
      Process.delete(:test_registry_name)
      Application.put_env(:streampai, :test_mode, false)
      Sandbox.mode(Streampai.Repo, :manual)
    end)

    %{user_id: user_id, config: config, test_registry: test_registry}
  end

  test "can start a YouTubeManager process", %{user_id: user_id, config: config} do
    {:ok, pid} = YouTubeManager.start_link(user_id, config)
    assert Process.alive?(pid)
  end

  test "can handle stream control calls", %{user_id: user_id, config: config} do
    {:ok, _pid} = YouTubeManager.start_link(user_id, config)

    stream_uuid = Ecto.UUID.generate()
    assert :ok = YouTubeManager.start_streaming(user_id, stream_uuid)
    assert :ok = YouTubeManager.stop_streaming(user_id)
  end

  test "can handle chat messages", %{user_id: user_id, config: config} do
    {:ok, _pid} = YouTubeManager.start_link(user_id, config)

    assert :ok = YouTubeManager.send_chat_message(user_id, "Hello!")
  end

  test "can handle metadata updates", %{user_id: user_id, config: config} do
    {:ok, _pid} = YouTubeManager.start_link(user_id, config)

    metadata = %{title: "Test Stream"}
    assert :ok = YouTubeManager.update_stream_metadata(user_id, metadata)
  end

  test "can handle sequential operations", %{user_id: user_id, config: config} do
    {:ok, _pid} = YouTubeManager.start_link(user_id, config)

    # Multiple operations in sequence
    stream_uuid = Ecto.UUID.generate()
    assert :ok = YouTubeManager.start_streaming(user_id, stream_uuid)
    assert :ok = YouTubeManager.send_chat_message(user_id, "Stream started!")
    assert :ok = YouTubeManager.update_stream_metadata(user_id, %{title: "Live Now"})
    assert :ok = YouTubeManager.stop_streaming(user_id)

    # Can start again
    new_uuid = Ecto.UUID.generate()
    assert :ok = YouTubeManager.start_streaming(user_id, new_uuid)
    assert :ok = YouTubeManager.stop_streaming(user_id)
  end
end
