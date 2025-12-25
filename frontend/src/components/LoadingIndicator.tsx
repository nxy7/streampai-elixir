export default function LoadingIndicator() {
  return (
    <div class="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div class="text-center">
        {/* Spinner */}
        <div class="relative inline-flex">
          <div class="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
          <div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-pink-500 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1s;"></div>
        </div>

        {/* Logo/Text */}
        <div class="mt-6">
          <h1 class="text-2xl font-bold text-white mb-2">Streampai</h1>
          <p class="text-purple-200 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    </div>
  );
}
