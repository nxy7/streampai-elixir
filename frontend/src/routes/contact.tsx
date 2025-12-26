import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createSignal } from "solid-js";

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

export default function Contact() {
	const [name, setName] = createSignal("");
	const [email, setEmail] = createSignal("");
	const [subject, setSubject] = createSignal("");
	const [message, setMessage] = createSignal("");
	const [status, setStatus] = createSignal<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [statusMessage, setStatusMessage] = createSignal("");

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setStatus("loading");

		// TODO: Implement contact form submission via RPC
		setTimeout(() => {
			setStatus("success");
			setStatusMessage(
				"Thank you for your message! We'll get back to you soon.",
			);
			setName("");
			setEmail("");
			setSubject("");
			setMessage("");
			setTimeout(() => setStatus("idle"), 5000);
		}, 1000);
	};

	return (
		<>
			<Title>Contact Us - Streampai</Title>
			<div class="flex min-h-screen flex-col bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
				<PageHeader title="Contact Us" />

				<main class="flex-1 py-12">
					<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div class="mb-8 text-center">
							<h2 class="mb-4 font-bold text-3xl text-white">Get in Touch</h2>
							<p class="text-gray-300 text-lg">
								Have a question, suggestion, or need help? We'd love to hear
								from you.
							</p>
						</div>

						<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
							<div class="space-y-6 lg:col-span-1">
								<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
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
												d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<h3 class="mb-2 font-semibold text-lg text-white">Email</h3>
									<p class="text-gray-300">support@streampai.com</p>
								</div>

								<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
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
												d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
											/>
										</svg>
									</div>
									<h3 class="mb-2 font-semibold text-lg text-white">Discord</h3>
									<p class="text-gray-300">Join our community</p>
									<span class="text-purple-400 text-sm">Coming soon</span>
								</div>

								<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
									<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
										<svg
											aria-hidden="true"
											class="h-6 w-6 text-white"
											fill="currentColor"
											viewBox="0 0 24 24">
											<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
										</svg>
									</div>
									<h3 class="mb-2 font-semibold text-lg text-white">GitHub</h3>
									<p class="text-gray-300">Report issues</p>
									<span class="text-purple-400 text-sm">Coming soon</span>
								</div>
							</div>

							<div class="lg:col-span-2">
								<div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
									<h3 class="mb-6 font-semibold text-xl text-white">
										Send us a message
									</h3>

									<form onSubmit={handleSubmit} class="space-y-6">
										<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
											<div>
												<label
													for="name"
													class="mb-2 block font-medium text-sm text-white">
													Name
												</label>
												<input
													type="text"
													id="name"
													value={name()}
													onInput={(e) => setName(e.currentTarget.value)}
													required
													class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
													placeholder="Your name"
												/>
											</div>
											<div>
												<label
													for="email"
													class="mb-2 block font-medium text-sm text-white">
													Email
												</label>
												<input
													type="email"
													id="email"
													value={email()}
													onInput={(e) => setEmail(e.currentTarget.value)}
													required
													class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
													placeholder="your@email.com"
												/>
											</div>
										</div>

										<div>
											<label
												for="subject"
												class="mb-2 block font-medium text-sm text-white">
												Subject
											</label>
											<select
												id="subject"
												value={subject()}
												onChange={(e) => setSubject(e.currentTarget.value)}
												required
												class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500">
												<option value="" class="bg-gray-800">
													Select a topic
												</option>
												<option value="general" class="bg-gray-800">
													General Inquiry
												</option>
												<option value="support" class="bg-gray-800">
													Technical Support
												</option>
												<option value="billing" class="bg-gray-800">
													Billing Question
												</option>
												<option value="feature" class="bg-gray-800">
													Feature Request
												</option>
												<option value="bug" class="bg-gray-800">
													Bug Report
												</option>
												<option value="partnership" class="bg-gray-800">
													Partnership
												</option>
											</select>
										</div>

										<div>
											<label
												for="message"
												class="mb-2 block font-medium text-sm text-white">
												Message
											</label>
											<textarea
												id="message"
												value={message()}
												onInput={(e) => setMessage(e.currentTarget.value)}
												required
												rows={6}
												class="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
												placeholder="How can we help you?"
											/>
										</div>

										<button
											type="submit"
											disabled={status() === "loading"}
											class="w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:opacity-50">
											{status() === "loading" ? "Sending..." : "Send Message"}
										</button>

										{status() === "success" && (
											<div class="rounded-lg bg-green-500/20 p-4 text-center text-green-400">
												{statusMessage()}
											</div>
										)}

										{status() === "error" && (
											<div class="rounded-lg bg-red-500/20 p-4 text-center text-red-400">
												{statusMessage()}
											</div>
										)}
									</form>
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
