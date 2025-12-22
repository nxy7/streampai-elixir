defmodule StreampaiWeb.GraphQL.Resolvers.FileResolver do
  @moduledoc """
  GraphQL resolver for file upload operations.
  """

  alias Streampai.Storage.File
  alias Streampai.Storage.Adapters.S3

  def request_upload(_parent, args, resolution) do
    actor = resolution.context[:actor]

    file_type =
      case args[:file_type] do
        "avatar" -> :avatar
        "thumbnail" -> :thumbnail
        "video" -> :video
        _ -> :other
      end

    case File.request_upload(
           %{
             filename: args.filename,
             content_type: args[:content_type] || "application/octet-stream",
             file_type: file_type,
             estimated_size: args.estimated_size
           },
           actor: actor
         ) do
      {:ok, file} ->
        headers =
          file.__metadata__.upload_headers
          |> Enum.map(fn {k, v} -> %{key: k, value: v} end)

        {:ok,
         %{
           id: file.id,
           upload_url: file.__metadata__.upload_url,
           upload_headers: headers,
           max_size: file.__metadata__.max_size
         }}

      {:error, error} ->
        {:error, Exception.message(error)}
    end
  end

  def confirm_upload(_parent, args, resolution) do
    actor = resolution.context[:actor]

    with {:ok, file} <- File.get_by_id(%{id: args.file_id}, actor: actor),
         {:ok, uploaded_file} <- File.mark_uploaded(file, %{content_hash: args[:content_hash]}, actor: actor) do
      url = S3.get_url(uploaded_file.storage_key)
      {:ok, %{id: uploaded_file.id, url: url}}
    else
      {:error, error} ->
        {:error, Exception.message(error)}
    end
  end
end
