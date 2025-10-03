defmodule Streampai.Jobs.ProcessFinishedLivestreamJob do
  @moduledoc """
  Oban job that processes finished livestream events.

  This job is scheduled immediately when a livestream ends (when ended_at is set).
  Currently, it just logs the livestream ID as a placeholder for future processing.
  """
  use Oban.Worker,
    queue: :default,
    max_attempts: 3,
    tags: ["livestream", "post-stream"]

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    %{"livestream_id" => livestream_id} = args

    Logger.info("Processing finished livestream: #{livestream_id}")

    :ok
  end
end
