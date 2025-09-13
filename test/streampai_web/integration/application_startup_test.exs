defmodule StreampaiWeb.Integration.ApplicationStartupTest do
  @moduledoc """
  Integration tests for application startup and health checks.

  Tests that the application can start cleanly with all dependencies.
  """
  use ExUnit.Case, async: false
  use Mneme

  import Phoenix.ConnTest

  @endpoint StreampaiWeb.Endpoint

  describe "application startup" do
    @tag :integration
    @tag :startup
    @tag timeout: 30_000
    @tag capture_log: true
    @tag :skip
    test "application can start with all dependencies" do
      # Test that the application can start cleanly in isolation
      # This catches configuration errors that would prevent startup

      script = """
      try do
        case Application.ensure_all_started(:streampai) do
          {:ok, _apps} ->
            IO.puts("STARTUP_SUCCESS")
            System.halt(0)
          {:error, {app, reason}} ->
            IO.puts("STARTUP_ERROR: \#{app} - \#{inspect(reason)}")
            System.halt(1)
        end
      rescue
        error ->
          IO.puts("STARTUP_EXCEPTION: \#{inspect(error)}")
          System.halt(1)
      end
      """

      task =
        Task.async(fn ->
          System.cmd(
            "elixir",
            [
              "--no-halt",
              "-S",
              "mix",
              "run",
              "-e",
              script
            ],
            stderr_to_stdout: true,
            cd: File.cwd!(),
            env: [{"PORT", "4005"}]
          )
        end)

      {output, exit_code} = Task.await(task, 20_000)

      case {exit_code, String.contains?(output, "STARTUP_SUCCESS")} do
        {0, true} ->
          nil

        {_, _} ->
          IO.puts("Application startup output:")
          IO.puts(output)
          flunk("Application failed to start in isolation (exit: #{exit_code})")
      end
    end

    @tag :integration
    @tag :skip
    test "application responds to health checks when running" do
      conn = build_conn()
      response = get(conn, "/api/health")

      auto_assert %{status: 200} <- response

      body = json_response(response, 200)
      assert body["status"] == "ok"
      assert is_binary(body["version"])
      assert is_integer(body["uptime"])
    end
  end
end
