import { context, propagation, trace } from "@opentelemetry/api";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	BatchSpanProcessor,
	WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { getApiBase } from "./constants";

let initialized = false;

export function initTracing() {
	if (initialized || typeof window === "undefined") return;
	initialized = true;

	const apiBase = getApiBase();
	// Send traces to OTel Collector via the backend proxy or directly
	const collectorUrl =
		typeof window !== "undefined" && apiBase !== window.location.origin
			? `${apiBase.replace(/:\d+$/, ":4318")}/v1/traces`
			: "http://localhost:4318/v1/traces";

	const provider = new WebTracerProvider({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: "streampai-frontend",
		}),
		spanProcessors: [
			new BatchSpanProcessor(
				new OTLPTraceExporter({
					url: collectorUrl,
				}),
			),
		],
	});

	provider.register({
		contextManager: new ZoneContextManager(),
	});
}

/**
 * Get W3C traceparent header value from the current OTel context.
 * Returns undefined if no active span exists.
 */
export function getTraceparentHeader(): Record<string, string> {
	const carrier: Record<string, string> = {};
	propagation.inject(context.active(), carrier);
	return carrier;
}

/**
 * Get the tracer instance for creating custom spans.
 */
export function getTracer() {
	return trace.getTracer("streampai-frontend");
}
