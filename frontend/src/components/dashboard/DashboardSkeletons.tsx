import { For } from "solid-js";
import {
	Skeleton,
	SkeletonListItem,
	SkeletonMetricCard,
	SkeletonStat,
	SkeletonStreamCard,
} from "~/design-system";
import Card from "~/design-system/Card";

// Skeleton for Quick Stats grid
export function QuickStatsSkeleton() {
	return (
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<For each={[1, 2, 3, 4]}>
				{() => (
					<Card padding="sm">
						<SkeletonStat showIcon />
					</Card>
				)}
			</For>
		</div>
	);
}

// Skeleton for Recent Chat section
export function RecentChatSkeleton() {
	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
				<Skeleton class="h-5 w-28" />
				<Skeleton class="h-4 w-16" />
			</div>
			<div class="divide-y divide-neutral-100">
				<For each={[1, 2, 3, 4, 5]}>
					{() => (
						<div class="px-6 py-3">
							<SkeletonListItem lines={2} showAvatar />
						</div>
					)}
				</For>
			</div>
		</Card>
	);
}

// Skeleton for Recent Events section
export function RecentEventsSkeleton() {
	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-4 w-16" />
			</div>
			<div class="divide-y divide-neutral-100">
				<For each={[1, 2, 3, 4, 5]}>
					{() => (
						<div class="px-6 py-3">
							<SkeletonListItem lines={2} showAvatar />
						</div>
					)}
				</For>
			</div>
		</Card>
	);
}

// Skeleton for Activity Feed
export function ActivityFeedSkeleton() {
	return (
		<Card padding="none">
			<div class="border-neutral-100 border-b px-4 py-3">
				<div class="mb-3 flex items-center justify-between">
					<Skeleton class="h-5 w-28" />
					<Skeleton class="h-4 w-16" />
				</div>
				<div class="flex flex-wrap gap-1">
					<For each={[1, 2, 3, 4, 5]}>
						{() => <Skeleton class="h-7 w-20 rounded-full" />}
					</For>
				</div>
			</div>
			<div class="divide-y divide-neutral-50">
				<For each={[1, 2, 3, 4, 5]}>
					{() => (
						<div class="flex items-center gap-3 px-4 py-2.5">
							<Skeleton circle class="h-8 w-8 shrink-0" />
							<div class="min-w-0 flex-1 space-y-1.5">
								<div class="flex items-center gap-2">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-3 w-12" />
								</div>
								<Skeleton class="h-3 w-24" />
							</div>
						</div>
					)}
				</For>
			</div>
		</Card>
	);
}

// Skeleton for Recent Streams section
export function RecentStreamsSkeleton() {
	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-4 w-16" />
			</div>
			<div class="divide-y divide-neutral-100">
				<For each={[1, 2, 3]}>{() => <SkeletonStreamCard />}</For>
			</div>
		</Card>
	);
}

// Full dashboard loading skeleton
export function DashboardLoadingSkeleton() {
	return (
		<div class="space-y-6">
			{/* Header skeleton */}
			<div class="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
				<Skeleton class="mb-2 h-9 w-64" />
				<Skeleton class="h-5 w-48" />
			</div>

			{/* Quick Stats skeleton */}
			<QuickStatsSkeleton />

			{/* Metric cards skeleton */}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<SkeletonMetricCard rows={3} />
				<SkeletonMetricCard rows={1} />
				<SkeletonMetricCard rows={3} />
			</div>

			{/* Main content grid skeleton */}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RecentChatSkeleton />
				<RecentEventsSkeleton />
			</div>

			{/* Activity feed skeleton */}
			<ActivityFeedSkeleton />

			{/* Recent streams skeleton */}
			<RecentStreamsSkeleton />
		</div>
	);
}
