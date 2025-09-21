defmodule StreampaiWeb.SliderImageController do
  use StreampaiWeb, :controller

  def serve(conn, %{"path" => path}) do
    # Ensure path is safe and only contains valid filename characters
    safe_path = path |> List.first() |> Path.basename()

    if String.match?(safe_path, ~r/^slider_[a-f0-9\-]+_\d+_\d+\.(jpg|jpeg|png|gif|webp)$/i) do
      file_path =
        Path.join([
          Application.app_dir(:streampai),
          "priv",
          "static",
          "slider_images",
          safe_path
        ])

      if File.exists?(file_path) do
        conn
        |> put_resp_content_type(get_content_type(safe_path))
        |> put_resp_header("cache-control", "public, max-age=31536000")
        |> send_file(200, file_path)
      else
        conn
        |> put_status(:not_found)
        |> text("Image not found")
      end
    else
      conn
      |> put_status(:bad_request)
      |> text("Invalid file path")
    end
  end

  defp get_content_type(filename) do
    case filename |> Path.extname() |> String.downcase() do
      ".jpg" -> "image/jpeg"
      ".jpeg" -> "image/jpeg"
      ".png" -> "image/png"
      ".gif" -> "image/gif"
      ".webp" -> "image/webp"
      _ -> "application/octet-stream"
    end
  end
end
