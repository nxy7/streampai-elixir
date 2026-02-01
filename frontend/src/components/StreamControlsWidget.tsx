import { Show } from "solid-js";

import Card from "~/design-system/Card";
import { LiveStreamControlCenter } from "./stream/LiveStreamControlCenter";
import { PostStreamSummary } from "./stream/PostStreamSummary";
import { PreStreamSettings } from "./stream/PreStreamSettings";
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
} from "./stream/types";

// Export Platform type for external use
export type { Platform };

interface StreamControlsWidgetProps extends StreamActionCallbacks {
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
  streamStartedAt?: string | null;
  // Post-stream props
  summary?: StreamSummary;
  onStartNewStream?: () => void;
}

export default function StreamControlsWidget(props: StreamControlsWidgetProps) {
  return (
    <Card class="h-full">
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
          onChangeStreamSettings={props.onChangeStreamSettings}
          onModifyTimers={props.onModifyTimers}
          onSendMessage={props.onSendMessage}
          onStartGiveaway={props.onStartGiveaway}
          onStartPoll={props.onStartPoll}
          stickyDuration={props.stickyDuration}
          streamDuration={props.streamDuration || 0}
          streamStartedAt={props.streamStartedAt}
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
    </Card>
  );
}
