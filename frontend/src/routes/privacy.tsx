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

export default function Privacy() {
	return (
		<>
			<Title>Privacy Policy - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				<PageHeader title="Privacy Policy" />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
							<div class="prose prose-invert max-w-none">
								<p class="mb-6 text-gray-300">Last updated: December 2024</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									1. Information We Collect
								</h2>
								<p class="mb-4 text-gray-300">
									We collect information you provide directly to us, including:
								</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>Account information (name, email, password)</li>
									<li>
										Profile information from connected streaming platforms
									</li>
									<li>Stream metadata and analytics data</li>
									<li>Chat messages and moderation actions</li>
									<li>
										Payment information (processed securely by third-party
										providers)
									</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									2. How We Use Your Information
								</h2>
								<p class="mb-4 text-gray-300">
									We use the information we collect to:
								</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>Provide, maintain, and improve our services</li>
									<li>
										Connect and sync your content across multiple streaming
										platforms
									</li>
									<li>
										Generate analytics and insights about your streaming
										performance
									</li>
									<li>Send you technical notices and support messages</li>
									<li>Respond to your comments and questions</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									3. Information Sharing
								</h2>
								<p class="mb-4 text-gray-300">
									We do not sell your personal information. We may share your
									information in the following circumstances:
								</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>
										With streaming platforms you connect (to enable
										multi-platform streaming)
									</li>
									<li>
										With service providers who assist in operating our platform
									</li>
									<li>When required by law or to protect our rights</li>
									<li>With your consent or at your direction</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									4. Data Security
								</h2>
								<p class="mb-6 text-gray-300">
									We implement appropriate technical and organizational measures
									to protect your personal information against unauthorized
									access, alteration, disclosure, or destruction. This includes
									encryption, secure protocols, and regular security audits.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									5. Third-Party Services
								</h2>
								<p class="mb-6 text-gray-300">
									Our service integrates with third-party streaming platforms
									(Twitch, YouTube, Kick, Facebook, etc.). When you connect
									these services, they may collect information according to
									their own privacy policies. We encourage you to review their
									privacy practices.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									6. Data Retention
								</h2>
								<p class="mb-6 text-gray-300">
									We retain your information for as long as your account is
									active or as needed to provide you services. You can request
									deletion of your account and associated data at any time by
									contacting us.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									7. Your Rights
								</h2>
								<p class="mb-4 text-gray-300">You have the right to:</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>Access the personal information we hold about you</li>
									<li>Request correction of inaccurate data</li>
									<li>Request deletion of your data</li>
									<li>Export your data in a portable format</li>
									<li>Opt out of marketing communications</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									8. Cookies and Tracking
								</h2>
								<p class="mb-6 text-gray-300">
									We use cookies and similar technologies to maintain your
									session, remember your preferences, and understand how you use
									our service. You can control cookie settings through your
									browser preferences.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									9. Children's Privacy
								</h2>
								<p class="mb-6 text-gray-300">
									Our service is not intended for users under 13 years of age.
									We do not knowingly collect personal information from children
									under 13.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									10. Changes to This Policy
								</h2>
								<p class="mb-6 text-gray-300">
									We may update this privacy policy from time to time. We will
									notify you of any changes by posting the new policy on this
									page and updating the "Last updated" date.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									11. Contact Us
								</h2>
								<p class="text-gray-300">
									If you have any questions about this Privacy Policy, please{" "}
									<A
										href="/contact"
										class="text-purple-400 hover:text-purple-300">
										contact us
									</A>
									.
								</p>
							</div>
						</div>
					</div>
				</main>

				<PageFooter />
			</div>
		</>
	);
}
