import { A } from "@solidjs/router";

interface PublicHeaderProps {
	title: string;
}

export default function PublicHeader(props: PublicHeaderProps) {
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
