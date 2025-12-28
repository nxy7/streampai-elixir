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
import { useNavigate, useParams } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import Button from "~/components/ui/Button";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import { getWidgetDefinition } from "~/lib/widget-registry";
import { text } from "~/styles/design-system";

export default function WidgetSettingsRoute() {
	const params = useParams<{ slug: string }>();
	const navigate = useNavigate();

	const widget = createMemo(() => getWidgetDefinition(params.slug));

	return (
		<Show
			fallback={
				<div class="space-y-4 text-center">
					<h1 class={text.h1}>Widget Not Found</h1>
					<p class={text.muted}>The widget "{params.slug}" does not exist.</p>
					<Button onClick={() => navigate("/dashboard/widgets")} type="button">
						Back to Widgets
					</Button>
				</div>
			}
			when={widget()}>
			{(def) => (
				<WidgetSettingsPage
					description={def().description}
					meta={def().meta}
					obsSettings={def().obsSettings}
					PreviewComponent={def().component}
					previewProps={def().previewProps}
					previewWrapper={def().previewWrapper}
					schema={def().schema}
					title={def().title}
					widgetType={def().widgetType}
					widgetUrlPath={params.slug}
				/>
			)}
		</Show>
	);
}
