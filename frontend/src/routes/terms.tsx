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

export default function Terms() {
	return (
		<>
			<Title>Terms of Service - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				<PageHeader title="Terms of Service" />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
							<div class="prose prose-invert max-w-none">
								<p class="mb-6 text-gray-300">
									Last updated: December 2024
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									1. Acceptance of Terms
								</h2>
								<p class="mb-6 text-gray-300">
									By accessing or using Streampai's services, you agree to be
									bound by these Terms of Service. If you do not agree to these
									terms, please do not use our services.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									2. Description of Service
								</h2>
								<p class="mb-6 text-gray-300">
									Streampai provides a multi-platform streaming management
									solution that allows users to stream content to multiple
									platforms simultaneously, manage unified chat, and access
									analytics across platforms.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									3. User Accounts
								</h2>
								<p class="mb-6 text-gray-300">
									You are responsible for maintaining the confidentiality of
									your account credentials and for all activities that occur
									under your account. You must notify us immediately of any
									unauthorized use of your account.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									4. Acceptable Use
								</h2>
								<p class="mb-4 text-gray-300">You agree not to:</p>
								<ul class="mb-6 list-disc space-y-2 pl-6 text-gray-300">
									<li>
										Use the service for any illegal or unauthorized purpose
									</li>
									<li>
										Violate any laws in your jurisdiction, including copyright
										laws
									</li>
									<li>Transmit harmful content or malware</li>
									<li>
										Interfere with or disrupt the service or servers connected
										to the service
									</li>
									<li>
										Attempt to gain unauthorized access to any part of the
										service
									</li>
								</ul>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									5. Content Responsibility
								</h2>
								<p class="mb-6 text-gray-300">
									You are solely responsible for the content you stream, share,
									or distribute through our platform. You retain all ownership
									rights to your content, but grant us a license to display and
									distribute it through our service.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									6. Third-Party Integrations
								</h2>
								<p class="mb-6 text-gray-300">
									Our service integrates with third-party platforms such as
									Twitch, YouTube, and others. Your use of these platforms is
									subject to their respective terms of service and privacy
									policies.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									7. Limitation of Liability
								</h2>
								<p class="mb-6 text-gray-300">
									Streampai shall not be liable for any indirect, incidental,
									special, consequential, or punitive damages resulting from
									your use of or inability to use the service.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									8. Modifications to Terms
								</h2>
								<p class="mb-6 text-gray-300">
									We reserve the right to modify these terms at any time. We
									will notify users of any material changes via email or through
									the service. Continued use of the service after such changes
									constitutes acceptance of the new terms.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									9. Termination
								</h2>
								<p class="mb-6 text-gray-300">
									We may terminate or suspend your account and access to the
									service immediately, without prior notice, for conduct that we
									believe violates these Terms of Service or is harmful to other
									users, us, or third parties.
								</p>

								<h2 class="mb-4 font-semibold text-2xl text-white">
									10. Contact Information
								</h2>
								<p class="text-gray-300">
									If you have any questions about these Terms of Service, please{" "}
									<A href="/contact" class="text-purple-400 hover:text-purple-300">
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
