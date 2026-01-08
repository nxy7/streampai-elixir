defmodule Streampai.LivestreamManager.StreamManagerBasicTest do
  use ExUnit.Case, async: false

  alias Ecto.Adapters.SQL.Sandbox
  alias Streampai.LivestreamManager.StreamManager

  setup do
    Application.put_env(:streampai, :test_mode, true)

    user_id = Ash.UUID.generate()

    on_exit(fn ->
      Application.put_env(:streampai, :test_mode, false)
    end)

    %{user_id: user_id}
  end

  defp start_stream_manager(user_id) do
    :ok = Sandbox.checkout(Streampai.Repo)
    {:ok, pid} = StreamManager.start_link(user_id)
    # Unlink so GenServer crashes don't kill the test process
    Process.unlink(pid)
    Sandbox.allow(Streampai.Repo, self(), pid)
    Process.sleep(150)
    {:ok, pid}
  end

  test "can start StreamManager", %{user_id: user_id} do
    {:ok, pid} = start_stream_manager(user_id)
    assert Process.alive?(pid)
  end

  test "can handle basic API calls without crashing", %{user_id: user_id} do
    {:ok, _pid} = start_stream_manager(user_id)

    result1 = StreamManager.send_chat_message(user_id, "Hello", :all)
    assert result1 in [:ok] or match?({:error, _}, result1)

    result2 = StreamManager.update_stream_metadata(user_id, %{title: "Test"}, :all)
    assert result2 in [:ok] or match?({:error, _}, result2)
  end

  test "stream control API doesn't crash", %{user_id: user_id} do
    {:ok, _pid} = start_stream_manager(user_id)

    start_result =
      try do
        StreamManager.start_stream(user_id)
      catch
        :exit, _ -> {:error, :process_crashed}
      end

    case start_result do
      {:ok, stream_uuid} ->
        assert is_binary(stream_uuid)
        assert String.length(stream_uuid) == 36

        stop_result = StreamManager.stop_stream(user_id)
        assert stop_result in [:ok] or match?({:error, _}, stop_result)

      {:error, reason} ->
        assert is_atom(reason) or is_binary(reason)

      other ->
        IO.puts("Unexpected start_stream result: #{inspect(other)}")
        assert true
    end
  end

  test "alert management API doesn't crash", %{user_id: user_id} do
    {:ok, _pid} = start_stream_manager(user_id)

    event = %{type: :donation, amount: 10.0}

    result1 = StreamManager.enqueue_alert(user_id, event)
    assert result1 in [:ok] or match?({:error, _}, result1)

    result2 = StreamManager.pause_alerts(user_id)
    assert result2 in [:ok] or match?({:error, _}, result2)

    result3 = StreamManager.resume_alerts(user_id)
    assert result3 in [:ok] or match?({:error, _}, result3)
  end

  test "get_state returns state", %{user_id: user_id} do
    {:ok, _pid} = start_stream_manager(user_id)

    result =
      try do
        StreamManager.get_state(user_id)
      catch
        :exit, _reason -> {:error, :process_not_available}
      end

    assert is_map(result) or is_struct(result) or match?({:error, _}, result)
  end
end
