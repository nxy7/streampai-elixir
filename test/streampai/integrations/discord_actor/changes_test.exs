defmodule Streampai.Integrations.DiscordActor.ChangesTest do
  use Streampai.DataCase, async: true
  use Mneme

  alias Streampai.Accounts.User
  alias Streampai.Integrations.DiscordActor

  describe "InitializeData change" do
    setup do
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "discord_test@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      %{user: user}
    end

    test "initializes data with default values", %{user: user} do
      {:ok, actor} =
        DiscordActor.create(
          %{
            bot_token: "test_token_123",
            bot_name: "TestBot"
          },
          actor: user,
          authorize?: false
        )

      data = actor.data

      data_structure = %{
        has_bot_token: Map.get(data, "bot_token") == "test_token_123",
        has_bot_name: Map.get(data, "bot_name") == "TestBot",
        has_disconnected_status: Map.get(data, "status") == "disconnected",
        has_default_event_types: is_list(Map.get(data, "event_types")),
        has_empty_guilds: Map.get(data, "guilds") == [],
        has_empty_channels: Map.get(data, "channels") == %{},
        has_zero_messages: Map.get(data, "messages_sent") == 0
      }

      auto_assert %{
                    has_bot_name: true,
                    has_bot_token: true,
                    has_default_event_types: true,
                    has_disconnected_status: true,
                    has_empty_channels: true,
                    has_empty_guilds: true,
                    has_zero_messages: true
                  } <- data_structure
    end

    test "uses custom event types when provided", %{user: user} do
      {:ok, actor} =
        DiscordActor.create(
          %{
            bot_token: "test_token_456",
            event_types: [:donation, :stream_start]
          },
          actor: user,
          authorize?: false
        )

      event_types = Map.get(actor.data, "event_types")

      auto_assert ["donation", "stream_start"] <- event_types
    end
  end

  describe "MergeDataFromArguments change" do
    setup do
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "discord_update@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, actor} =
        DiscordActor.create(
          %{
            bot_token: "initial_token",
            bot_name: "InitialBot"
          },
          actor: user,
          authorize?: false
        )

      %{user: user, actor: actor}
    end

    test "updates bot_name in data", %{user: user, actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{bot_name: "UpdatedBot"},
          action: :update,
          actor: user,
          authorize?: false
        )

      auto_assert "UpdatedBot" <- Map.get(updated.data, "bot_name")
    end

    test "updates event_types in data", %{user: user, actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{event_types: [:donation]},
          action: :update,
          actor: user,
          authorize?: false
        )

      auto_assert ["donation"] <- Map.get(updated.data, "event_types")
    end

    test "updates announcement channel settings", %{user: user, actor: actor} do
      {:ok, updated} =
        Ash.update(
          actor,
          %{
            announcement_guild_id: "guild_123",
            announcement_channel_id: "channel_456"
          },
          action: :update,
          actor: user,
          authorize?: false
        )

      updates = %{
        guild_id: Map.get(updated.data, "announcement_guild_id"),
        channel_id: Map.get(updated.data, "announcement_channel_id")
      }

      auto_assert %{channel_id: "channel_456", guild_id: "guild_123"} <- updates
    end

    test "preserves existing data when updating subset of fields", %{user: user, actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{bot_name: "NewName"}, action: :update, actor: user, authorize?: false)

      preserved = %{
        has_original_token: Map.get(updated.data, "bot_token") == "initial_token",
        has_new_name: Map.get(updated.data, "bot_name") == "NewName",
        has_status: Map.has_key?(updated.data, "status")
      }

      auto_assert %{has_new_name: true, has_original_token: true, has_status: true} <- preserved
    end
  end

  describe "UpdateConnectionStatus change" do
    setup do
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "discord_status@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, actor} =
        DiscordActor.create(
          %{bot_token: "status_test_token"},
          actor: user,
          authorize?: false
        )

      %{user: user, actor: actor}
    end

    test "updates status to connected", %{actor: actor} do
      {:ok, updated} =
        Ash.update(actor, %{status: :connected}, action: :update_status, authorize?: false)

      auto_assert "connected" <- Map.get(updated.data, "status")
    end

    test "updates status with error information", %{actor: actor} do
      error_time = ~U[2024-01-15 10:30:00.123456Z]

      {:ok, updated} =
        Ash.update(
          actor,
          %{
            status: :error,
            last_error: "Connection failed",
            last_error_at: error_time
          },
          action: :update_status,
          authorize?: false
        )

      data = updated.data

      error_state = %{
        status: Map.get(data, "status"),
        has_error_message: Map.get(data, "last_error") == "Connection failed",
        has_error_timestamp: is_binary(Map.get(data, "last_error_at"))
      }

      auto_assert %{
                    has_error_message: true,
                    has_error_timestamp: true,
                    status: "error"
                  } <- error_state
    end
  end

  describe "UpdateGuildsAndChannels change" do
    setup do
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "discord_guilds@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, actor} =
        DiscordActor.create(
          %{bot_token: "guilds_test_token"},
          actor: user,
          authorize?: false
        )

      %{user: user, actor: actor}
    end

    test "updates guilds list", %{actor: actor} do
      guilds = [
        %{"id" => "guild_1", "name" => "Test Guild 1"},
        %{"id" => "guild_2", "name" => "Test Guild 2"}
      ]

      {:ok, updated} =
        Ash.update(actor, %{guilds: guilds}, action: :update_actor_state, authorize?: false)

      auto_assert 2 <- length(Map.get(updated.data, "guilds"))
    end

    test "updates channels map", %{actor: actor} do
      channels = %{
        "guild_1" => [%{"id" => "ch_1", "name" => "general"}],
        "guild_2" => [%{"id" => "ch_2", "name" => "announcements"}]
      }

      {:ok, updated} =
        Ash.update(actor, %{channels: channels}, action: :update_actor_state, authorize?: false)

      auto_assert 2 <- map_size(Map.get(updated.data, "channels"))
    end

    test "updates last_synced_at timestamp", %{actor: actor} do
      sync_time = ~U[2024-01-20 14:00:00.000000Z]

      {:ok, updated} =
        Ash.update(
          actor,
          %{last_synced_at: sync_time},
          action: :update_actor_state,
          authorize?: false
        )

      synced_at = Map.get(updated.data, "last_synced_at")

      auto_assert true <- is_binary(synced_at) and String.contains?(synced_at, "2024-01-20")
    end
  end

  describe "IncrementMessagesSent change" do
    setup do
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "discord_messages@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, actor} =
        DiscordActor.create(
          %{bot_token: "messages_test_token"},
          actor: user,
          authorize?: false
        )

      %{user: user, actor: actor}
    end

    test "increments message counter from zero", %{actor: actor} do
      initial_count = Map.get(actor.data, "messages_sent")

      {:ok, updated} =
        Ash.update(actor, %{}, action: :record_message_sent, authorize?: false)

      new_count = Map.get(updated.data, "messages_sent")

      auto_assert %{initial: 0, after_increment: 1} <- %{
                    initial: initial_count,
                    after_increment: new_count
                  }
    end

    test "increments message counter multiple times", %{actor: actor} do
      {:ok, after_first} =
        Ash.update(actor, %{}, action: :record_message_sent, authorize?: false)

      {:ok, after_second} =
        Ash.update(after_first, %{}, action: :record_message_sent, authorize?: false)

      {:ok, after_third} =
        Ash.update(after_second, %{}, action: :record_message_sent, authorize?: false)

      auto_assert 3 <- Map.get(after_third.data, "messages_sent")
    end
  end
end
