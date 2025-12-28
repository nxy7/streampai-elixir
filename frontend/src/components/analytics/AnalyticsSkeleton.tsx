import { For } from "solid-js";
import {
	Card,
	CardContent,
	CardHeader,
	Skeleton,
	SkeletonChart,
	SkeletonTableRow,
} from "~/components/ui";

export function AnalyticsSkeleton() {
	return (
		<div class="space-y-6">
			{/* Header skeleton */}
			<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<Skeleton class="mb-2 h-8 w-48" />
					<Skeleton class="h-4 w-72" />
				</div>
				<Skeleton class="h-10 w-40 rounded-md" />
			</div>

			{/* Charts skeleton */}
			<Card>
				<SkeletonChart />
			</Card>

			<Card>
				<div class="space-y-4">
					<Skeleton class="h-5 w-40" />
					<For each={[1, 2, 3, 4]}>
						{() => (
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Skeleton class="h-4 w-20" />
									<Skeleton class="h-4 w-12" />
								</div>
								<Skeleton class="h-2 w-full rounded-full" />
							</div>
						)}
					</For>
				</div>
			</Card>

			{/* Table skeleton */}
			<Card>
				<CardHeader>
					<Skeleton class="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div class="-mx-6 overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<For each={[1, 2, 3, 4, 5, 6]}>
										{() => (
											<th class="px-6 py-3">
												<Skeleton class="h-4 w-20" />
											</th>
										)}
									</For>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								<For each={[1, 2, 3, 4, 5]}>
									{() => <SkeletonTableRow columns={6} />}
								</For>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
