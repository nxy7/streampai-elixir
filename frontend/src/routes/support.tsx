import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

export const route = {
	prerender: true,
};

function PageHeader(props: { title: string }) {
	return (
		<nav class="border-white/10 border-b bg-black/20">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between py-4">
					<A href="/" class="flex items-center space-x-2">
						<img
							src="/images/logo-white.png"
							alt="Streampai Logo"
							class="h-8 w-8"
						/>
						<span class="font-bold text-white text-xl">Streampai</span>
					</A>
					<h1 class="font-semibold text-white text-xl">{props.title}</h1>
				</div>
			</div>
		</nav>
	);
}

function PageFooter() {
	const currentYear = new Date().getFullYear();

	return (
		<footer class="border-white/10 border-t bg-black/40 py-8">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<A href="/" class="flex items-center space-x-2">
						<img
							src="/images/logo-white.png"
							alt="Streampai Logo"
							class="h-6 w-6"
						/>
						<span class="font-bold text-white">Streampai</span>
					</A>
					<div class="flex space-x-6 text-gray-300 text-sm">
						<A href="/privacy" class="transition-colors hover:text-white">
							Privacy
						</A>
						<A href="/terms" class="transition-colors hover:text-white">
							Terms
						</A>
						<A href="/support" class="transition-colors hover:text-white">
							Support
						</A>
						<A href="/contact" class="transition-colors hover:text-white">
							Contact
						</A>
					</div>
				</div>
				<div class="mt-6 text-center text-gray-400 text-sm">
					<p>&copy; {currentYear} Streampai. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

export default function Support() {
	return (
		<>
			<Title>Support - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				<PageHeader title="Support" />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="mb-8 text-center">
							<h2 class="mb-4 font-bold text-3xl text-white">
								How can we help you?
							</h2>
							<p class="text-gray-300 text-lg">
								Find answers to common questions or reach out to our support
								team.
							</p>
						</div>

						<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg transition-all hover:bg-white/10">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-purple-500 to-pink-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-white text-xl">
									Documentation
								</h3>
								<p class="mb-4 text-gray-300">
									Comprehensive guides and tutorials to help you get the most
									out of Streampai.
								</p>
								<span class="text-purple-400">Coming soon</span>
							</div>

							<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg transition-all hover:bg-white/10">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-white text-xl">FAQ</h3>
								<p class="mb-4 text-gray-300">
									Quick answers to frequently asked questions about our service.
								</p>
								<span class="text-purple-400">Coming soon</span>
							</div>

							<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg transition-all hover:bg-white/10">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-white text-xl">
									Community Discord
								</h3>
								<p class="mb-4 text-gray-300">
									Join our Discord server to connect with other streamers and
									get community support.
								</p>
								<span class="text-purple-400">Coming soon</span>
							</div>

							<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg transition-all hover:bg-white/10">
								<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-orange-500 to-red-500">
									<svg
										aria-hidden="true"
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<h3 class="mb-2 font-semibold text-white text-xl">
									Email Support
								</h3>
								<p class="mb-4 text-gray-300">
									Reach out to our support team directly for personalized
									assistance.
								</p>
								<A
									href="/contact"
									class="text-purple-400 transition-colors hover:text-purple-300">
									Contact us
								</A>
							</div>
						</div>

						<div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
							<h3 class="mb-6 font-semibold text-2xl text-white">
								Frequently Asked Questions
							</h3>

							<div class="space-y-6">
								<div>
									<h4 class="mb-2 font-medium text-lg text-white">
										What platforms does Streampai support?
									</h4>
									<p class="text-gray-300">
										Streampai supports multi-platform streaming to Twitch,
										YouTube, Kick, Facebook, and more. We're constantly adding
										new platform integrations.
									</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-white">
										How do I connect my streaming accounts?
									</h4>
									<p class="text-gray-300">
										After signing up, go to your dashboard settings and click on
										"Connect Accounts". Follow the OAuth prompts to securely
										link your streaming platform accounts.
									</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-white">
										Is my data secure?
									</h4>
									<p class="text-gray-300">
										Yes, we take security seriously. All data is encrypted in
										transit and at rest. We never store your streaming platform
										passwords - we use secure OAuth tokens for authentication.
										Read our{" "}
										<A
											href="/privacy"
											class="text-purple-400 hover:text-purple-300">
											Privacy Policy
										</A>{" "}
										for more details.
									</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-white">
										Can I cancel my subscription anytime?
									</h4>
									<p class="text-gray-300">
										Yes, you can cancel your subscription at any time from your
										account settings. You'll continue to have access until the
										end of your billing period.
									</p>
								</div>

								<div>
									<h4 class="mb-2 font-medium text-lg text-white">
										How do I report a bug or request a feature?
									</h4>
									<p class="text-gray-300">
										We love hearing from our users! Please{" "}
										<A
											href="/contact"
											class="text-purple-400 hover:text-purple-300">
											contact us
										</A>{" "}
										with bug reports or feature requests. You can also join our
										Discord community to discuss ideas with other users.
									</p>
								</div>
							</div>
						</div>
					</div>
				</main>

				<PageFooter />
			</div>
		</>
	);
}
