defmodule Mix.Tasks.DevUser do
  @moduledoc """
  Development task to create and manage mock users for testing different scenarios.

  ## Usage

      # Create a regular user
      mix dev_user create --email user@example.com

      # Create an admin user
      mix dev_user create --email admin@example.com --admin

      # Create a pro user
      mix dev_user create --email pro@example.com --plan pro

      # List existing test users
      mix dev_user list

      # Generate test scenarios
      mix dev_user scenarios

      # Clean up test users
      mix dev_user cleanup

  This is useful for:
  - Setting up different user types quickly
  - Testing dashboard functionality with various user states
  - Testing impersonation workflows
  - Setting up demo data
  """

  use Mix.Task

  @shortdoc "Manage development users for testing different scenarios"

  def run(args) do
    Mix.Task.run("app.start")

    case args do
      ["create" | opts] ->
        create_user(parse_opts(opts))

      ["list"] ->
        list_users()

      ["scenarios"] ->
        create_scenarios()

      ["cleanup"] ->
        cleanup_users()

      ["help"] ->
        show_help()

      [] ->
        show_help()

      _ ->
        Mix.shell().error("Unknown command. Run 'mix dev_user help' for usage.")
    end
  end

  defp create_user(opts) do
    email = Keyword.get(opts, :email, "dev-#{System.system_time(:second)}@example.com")
    admin = Keyword.get(opts, :admin, false)
    plan = Keyword.get(opts, :plan, :free)
    confirmed = Keyword.get(opts, :confirmed, true)

    case create_dev_user(email, admin: admin, plan: plan, confirmed: confirmed) do
      {:ok, user} ->
        Mix.shell().info("✅ Created user: #{user.email}")
        Mix.shell().info("   ID: #{user.id}")
        Mix.shell().info("   Admin: #{inspect(admin)}")
        Mix.shell().info("   Plan: #{plan}")
        Mix.shell().info("   Confirmed: #{confirmed}")

      {:error, changeset} ->
        Mix.shell().error("❌ Failed to create user: #{inspect(changeset.errors)}")
    end
  end

  defp list_users do
    all_users = Streampai.Accounts.User |> Ash.read!()

    users =
      Enum.filter(all_users, fn user ->
        String.contains?(user.email, "@example.com") or String.contains?(user.email, "test")
      end)

    Mix.shell().info("\n📋 Development Users:")
    Mix.shell().info("=" <> String.duplicate("=", 50))

    for user <- users do
      admin_status = if Streampai.Dashboard.admin?(user), do: " [ADMIN]", else: ""
      confirmed_status = if user.confirmed_at, do: "✅", else: "⏳"

      Mix.shell().info("#{confirmed_status} #{user.email}#{admin_status}")
      Mix.shell().info("    ID: #{user.id}")
    end

    if Enum.empty?(users) do
      Mix.shell().info(
        "No development users found. Run 'mix dev_user scenarios' to create test users."
      )
    end
  end

  defp create_scenarios do
    scenarios = [
      %{email: "regular@example.com", admin: false, plan: :free, desc: "Regular User"},
      %{email: "admin@example.com", admin: true, plan: :free, desc: "Admin User"},
      %{email: "pro@example.com", admin: false, plan: :pro, desc: "Pro Plan User"},
      %{
        email: "unconfirmed@example.com",
        admin: false,
        plan: :free,
        confirmed: false,
        desc: "Unconfirmed User"
      },
      %{
        email: Streampai.Constants.admin_email(),
        admin: true,
        plan: :pro,
        desc: "Super Admin (recognized by email)"
      }
    ]

    Mix.shell().info("🎭 Creating test user scenarios...")

    for scenario <- scenarios do
      case create_dev_user(scenario.email, Keyword.take(scenario, [:admin, :plan, :confirmed])) do
        {:ok, _user} ->
          Mix.shell().info("✅ #{scenario.desc}: #{scenario.email}")

        {:error,
         %Ash.Error.Invalid{errors: [%Ash.Error.Changes.InvalidAttribute{message: message}]}} ->
          if String.contains?(message, "already taken") do
            Mix.shell().info("⚠️  #{scenario.desc}: #{scenario.email} (already exists)")
          else
            Mix.shell().error("❌ Failed to create #{scenario.desc}: #{inspect(message)}")
          end

        {:error, error} ->
          Mix.shell().error("❌ Failed to create #{scenario.desc}: #{inspect(error)}")
      end
    end

    Mix.shell().info("\n🔧 Usage:")

    Mix.shell().info(
      "- Visit http://localhost:4000/dashboard after signing in as any of these users"
    )

    Mix.shell().info("- Password for all test users: 'password123'")
    Mix.shell().info("- Use admin users to test impersonation")
  end

  defp cleanup_users do
    Mix.shell().info("🧹 Cleaning up development users...")

    all_users = Streampai.Accounts.User |> Ash.read!()

    users =
      Enum.filter(all_users, fn user ->
        String.contains?(user.email, "@example.com") or
          (String.contains?(user.email, "test") and user.email != Streampai.Constants.admin_email())
      end)

    for user <- users do
      case Ash.destroy(user) do
        :ok ->
          Mix.shell().info("🗑️  Removed: #{user.email}")

        {:error, error} ->
          Mix.shell().error("❌ Failed to remove #{user.email}: #{inspect(error)}")
      end
    end

    Mix.shell().info("✅ Cleanup complete")
  end

  defp create_dev_user(email, opts) do
    confirmed = Keyword.get(opts, :confirmed, true)

    user_attrs = %{
      email: email,
      password: "password123",
      password_confirmation: "password123"
    }

    changeset =
      Streampai.Accounts.User
      |> Ash.Changeset.for_create(:register_with_password, user_attrs)

    changeset =
      if confirmed do
        Ash.Changeset.force_change_attribute(changeset, :confirmed_at, DateTime.utc_now())
      else
        changeset
      end

    Ash.create(changeset)
  end

  defp parse_opts(opts) do
    opts
    |> Enum.chunk_every(2)
    |> Enum.reduce([], fn
      ["--email", email], acc ->
        Keyword.put(acc, :email, email)

      ["--admin"], acc ->
        Keyword.put(acc, :admin, true)

      ["--plan", plan], acc ->
        Keyword.put(acc, :plan, String.to_atom(plan))

      ["--unconfirmed"], acc ->
        Keyword.put(acc, :confirmed, false)

      [flag], acc ->
        Mix.shell().error("Unknown flag: #{flag}")
        acc

      _, acc ->
        acc
    end)
  end

  defp show_help do
    Mix.shell().info("""
    🧪 DevUser - Development User Management

    Usage: mix dev_user <command> [options]

    Commands:
      create [options]    Create a new development user
      list               List existing development users
      scenarios          Create common test user scenarios
      cleanup            Remove all development users
      help              Show this help

    Create Options:
      --email <email>    User email (default: auto-generated)
      --admin            Make user an admin
      --plan <plan>      Set user plan (free|pro)
      --unconfirmed      Create unconfirmed user

    Examples:
      mix dev_user create --email user@example.com
      mix dev_user create --email admin@test.com --admin --plan pro
      mix dev_user scenarios
      mix dev_user list
      mix dev_user cleanup

    Scenarios created with 'scenarios' command:
      - regular@example.com (regular user)
      - admin@example.com (admin user)
      - pro@example.com (pro plan user)
      - unconfirmed@example.com (unconfirmed user)
      - #{Streampai.Constants.admin_email()} (super admin)

    All test users have password: password123
    """)
  end
end
