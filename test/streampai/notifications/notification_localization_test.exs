defmodule Streampai.Notifications.NotificationLocalizationTest do
  use Streampai.DataCase, async: true

  alias Streampai.Accounts.User
  alias Streampai.Notifications.Notification

  # Skip: :create_with_localizations action was removed, only :create exists now
  @moduletag :skip

  describe "notification with localizations" do
    setup do
      # Create an admin user
      admin_email = Streampai.Constants.admin_email()

      {:ok, admin} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: admin_email,
          password: "Test1234!",
          password_confirmation: "Test1234!"
        })
        |> Ash.create()

      # Load the role calculation so policies can check it
      {:ok, admin} = Ash.load(admin, [:role])

      {:ok, admin: admin}
    end

    test "creates notification without localizations", %{admin: admin} do
      {:ok, notification} =
        Notification
        |> Ash.Changeset.for_create(:create_with_localizations, %{
          content: "Hello, world!",
          localizations: []
        })
        |> Ash.create(actor: admin)

      assert notification.content == "Hello, world!"
    end

    test "regular user cannot create notification" do
      # Create a regular user
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "regular@example.com",
          password: "Test1234!",
          password_confirmation: "Test1234!"
        })
        |> Ash.create()

      {:ok, user} = Ash.load(user, [:role])

      assert {:error, %Ash.Error.Forbidden{}} =
               Notification
               |> Ash.Changeset.for_create(:create_with_localizations, %{
                 content: "Should fail",
                 localizations: []
               })
               |> Ash.create(actor: user)
    end
  end
end
