defmodule Streampai.Integrations.DiscordWebhookTest do
  use Streampai.DataCase, async: true

  alias Streampai.Integrations.DiscordWebhook

  describe "create/2" do
    test "creates a webhook with valid attributes" do
      user = generate_user()

      attrs = %{
        name: "My Discord Webhook",
        webhook_url: "https://discord.com/api/webhooks/123456789/abcdef",
        event_types: [:donation, :stream_start],
        is_enabled: true
      }

      assert {:ok, webhook} = DiscordWebhook.create(attrs, actor: user)
      assert webhook.name == "My Discord Webhook"
      assert webhook.webhook_url == "https://discord.com/api/webhooks/123456789/abcdef"
      assert webhook.event_types == [:donation, :stream_start]
      assert webhook.is_enabled == true
      assert webhook.user_id == user.id
      assert webhook.successful_deliveries == 0
      assert webhook.failed_deliveries == 0
    end

    test "creates a webhook with default event_types" do
      user = generate_user()

      attrs = %{
        name: "Default Events Webhook",
        webhook_url: "https://discord.com/api/webhooks/123456789/abcdef"
      }

      assert {:ok, webhook} = DiscordWebhook.create(attrs, actor: user)
      assert webhook.event_types == [:donation]
    end

    test "fails without required name" do
      user = generate_user()

      attrs = %{
        webhook_url: "https://discord.com/api/webhooks/123456789/abcdef"
      }

      assert {:error, _} = DiscordWebhook.create(attrs, actor: user)
    end

    test "fails without required webhook_url" do
      user = generate_user()

      attrs = %{
        name: "Test Webhook"
      }

      assert {:error, _} = DiscordWebhook.create(attrs, actor: user)
    end
  end

  describe "get_by_user/2" do
    test "returns webhooks for user" do
      user = generate_user()

      {:ok, webhook1} =
        DiscordWebhook.create(
          %{
            name: "Webhook 1",
            webhook_url: "https://discord.com/api/webhooks/111/aaa"
          },
          actor: user
        )

      {:ok, webhook2} =
        DiscordWebhook.create(
          %{
            name: "Webhook 2",
            webhook_url: "https://discord.com/api/webhooks/222/bbb"
          },
          actor: user
        )

      assert {:ok, webhooks} = DiscordWebhook.get_by_user(user.id, actor: user)
      assert length(webhooks) == 2
      webhook_ids = Enum.map(webhooks, & &1.id)
      assert webhook1.id in webhook_ids
      assert webhook2.id in webhook_ids
    end

    test "returns empty list when user has no webhooks" do
      user = generate_user()
      assert {:ok, []} = DiscordWebhook.get_by_user(user.id, actor: user)
    end
  end

  describe "get_enabled_by_user/2" do
    test "returns only enabled webhooks" do
      user = generate_user()

      {:ok, enabled} =
        DiscordWebhook.create(
          %{
            name: "Enabled Webhook",
            webhook_url: "https://discord.com/api/webhooks/111/aaa",
            is_enabled: true
          },
          actor: user
        )

      {:ok, _disabled} =
        DiscordWebhook.create(
          %{
            name: "Disabled Webhook",
            webhook_url: "https://discord.com/api/webhooks/222/bbb",
            is_enabled: false
          },
          actor: user
        )

      assert {:ok, webhooks} = DiscordWebhook.get_enabled_by_user(user.id, actor: user)
      assert length(webhooks) == 1
      assert hd(webhooks).id == enabled.id
    end
  end

  describe "update/3" do
    test "updates webhook attributes" do
      user = generate_user()

      {:ok, webhook} =
        DiscordWebhook.create(
          %{
            name: "Original Name",
            webhook_url: "https://discord.com/api/webhooks/111/aaa"
          },
          actor: user
        )

      assert {:ok, updated} =
               Ash.update(webhook, %{name: "Updated Name", is_enabled: false}, actor: user)

      assert updated.name == "Updated Name"
      assert updated.is_enabled == false
    end
  end

  describe "destroy/2" do
    test "deletes a webhook" do
      user = generate_user()

      {:ok, webhook} =
        DiscordWebhook.create(
          %{
            name: "To Delete",
            webhook_url: "https://discord.com/api/webhooks/111/aaa"
          },
          actor: user
        )

      assert :ok = Ash.destroy(webhook, actor: user)
      assert {:ok, []} = DiscordWebhook.get_by_user(user.id, actor: user)
    end
  end

  describe "policies" do
    test "user can only read their own webhooks" do
      user1 = generate_user()
      user2 = generate_user()

      {:ok, webhook} =
        DiscordWebhook.create(
          %{
            name: "User1 Webhook",
            webhook_url: "https://discord.com/api/webhooks/111/aaa"
          },
          actor: user1
        )

      # User2 cannot read user1's webhook
      assert {:ok, []} = DiscordWebhook.get_by_user(user1.id, actor: user2)

      # But user1 can read their own
      assert {:ok, webhooks} = DiscordWebhook.get_by_user(user1.id, actor: user1)
      assert length(webhooks) == 1
      assert hd(webhooks).id == webhook.id
    end
  end

  describe "identities" do
    test "enforces unique webhook name per user" do
      user = generate_user()

      {:ok, _} =
        DiscordWebhook.create(
          %{
            name: "Unique Name",
            webhook_url: "https://discord.com/api/webhooks/111/aaa"
          },
          actor: user
        )

      # Same name for same user should fail
      assert {:error, _} =
               DiscordWebhook.create(
                 %{
                   name: "Unique Name",
                   webhook_url: "https://discord.com/api/webhooks/222/bbb"
                 },
                 actor: user
               )
    end

    test "allows same name for different users" do
      user1 = generate_user()
      user2 = generate_user()

      {:ok, _} =
        DiscordWebhook.create(
          %{
            name: "Same Name",
            webhook_url: "https://discord.com/api/webhooks/111/aaa"
          },
          actor: user1
        )

      # Same name for different user should work
      assert {:ok, _} =
               DiscordWebhook.create(
                 %{
                   name: "Same Name",
                   webhook_url: "https://discord.com/api/webhooks/222/bbb"
                 },
                 actor: user2
               )
    end
  end

  # Helper to generate a user for testing
  defp generate_user do
    {:ok, user} =
      Streampai.Accounts.User
      |> Ash.Changeset.for_create(:register_with_oauth, %{
        provider: :google,
        uid: "test_#{System.unique_integer([:positive])}",
        provider_token: "fake_token",
        email: "test_#{System.unique_integer([:positive])}@example.com",
        email_verified: true
      })
      |> Ash.create(authorize?: false)

    user
  end
end
