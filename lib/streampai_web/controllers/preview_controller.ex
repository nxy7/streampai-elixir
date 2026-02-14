defmodule StreampaiWeb.PreviewController do
  @moduledoc """
  Serves HLS manifest and segment files for Membrane stream preview.

  Files are read from the per-user temp directory where the Membrane pipeline
  writes HLS segments via `Membrane.HTTPAdaptiveStream.Storages.FileStorage`.
  """
  use StreampaiWeb, :controller

  @allowed_extensions ~w(.m3u8 .m4s .mp4)

  def serve(conn, %{"user_id" => user_id, "filename" => filename_parts}) do
    filename = Path.join(filename_parts)
    ext = Path.extname(filename)

    with true <- ext in @allowed_extensions,
         true <- Regex.match?(~r/\A[0-9a-f-]{36}\z/, user_id),
         true <- filename == Path.basename(filename) do
      hls_dir = Path.join(System.tmp_dir!(), "streampai_hls/#{user_id}")
      file_path = Path.join(hls_dir, filename)

      if File.exists?(file_path) do
        conn
        |> put_resp_header("content-type", content_type_for(ext))
        |> put_resp_header("access-control-allow-origin", "*")
        |> put_resp_header("cache-control", cache_control_for(ext))
        |> send_file(200, file_path)
      else
        send_resp(conn, 404, "Not found")
      end
    else
      _ -> conn |> send_resp(400, "Bad request") |> halt()
    end
  end

  defp content_type_for(".m3u8"), do: "application/vnd.apple.mpegurl"
  defp content_type_for(".m4s"), do: "video/mp4"
  defp content_type_for(".mp4"), do: "video/mp4"
  defp content_type_for(_), do: "application/octet-stream"

  defp cache_control_for(".m3u8"), do: "no-cache, no-store"
  defp cache_control_for(_), do: "public, max-age=60"
end
