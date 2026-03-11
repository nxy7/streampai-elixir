defmodule Streampai.OtelAshTracer do
  @moduledoc false
  @behaviour Ash.Tracer

  require OpenTelemetry.Tracer, as: Tracer

  @impl true
  def start_span(type, name) do
    Tracer.start_span(name, %{attributes: [{"ash.span_type", to_string(type)}]})
    :ok
  end

  @impl true
  def stop_span do
    Tracer.end_span()
    :ok
  end

  @impl true
  def get_span_context do
    OpenTelemetry.Ctx.get_current()
  end

  @impl true
  def set_span_context(context) do
    OpenTelemetry.Ctx.attach(context)
    :ok
  end

  @impl true
  def set_metadata(_type, metadata) do
    attrs =
      Enum.flat_map(metadata, fn
        {:domain, nil} -> []
        {:domain, domain} -> [{"ash.domain", inspect(domain)}]
        {:resource, nil} -> []
        {:resource, resource} -> [{"ash.resource", inspect(resource)}]
        {:action, nil} -> []
        {:action, action} -> [{"ash.action", to_string(action)}]
        {:actor, nil} -> []
        {:actor, _actor} -> [{"ash.has_actor", true}]
        {:authorize?, val} -> [{"ash.authorize", val}]
        _ -> []
      end)

    Tracer.set_attributes(attrs)
    :ok
  end

  @impl true
  def set_error(exception, _opts \\ []) do
    Tracer.set_status(:error, Exception.message(exception))
    Tracer.record_exception(exception)
    :ok
  end

  @impl true
  def set_handled_error(exception, _opts \\ []) do
    Tracer.add_event("handled_error", [{"error.message", Exception.message(exception)}])
    :ok
  end

  @impl true
  def trace_type?(_type), do: true
end
