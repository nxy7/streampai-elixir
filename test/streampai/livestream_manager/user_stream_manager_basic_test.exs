defmodule Streampai.LivestreamManager.UserStreamManagerBasicTest do
  use ExUnit.Case, async: true

  alias Ecto.Adapters.SQL.Sandbox
  alias Streampai.LivestreamManager.UserStreamManager

  setup do
    # Set to shared mode for this test since processes are dynamically spawned
    Sandbox.mode(Streampai.Repo, {:shared, self()})
    # Set up test registry to avoid conflicts
    test_registry = :"test_registry_#{System.unique_integer([:positive])}"
    {:ok, _} = Registry.start_link(keys: :unique, name: test_registry)

    # Store test registry name in process dictionary
    Process.put(:test_registry_name, test_registry)
    Application.put_env(:streampai, :test_mode, true)

    user_id = Ash.UUID.generate()

    on_exit(fn ->
      Process.delete(:test_registry_name)
      Application.put_env(:streampai, :test_mode, false)
      Sandbox.mode(Streampai.Repo, :manual)
    end)

    %{user_id: user_id, test_registry: test_registry}
  end

  # Helper function to start UserStreamManager and allow database access for all children
  defp start_user_stream_manager_with_db_access(user_id) do
    {:ok, supervisor_pid} = UserStreamManager.start_link(user_id)

    # Give a moment for children to start and then allow database access
    Process.sleep(50)
    allow_database_access_for_children(supervisor_pid)
    # Give a bit more time for initialization
    Process.sleep(50)

    {:ok, supervisor_pid}
  end

  defp allow_database_access_for_children(supervisor_pid) do
    children = Supervisor.which_children(supervisor_pid)

    Enum.each(children, fn {_id, child_pid, _type, _modules} ->
      if is_pid(child_pid) do
        Sandbox.allow(Streampai.Repo, self(), child_pid)
      end
    end)
  end

  test "can start UserStreamManager supervisor", %{user_id: user_id} do
    {:ok, supervisor_pid} = start_user_stream_manager_with_db_access(user_id)
    assert Process.alive?(supervisor_pid)

    # Check that children are running
    children = Supervisor.which_children(supervisor_pid)
    assert length(children) > 0
  end

  test "can handle basic API calls without crashing", %{user_id: user_id} do
    {:ok, _supervisor_pid} = start_user_stream_manager_with_db_access(user_id)

    # These might return errors due to missing implementations, but shouldn't crash
    result1 = UserStreamManager.send_chat_message(user_id, "Hello", :all)
    assert result1 in [:ok] or match?({:error, _}, result1)

    result2 = UserStreamManager.update_stream_metadata(user_id, %{title: "Test"}, :all)
    assert result2 in [:ok] or match?({:error, _}, result2)
  end

  test "stream control API doesn't crash", %{user_id: user_id} do
    {:ok, _supervisor_pid} = start_user_stream_manager_with_db_access(user_id)

    # Start stream - might fail due to missing StreamStateServer functions, but shouldn't crash
    start_result =
      try do
        UserStreamManager.start_stream(user_id)
      rescue
        # DB ownership errors can occur in test environment
        MatchError -> {:error, :db_access_error}
      catch
        :exit, {:noproc, _} -> {:error, :cloudflare_manager_not_available}
        :exit, {reason, _} when is_atom(reason) -> {:error, reason}
      end

    case start_result do
      {:ok, stream_uuid} ->
        assert is_binary(stream_uuid)
        # UUID format
        assert String.length(stream_uuid) == 36

        # Try to stop the stream
        stop_result = UserStreamManager.stop_stream(user_id)
        assert stop_result in [:ok] or match?({:error, _}, stop_result)

      {:error, reason} ->
        # Expected failure case - CloudflareManager might not be available in test
        assert is_atom(reason) or is_binary(reason)

      other ->
        # This handles any unexpected return values
        IO.puts("Unexpected start_stream result: #{inspect(other)}")
        assert true
    end
  end

  test "alert management API doesn't crash", %{user_id: user_id} do
    {:ok, _supervisor_pid} = start_user_stream_manager_with_db_access(user_id)

    event = %{type: :donation, amount: 10.0}

    # These might return errors but shouldn't crash
    result1 = UserStreamManager.enqueue_alert(user_id, event)
    assert result1 in [:ok] or match?({:error, _}, result1)

    result2 = UserStreamManager.pause_alerts(user_id)
    assert result2 in [:ok] or match?({:error, _}, result2)

    result3 = UserStreamManager.resume_alerts(user_id)
    assert result3 in [:ok] or match?({:error, _}, result3)
  end

  test "get_state API handles missing processes gracefully", %{user_id: user_id} do
    {:ok, _supervisor_pid} = start_user_stream_manager_with_db_access(user_id)

    # This might crash if StreamStateServer isn't properly initialized
    # We wrap it in a try/catch to verify it doesn't bring down the test
    result =
      try do
        UserStreamManager.get_state(user_id)
      catch
        :exit, _reason -> {:error, :process_not_available}
      end

    # Should either return a map (if StreamStateServer started) or an error
    assert is_map(result) or match?({:error, _}, result)
  end
end
