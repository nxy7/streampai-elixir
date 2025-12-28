import { Show } from "solid-js";
import { card } from "~/styles/design-system";
import type {
	ActivityItem,
	ModerationCallbacks,
	Platform,
	StreamActionCallbacks,
	StreamKeyData,
	StreamMetadata,
	StreamPhase,
	StreamSummary,
	StreamTimer,
	TimerActionCallbacks,
} from "./stream";
import {
	LiveStreamControlCenter,
	PostStreamSummary,
	PreStreamSettings,
} from "./stream";

// Re-export types for backwards compatibility
export type {
	ActivityItem,
	ActivityType,
	ModerationCallbacks,
	Platform,
	StreamActionCallbacks,
	StreamKeyData,
	StreamMetadata,
	StreamPhase,
	StreamSummary,
	StreamTimer,
	TimerActionCallbacks,
} from "./stream";

// Re-export components for backwards compatibility
export { LiveStreamControlCenter, PostStreamSummary, PreStreamSettings };

interface StreamControlsWidgetProps
	extends StreamActionCallbacks,
		TimerActionCallbacks {
	phase: StreamPhase;
	// Pre-stream props
	metadata?: StreamMetadata;
	onMetadataChange?: (metadata: StreamMetadata) => void;
	streamKeyData?: StreamKeyData;
	onShowStreamKey?: () => void;
	showStreamKey?: boolean;
	isLoadingStreamKey?: boolean;
	onCopyStreamKey?: () => void;
	copied?: boolean;
	// Live props
	activities?: ActivityItem[];
	streamDuration?: number;
	viewerCount?: number;
	stickyDuration?: number;
	connectedPlatforms?: Platform[];
	onSendMessage?: (message: string, platforms: Platform[]) => void;
	moderationCallbacks?: ModerationCallbacks;
	timers?: StreamTimer[];
	// Post-stream props
	summary?: StreamSummary;
	onStartNewStream?: () => void;
}

export default function StreamControlsWidget(props: StreamControlsWidgetProps) {
	return (
		<div class={`${card.default} h-full`}>
			<Show when={props.phase === "pre-stream"}>
				<PreStreamSettings
					copied={props.copied}
					isLoadingStreamKey={props.isLoadingStreamKey}
					metadata={
						props.metadata || {
							title: "",
							description: "",
							category: "",
							tags: [],
						}
					}
					onCopyStreamKey={props.onCopyStreamKey}
					onMetadataChange={props.onMetadataChange || (() => {})}
					onShowStreamKey={props.onShowStreamKey}
					showStreamKey={props.showStreamKey}
					streamKeyData={props.streamKeyData}
				/>
			</Show>

			<Show when={props.phase === "live"}>
				<LiveStreamControlCenter
					activities={props.activities || []}
					connectedPlatforms={props.connectedPlatforms}
					moderationCallbacks={props.moderationCallbacks}
					onAddTimer={props.onAddTimer}
					onChangeStreamSettings={props.onChangeStreamSettings}
					onDeleteTimer={props.onDeleteTimer}
					onModifyTimers={props.onModifyTimers}
					onSendMessage={props.onSendMessage}
					onStartGiveaway={props.onStartGiveaway}
					onStartPoll={props.onStartPoll}
					onStartTimer={props.onStartTimer}
					onStopTimer={props.onStopTimer}
					stickyDuration={props.stickyDuration}
					streamDuration={props.streamDuration || 0}
					timers={props.timers}
					viewerCount={props.viewerCount || 0}
				/>
			</Show>

			<Show when={props.phase === "post-stream"}>
				<PostStreamSummary
					onStartNewStream={props.onStartNewStream}
					summary={
						props.summary || {
							duration: 0,
							peakViewers: 0,
							averageViewers: 0,
							totalMessages: 0,
							totalDonations: 0,
							donationAmount: 0,
							newFollowers: 0,
							newSubscribers: 0,
							raids: 0,
							endedAt: new Date(),
						}
					}
				/>
			</Show>
		</div>
	);
}
