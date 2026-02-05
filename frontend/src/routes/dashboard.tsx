import { Outlet, createFileRoute } from "@tanstack/solid-router";
import DashboardLayout from "~/components/DashboardLayout";
import { Skeleton } from "~/design-system";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayoutRoute,
	pendingComponent: DashboardPendingComponent,
	pendingMs: 0, // Show pending state immediately
	pendingMinMs: 200, // Show for at least 200ms to avoid flashing
	errorComponent: ({ error, reset }) => {
		console.error("[Dashboard] Route error:", error);
		return (
			<DashboardLayout>
				<div class="flex flex-col items-center justify-center p-12 text-center">
					<h2 class="mb-2 font-semibold text-lg text-neutral-200">
						Something went wrong
					</h2>
					<p class="mb-4 text-neutral-400 text-sm">
						{error instanceof Error ? error.message : String(error)}
					</p>
					<button
						class="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-hover"
						onClick={reset}
						type="button">
						Try again
					</button>
				</div>
			</DashboardLayout>
		);
	},
});

function DashboardLayoutRoute() {
	return (
		<DashboardLayout>
			<Outlet />
		</DashboardLayout>
	);
}

function DashboardPendingComponent() {
	return (
		<DashboardLayout>
			<div class="space-y-6 p-6">
				<Skeleton class="h-8 w-48" />
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Skeleton class="h-24 rounded-lg" />
					<Skeleton class="h-24 rounded-lg" />
					<Skeleton class="h-24 rounded-lg" />
					<Skeleton class="h-24 rounded-lg" />
				</div>
				<div class="grid gap-6 lg:grid-cols-2">
					<Skeleton class="h-64 rounded-lg" />
					<Skeleton class="h-64 rounded-lg" />
				</div>
			</div>
		</DashboardLayout>
	);
}
