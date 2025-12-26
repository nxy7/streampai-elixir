import { For, Show } from "solid-js";

interface Donor {
	id: string;
	username: string;
	amount: number;
	currency: string;
}

interface TopDonorsConfig {
	title: string;
	topCount: number;
	fontSize: number;
	showAmounts: boolean;
	showRanking: boolean;
	backgroundColor: string;
	textColor: string;
	highlightColor: string;
}

interface TopDonorsWidgetProps {
	config: TopDonorsConfig;
	donors: Donor[];
}

export default function TopDonorsWidget(props: TopDonorsWidgetProps) {
	const displayedDonors = () => {
		return (props.donors || [])
			.sort((a, b) => b.amount - a.amount)
			.slice(0, props.config.topCount);
	};

	const getDonorRankEmoji = (index: number): string => {
		switch (index) {
			case 0:
				return "👑";
			case 1:
				return "🥈";
			case 2:
				return "🥉";
			default:
				return "🎖️";
		}
	};

	const getDonorSizeClass = (index: number): string => {
		switch (index) {
			case 0:
				return "top-1";
			case 1:
				return "top-2";
			case 2:
				return "top-3";
			default:
				return "regular";
		}
	};

	const formatAmount = (amount: number, currency: string): string => {
		return `${currency}${amount.toLocaleString("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	};

	return (
		<div
			class="widget-container"
			style={{
				"font-family":
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
			}}
		>
			<div
				class="top-donors-widget"
				style={{
					"--bg-color": props.config.backgroundColor || "#1f2937",
					"--text-color": props.config.textColor || "#ffffff",
					"--highlight-color": props.config.highlightColor || "#ffd700",
					"font-size": `${props.config.fontSize}px`,
				}}
			>
				<div class="widget-title">
					<div class="title-glow"></div>
					<span class="title-text">
						{props.config.title || "🏆 Top Donors"}
					</span>
					<div class="title-decoration"></div>
				</div>

				<div class="donors-list">
					<div class="donors-container">
						<For each={displayedDonors()}>
							{(donor, index) => (
								<div
									class={`donor-item ${getDonorSizeClass(index())} ${index() === 2 ? "last-podium" : ""}`}
								>
									<Show when={props.config.showRanking}>
										<div class="donor-rank">
											<span class="rank-emoji">
												{getDonorRankEmoji(index())}
											</span>
											<span class="rank-number">{index() + 1}</span>
										</div>
									</Show>

									<div class="donor-info">
										<div class="donor-name">{donor.username}</div>
										<Show when={props.config.showAmounts}>
											<div class="donor-amount">
												{formatAmount(donor.amount, donor.currency)}
											</div>
										</Show>
									</div>

									<Show when={index() < 3}>
										<div class="donor-glow"></div>
									</Show>
								</div>
							)}
						</For>
					</div>
				</div>
			</div>

			<style>{`
        .widget-container {
          width: 100%;
          height: 100%;
          container-type: size;
          container-name: widget;
        }

        .top-donors-widget {
          padding: 1.5rem;
          border-radius: 1.25rem;
          background: linear-gradient(145deg, var(--bg-color), color-mix(in srgb, var(--bg-color) 90%, white));
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          width: 100%;
          max-width: 380px;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-sizing: border-box;
        }

        .widget-title {
          position: relative;
          text-align: center;
          margin-bottom: 1rem;
          overflow: hidden;
          flex-shrink: 0;
        }

        .title-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
          border-radius: 0.5rem;
          opacity: 0;
          animation: titleGlow 4s ease-in-out infinite;
        }

        @keyframes titleGlow {
          0%,
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            transform: translateX(100%);
            opacity: 1;
          }
        }

        .title-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-color);
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, var(--text-color), var(--highlight-color));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .title-decoration {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, var(--highlight-color), #ffed4e, var(--highlight-color));
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .donors-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          position: relative;
        }

        .donors-list::-webkit-scrollbar {
          width: 6px;
        }

        .donors-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .donors-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .donors-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .donors-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          min-height: 0;
        }

        .donor-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .donor-item.last-podium {
          margin-bottom: 1.5rem;
        }

        .donor-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .donor-item.top-1 {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
          border-color: rgba(255, 215, 0, 0.3);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }

        .donor-item.top-2 {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
          border-color: rgba(192, 192, 192, 0.3);
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.2);
        }

        .donor-item.top-3 {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
          border-color: rgba(205, 127, 50, 0.3);
          box-shadow: 0 0 12px rgba(205, 127, 50, 0.2);
        }

        .donor-glow {
          position: absolute;
          inset: -2px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
          border-radius: 1rem;
          opacity: 0.5;
          filter: blur(8px);
          animation: donorGlow 3s ease-in-out infinite;
          z-index: -1;
        }

        @keyframes donorGlow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }

        .donor-rank {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 3rem;
        }

        .rank-emoji {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .rank-number {
          font-size: 0.875rem;
          font-weight: 700;
          color: color-mix(in srgb, var(--text-color) 70%, transparent);
          line-height: 1;
        }

        .donor-info {
          flex: 1;
          min-width: 0;
        }

        .donor-name {
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.25rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          word-break: break-word;
        }

        .donor-amount {
          font-size: 0.875rem;
          font-weight: 600;
          color: #10b981;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .top-1 .donor-name {
          font-size: 1.125rem;
        }

        .top-2 .donor-name {
          font-size: 1.0625rem;
        }

        .top-3 .donor-name {
          font-size: 1.03125rem;
        }

        @container widget (max-width: 300px) {
          .top-donors-widget {
            padding: 1rem;
          }

          .donor-item {
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .rank-emoji {
            font-size: 1.25rem;
          }

          .donor-name {
            font-size: 0.9375rem;
          }

          .top-1 .donor-name {
            font-size: 1rem;
          }
        }

        @container widget (max-height: 400px) {
          .donors-container {
            gap: 0.5rem;
          }

          .donor-item {
            padding: 0.75rem;
          }
        }
      `}</style>
		</div>
	);
}
