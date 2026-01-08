defmodule StreampaiWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :streampai

  # Session options can be overridden at runtime via runtime.exs
  # Dev uses same_site: Lax, prod uses same_site: None for cross-subdomain cookies
  # The release sets validate_compile_env: false to allow this runtime override
  @session_options Application.compile_env(:streampai, :session_options,
                     store: :cookie,
                     key: "_streampai_key",
                     signing_salt: "streampai_session_salt",
                     same_site: "Lax"
                   )

  plug Plug.Static,
    at: "/",
    from: :streampai,
    gzip: false,
    only: StreampaiWeb.static_paths()

  if Code.ensure_loaded?(Tidewave) do
    plug Tidewave
  end

  socket "/api/socket", StreampaiWeb.UserSocket,
    websocket: [connect_info: [:user_agent, session: @session_options]],
    longpoll: false

  if code_reloading? do
    plug AshAi.Mcp.Dev,
      protocol_version_statement: "2024-11-05",
      otp_app: :streampai,
      path: "/ash_ai/mcp"

    plug Phoenix.CodeReloader
    plug AshPhoenix.Plug.CheckCodegenStatus
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :streampai
  end

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint], log: {__MODULE__, :log_level, []}

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug :cors
  plug Plug.Session, @session_options
  plug StreampaiWeb.Router

  def log_level(%{path_info: ["api", "shapes" | _]}), do: false
  def log_level(_), do: :info

  defp cors(conn, _opts) do
    # Allow frontend dev server, Caddy proxy, and production origins
    allowed_origins = [
      # Development
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:8000",
      "https://localhost:8001",
      # Production (frontend on root domain, API on subdomain)
      "https://streampai.com",
      "https://www.streampai.com"
    ]

    origin = conn |> get_req_header("origin") |> List.first()

    conn =
      if origin in allowed_origins do
        put_resp_header(conn, "access-control-allow-origin", origin)
      else
        conn
      end

    conn
    |> put_resp_header("access-control-allow-credentials", "true")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
    |> put_resp_header(
      "access-control-allow-headers",
      "content-type, authorization, x-csrf-token, x-request-id"
    )
    |> put_resp_header("access-control-max-age", "86400")
    |> handle_preflight()
  end

  defp handle_preflight(%{method: "OPTIONS"} = conn) do
    conn
    |> send_resp(200, "")
    |> halt()
  end

  defp handle_preflight(conn), do: conn
end
