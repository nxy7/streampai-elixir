export default function LoadingIndicator() {
	return (
		<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
			<div class="text-center">
				{/* Spinner */}
				<div class="relative inline-flex">
					<div class="h-20 w-20 animate-spin rounded-full border-4 border-purple-200 border-t-purple-500"></div>
					<div
						class="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-r-pink-500"
						style="animation-direction: reverse; animation-duration: 1s;"></div>
				</div>

				{/* Logo/Text */}
				<div class="mt-6">
					<h1 class="mb-2 font-bold text-2xl text-white">Streampai</h1>
					<p class="animate-pulse text-purple-200 text-sm">Loading...</p>
				</div>
			</div>
		</div>
	);
}
