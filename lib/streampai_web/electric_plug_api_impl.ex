# TEMPORARY FIX: Workaround for https://github.com/electric-sql/phoenix_sync/issues/117
# phoenix_sync's defimpl is guarded by Code.ensure_loaded? which fails due to
# dep compilation order. Remove this file once phoenix_sync fixes the issue upstream.
if Code.ensure_loaded?(Electric.Shapes.Api) &&
     Code.ensure_loaded?(Phoenix.Sync.Electric.ApiAdapter) &&
     !Protocol.consolidated?(Phoenix.Sync.Adapter.PlugApi) do
  defimpl Phoenix.Sync.Adapter.PlugApi, for: Electric.Shapes.Api do
    alias Electric.Shapes
    alias Electric.Shapes.Api.Response
    alias Phoenix.Sync.Electric.ApiAdapter
    alias Phoenix.Sync.PredefinedShape

    def predefined_shape(api, %PredefinedShape{} = shape) do
      ApiAdapter.new(api, shape)
    end

    def call(api, %{method: "GET"} = conn, params) do
      case Shapes.Api.validate(api, params) do
        {:ok, request} ->
          conn
          |> content_type()
          |> Plug.Conn.assign(:request, request)
          |> Shapes.Api.serve_shape_log(request)

        {:error, response} ->
          conn
          |> content_type()
          |> Response.send(response)
          |> Plug.Conn.halt()
      end
    end

    def call(api, %{method: "DELETE"} = conn, params) do
      case Shapes.Api.validate_for_delete(api, params) do
        {:ok, request} ->
          conn
          |> content_type()
          |> Plug.Conn.assign(:request, request)
          |> Shapes.Api.delete_shape(request)

        {:error, response} ->
          conn
          |> content_type()
          |> Response.send(response)
          |> Plug.Conn.halt()
      end
    end

    def call(_api, %{method: "OPTIONS"} = conn, _params) do
      Shapes.Api.options(conn)
    end

    def response(api, _conn, params) do
      case Shapes.Api.validate(api, params) do
        {:ok, request} ->
          {
            request,
            request
            |> Shapes.Api.serve_shape_log()
            |> Phoenix.Sync.Electric.consume_response_stream()
          }

        {:error, response} ->
          {nil, response}
      end
    end

    def send_response(%Electric.Shapes.Api{}, conn, {request, response}) do
      conn
      |> content_type()
      |> Plug.Conn.assign(:request, request)
      |> Plug.Conn.assign(:response, response)
      |> Response.send(response)
    end

    defp content_type(conn) do
      Plug.Conn.put_resp_content_type(conn, "application/json")
    end
  end
end
