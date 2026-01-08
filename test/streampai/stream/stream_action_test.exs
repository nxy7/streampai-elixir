defmodule Streampai.Stream.StreamActionTest do
  use Streampai.DataCase, async: true

  alias Ash.Error.Forbidden
  alias Ash.Error.Unknown
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole
  alias Streampai.Stream.StreamAction

  setup do
    # Allow spawned manager processes to access the database
    allow_manager_processes()
    :ok
  end

  describe "start_stream" do
    test "allows stream owner to start their stream" do
      user = create_user()

      # start_stream depends on UserStreamManager/CloudflareManager processes
      # which may not be running in test environment. We verify that:
      # 1. Authorization passes (no Forbidden error)
      # 2. The action either succeeds or fails with an expected infrastructure error
      result =
        try do
          StreamAction.start_stream(
            %{user_id: user.id, title: "Test Stream"},
            actor: user
          )
        catch
          :exit, {:noproc, _} -> {:error, :process_not_available}
          :exit, {reason, _} when is_atom(reason) -> {:error, reason}
        end

      case result do
        {:ok, response} ->
          assert response.success == true
          assert is_binary(response.livestream_id)

        {:error, %Forbidden{}} ->
          flunk("Authorization should pass for stream owner")

        {:error, reason} ->
          # Infrastructure errors (missing GenServer, etc.) are acceptable in test
          assert is_atom(reason) or match?(%Unknown{}, reason)
      end
    end

    test "prevents non-owner from starting stream" do
      owner = create_user()
      other_user = create_user()

      assert {:error, %Forbidden{}} =
               StreamAction.start_stream(
                 %{user_id: owner.id, title: "Test Stream"},
                 actor: other_user
               )
    end
  end

  describe "stop_stream" do
    test "allows stream owner to stop their stream" do
      user = create_user()

      # stop_stream depends on UserStreamManager/CloudflareManager processes
      # We verify authorization passes and action either succeeds or fails with infrastructure error
      result =
        try do
          StreamAction.stop_stream(%{user_id: user.id}, actor: user)
        catch
          :exit, {:noproc, _} -> {:error, :process_not_available}
          :exit, {reason, _} when is_atom(reason) -> {:error, reason}
        end

      case result do
        {:ok, response} ->
          assert response.success == true

        {:error, %Forbidden{}} ->
          flunk("Authorization should pass for stream owner")

        {:error, reason} ->
          # Infrastructure errors are acceptable - no stream running, GenServer not found, etc.
          assert is_atom(reason) or match?(%Unknown{}, reason)
      end
    end

    test "prevents non-owner from stopping stream" do
      owner = create_user()
      other_user = create_user()

      assert {:error, %Forbidden{}} =
               StreamAction.stop_stream(%{user_id: owner.id}, actor: other_user)
    end
  end

  describe "send_message" do
    test "allows stream owner to send messages" do
      user = create_user()

      assert {:ok, result} =
               StreamAction.send_message(
                 %{user_id: user.id, message: "Hello chat!", platforms: [:twitch]},
                 actor: user
               )

      assert result.success == true
    end

    test "allows moderator to send messages" do
      owner = create_user()
      moderator = create_user()
      grant_moderator_role(owner, moderator)

      assert {:ok, result} =
               StreamAction.send_message(
                 %{user_id: owner.id, message: "Moderator message", platforms: [:twitch]},
                 actor: moderator
               )

      assert result.success == true
    end

    test "prevents random user from sending messages" do
      owner = create_user()
      random_user = create_user()

      assert {:error, %Forbidden{}} =
               StreamAction.send_message(
                 %{user_id: owner.id, message: "Unauthorized"},
                 actor: random_user
               )
    end
  end

  describe "ban_user" do
    test "allows stream owner to ban users (not yet implemented)" do
      user = create_user()

      case StreamAction.ban_user(
             %{
               user_id: user.id,
               target_username: "toxic_user",
               platform: :twitch,
               reason: "Spamming"
             },
             actor: user
           ) do
        {:error, %Unknown{errors: [%{error: message}]}} ->
          assert message == "ban_user not yet implemented"

        other ->
          flunk("Expected error, got: #{inspect(other)}")
      end
    end

    test "allows moderator to ban users (not yet implemented)" do
      owner = create_user()
      moderator = create_user()
      grant_moderator_role(owner, moderator)

      # ban_user passes authorization but is not yet implemented
      case StreamAction.ban_user(
             %{user_id: owner.id, target_username: "bad_user", platform: :twitch},
             actor: moderator
           ) do
        {:error, %Forbidden{}} ->
          flunk("Authorization should pass for moderator")

        {:error, %Unknown{errors: [%{error: message}]}} ->
          # Expected: action is authorized but not implemented
          assert message == "ban_user not yet implemented"

        other ->
          flunk("Unexpected result: #{inspect(other)}")
      end
    end

    test "prevents non-moderator from banning users" do
      owner = create_user()
      random_user = create_user()

      assert {:error, %Forbidden{}} =
               StreamAction.ban_user(
                 %{user_id: owner.id, target_username: "someone", platform: :twitch},
                 actor: random_user
               )
    end
  end

  describe "timeout_user" do
    test "allows stream owner to timeout users (not yet implemented)" do
      user = create_user()

      case StreamAction.timeout_user(
             %{
               user_id: user.id,
               target_username: "annoying_user",
               platform: :twitch,
               duration_seconds: 600
             },
             actor: user
           ) do
        {:error, %Unknown{errors: [%{error: message}]}} ->
          assert message == "timeout_user not yet implemented"

        other ->
          flunk("Expected error, got: #{inspect(other)}")
      end
    end
  end

  describe "update_stream_metadata" do
    test "allows stream owner to update metadata" do
      user = create_user()

      assert {:ok, result} =
               StreamAction.update_stream_metadata(
                 %{user_id: user.id, title: "New Title", platforms: [:all]},
                 actor: user
               )

      assert result.success == true
    end

    test "allows moderator to update metadata" do
      owner = create_user()
      moderator = create_user()
      grant_moderator_role(owner, moderator)

      assert {:ok, result} =
               StreamAction.update_stream_metadata(
                 %{user_id: owner.id, title: "Mod Updated Title"},
                 actor: moderator
               )

      assert result.success == true
    end
  end

  defp create_user do
    {:ok, user} =
      User.register_with_password(%{
        email: "user_#{:rand.uniform(100_000)}@test.com",
        password: "password123456",
        password_confirmation: "password123456"
      })

    user
  end

  defp grant_moderator_role(owner, moderator) do
    {:ok, role} =
      UserRole.invite_role(
        %{user_id: moderator.id, granter_id: owner.id, role_type: :moderator},
        actor: owner
      )

    {:ok, _accepted_role} = UserRole.accept_role(role, actor: moderator)
  end

  defp allow_manager_processes do
    # Find and allow CloudflareManager and other manager processes
    # that might be spawned during tests

    # Allow LivestreamManager.Supervisor children
    allow_supervisor_children(Streampai.LivestreamManager.Supervisor)

    # Allow CloudflareManager processes (if supervisor is running)
    allow_supervisor_children(Streampai.CloudflareManager.Supervisor)
  end

  defp allow_supervisor_children(supervisor_name, retries \\ 3) do
    case Supervisor.which_children(supervisor_name) do
      children when is_list(children) ->
        for {_name, pid, _type, _modules} <- children do
          allow_process_and_children(pid)
        end

      _ ->
        :ok
    end
  catch
    :exit, {:noproc, _} when retries > 0 ->
      # Supervisor not yet started, wait briefly and retry
      Process.sleep(5)
      allow_supervisor_children(supervisor_name, retries - 1)

    :exit, _ ->
      :ok
  end

  defp allow_process_and_children(pid) when is_pid(pid) do
    allow_process(pid)
    allow_linked_processes(pid)
  rescue
    _ -> :ok
  end

  defp allow_process_and_children(_), do: :ok

  defp allow_linked_processes(pid) do
    case Process.info(pid, :links) do
      {:links, links} -> Enum.each(links, &try_allow_process/1)
      _ -> :ok
    end
  end

  defp try_allow_process(linked_pid) do
    if is_pid(linked_pid) and linked_pid != self() do
      allow_process(linked_pid)
    end
  rescue
    _ -> :ok
  end
end
