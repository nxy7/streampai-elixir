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
import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { Show, createMemo } from "solid-js";
import { WidgetSettingsPage } from "~/components/WidgetSettingsPage";
import { Button } from "~/design-system";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { getWidgetDefinition } from "~/lib/widget-registry";

export const Route = createFileRoute("/dashboard/widgets/$slug")({
	component: WidgetSettingsRoute,
});

function WidgetSettingsRoute() {
	const params = Route.useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const widget = createMemo(() => getWidgetDefinition(params().slug));

	// Register breadcrumbs via context
	useBreadcrumbs(() => [
		{ label: t("dashboardNav.widgets"), href: "/dashboard/widgets" },
		{ label: widget()?.catalog.name ?? params().slug },
	]);

	return (
		<Show
			fallback={
				<div class="space-y-4 text-center">
					<h1 class={text.h1}>Widget Not Found</h1>
					<p class={text.muted}>The widget "{params().slug}" does not exist.</p>
					<Button
						onClick={() => navigate({ to: "/dashboard/widgets" })}
						type="button">
						Back to Widgets
					</Button>
				</div>
			}
			when={widget()}>
			{(def) => (
				<div class="space-y-4">
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
						widgetUrlPath={params().slug}
					/>
				</div>
			)}
		</Show>
	);
}
