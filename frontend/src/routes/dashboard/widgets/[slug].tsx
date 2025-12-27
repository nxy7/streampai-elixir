/**
 * Dynamic Widget Settings Page
 *
 * This route handles all widget settings pages using the widget registry.
 * The slug parameter maps to a widget definition that contains the schema,
 * metadata, component, and any custom preview behavior.
 *
 * URL: /dashboard/widgets/:slug
 * Examples:
 *   /dashboard/widgets/timer
 *   /dashboard/widgets/alertbox
 *   /dashboard/widgets/donation-goal
 */
import { useParams, useNavigate } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import { getWidgetDefinition } from "~/lib/widget-registry";
import { text, button } from "~/styles/design-system";

export default function WidgetSettingsRoute() {
	const params = useParams<{ slug: string }>();
	const navigate = useNavigate();

	const widget = createMemo(() => getWidgetDefinition(params.slug));

	return (
		<Show
			when={widget()}
			fallback={
				<div class="space-y-4 text-center">
					<h1 class={text.h1}>Widget Not Found</h1>
					<p class={text.muted}>
						The widget "{params.slug}" does not exist.
					</p>
					<button
						type="button"
						class={button.primary}
						onClick={() => navigate("/dashboard/widgets")}
					>
						Back to Widgets
					</button>
				</div>
			}
		>
			{(def) => (
				<WidgetSettingsPage
					title={def().title}
					description={def().description}
					widgetType={def().widgetType}
					widgetUrlPath={params.slug}
					schema={def().schema}
					meta={def().meta}
					PreviewComponent={def().component}
					previewProps={def().previewProps}
					previewWrapper={def().previewWrapper}
					obsSettings={def().obsSettings}
				/>
			)}
		</Show>
	);
}
