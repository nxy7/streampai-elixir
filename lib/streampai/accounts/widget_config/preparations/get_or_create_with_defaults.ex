defmodule Streampai.Accounts.WidgetConfig.Preparations.GetOrCreateWithDefaults do
  @moduledoc """
  Preparation for getting widget config or creating with defaults merged.
  """
  use Ash.Resource.Preparation

  alias Streampai.Accounts.WidgetConfig
  alias Streampai.Fake
  alias StreampaiWeb.Utils.MapUtils

  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, results ->
      widget_type = Ash.Query.get_argument(query, :type)
      default_config = get_default_config(widget_type)

      case results do
        [] ->
          default_record = %WidgetConfig{
            user_id: Ash.Query.get_argument(query, :user_id),
            type: Ash.Query.get_argument(query, :type),
            config: default_config
          }

          {:ok, [default_record]}

        [result] ->
          merged_config =
            Map.merge(default_config, MapUtils.to_atom_keys(result.config))

          updated_result = %{result | config: merged_config}

          {:ok, [updated_result]}
      end
    end)
  end

  # Helper functions for default config based on widget type
  defp get_default_config(:chat_widget), do: Fake.Chat.default_config()
  defp get_default_config(:alertbox_widget), do: Fake.Alert.default_config()
  defp get_default_config(:donation_goal_widget), do: Fake.DonationGoal.default_config()
  defp get_default_config(:top_donors_widget), do: Fake.TopDonors.default_config()
  defp get_default_config(:viewer_count_widget), do: Fake.ViewerCount.default_config()
  defp get_default_config(:follower_count_widget), do: Fake.FollowerCount.default_config()
  defp get_default_config(_), do: %{}
end
