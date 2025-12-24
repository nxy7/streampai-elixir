# Frontend: OBS Browser Source Pages for Widgets

## Context

You are a frontend specialist working on creating OBS browser source pages using SolidJS for real-time widget displays.

## Current State

- SolidJS Start framework at `/home/nxyt/streampai-elixir/frontend/`
- URQL GraphQL client configured at `frontend/src/lib/urql.ts`
- Widget settings pages exist at `frontend/src/routes/dashboard/widgets/{widgetType}/settings.tsx`
- Widget display components at `frontend/src/components/widgets/*.tsx`
- Design system at `frontend/src/styles/design-system.ts`

## Your Task

Create OBS browser source pages for all widgets that listen to GraphQL subscriptions for real-time updates.

### Architecture Overview

```
OBS Browser Source
    ↓
/widgets/{widgetType}/obs?userId={userId}
    ↓
GraphQL Subscription (WebSocket)
    ↓
Real-time updates → Display with animations
```

### Requirements

#### 1. Update URQL Client for Subscriptions

**File**: `frontend/src/lib/urql.ts`

Add subscription exchange from `@urql/solid`:

```typescript
import {
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  Client,
} from "@urql/solid";
import { createClient as createWSClient } from "graphql-ws";

const WS_ENDPOINT = "ws://localhost:4000/graphql/websocket";
const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

const wsClient = createWSClient({
  url: WS_ENDPOINT,
});

export const client = new Client({
  url: GRAPHQL_ENDPOINT,
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query || "" };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
  fetchOptions: {
    credentials: "include",
  },
});
```

#### 2. Create OBS Display Pages

Create these pages under `frontend/src/routes/widgets/`:

**Directory Structure**:

```
frontend/src/routes/widgets/
  alertbox/
    obs.tsx          # OBS browser source
  donation-goal/
    obs.tsx
  chat/
    obs.tsx
  viewer-count/
    obs.tsx
  follower-count/
    obs.tsx
  event-list/
    obs.tsx
  top-donors/
    obs.tsx
  poll/
    obs.tsx
```

#### 3. OBS Page Template

Each OBS page should follow this pattern:

```typescript
import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";
import { gql, useSubscription } from "@urql/solid";

// GraphQL Subscription
const DONATION_SUBSCRIPTION = gql`
  subscription DonationReceived($userId: ID!) {
    donationReceived(userId: $userId) {
      id
      amount
      currency
      username
      message
      timestamp
      platform
    }
  }
`;

export default function AlertboxOBS() {
  const [params] = useSearchParams();
  const userId = () => params.userId;

  const [currentEvent, setCurrentEvent] = createSignal(null);
  const [isAnimating, setIsAnimating] = createSignal(false);

  // Subscribe to donation events
  const [result] = useSubscription({
    query: DONATION_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  // Handle new events
  createEffect(() => {
    if (result()?.data?.donationReceived) {
      const event = result().data.donationReceived;
      setCurrentEvent(event);
      setIsAnimating(true);

      // Hide after animation duration
      setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setCurrentEvent(null), 500);
      }, 5000);
    }
  });

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden">
      <Show when={isAnimating() && currentEvent()}>
        {(event) => (
          <div class="alert-container animate-slide-in">
            <div class="alert-content bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-2xl">
              <div class="text-white text-3xl font-bold mb-2">
                {event().username} donated ${event().amount}!
              </div>
              <Show when={event().message}>
                <div class="text-white text-lg">{event().message}</div>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
```

#### 4. Widget-Specific Implementations

**Alertbox** (`alertbox/obs.tsx`):

- Subscribe to: donations, follows, subs, raids, cheers
- Show animated alerts with sound effects
- Queue multiple events
- Configurable animations

**Donation Goal** (`donation-goal/obs.tsx`):

- Subscribe to: goalProgress
- Show progress bar
- Animate when goal updates
- Display current/target amounts

**Chat Widget** (`chat/obs.tsx`):

- Subscribe to: chatMessage
- Show scrolling chat messages
- Platform badges
- Moderator/subscriber badges

**Viewer Count** (`viewer-count/obs.tsx`):

- Subscribe to: viewerCountUpdated
- Display current viewer count
- Smooth number transitions
- Optional growth indicators

**Follower Count** (`follower-count/obs.tsx`):

- Subscribe to: followerAdded
- Display total follower count
- Celebration animation on new follow
- Platform breakdown

**Event List** (`event-list/obs.tsx`):

- Subscribe to: all event types
- Show recent events in a list
- Auto-scroll
- Configurable display time

**Top Donors** (`top-donors/obs.tsx`):

- Subscribe to: donationReceived
- Update leaderboard in real-time
- Smooth position transitions
- Highlight new entries

**Poll Widget** (`poll/obs.tsx`):

- Subscribe to: pollVote
- Show poll options with bars
- Real-time vote updates
- Percentage calculations

#### 5. Styling Requirements

All OBS pages must:

- Have transparent background: `bg-transparent`
- Use `overflow-hidden` to prevent scrollbars
- Be fullscreen: `w-full h-screen`
- Have smooth animations
- Be readable on any background
- Support custom positioning via query params

#### 6. Common Animations

Add to `frontend/src/app.css`:

```css
@keyframes slide-in {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.5s ease-out;
}

.animate-slide-out {
  animation: slide-out 0.5s ease-in;
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### 7. Error Handling

Each OBS page should:

- Show connection status
- Retry on disconnection
- Display error messages (for testing)
- Log to console for debugging

```typescript
createEffect(() => {
  if (result().error) {
    console.error("Subscription error:", result().error);
  }
});
```

#### 8. Configuration Support

Load widget config from query params or GraphQL:

```typescript
const [configResult] = useQuery({
  query: WIDGET_CONFIG_QUERY,
  variables: { userId: userId(), type: "alertbox" },
});

const config = () => configResult()?.data?.widgetConfig?.config || {};
```

### Testing

Test each OBS page:

1. Open in browser: `http://localhost:3000/widgets/alertbox/obs?userId=USER_ID`
2. In iex, broadcast test event:

```elixir
StreampaiWeb.GraphQL.Subscriptions.broadcast_donation("USER_ID", %{...})
```

3. Verify alert appears with animation
4. Test in OBS Browser Source

### Success Criteria

- [ ] URQL configured with subscription exchange
- [ ] All 8 widget types have OBS pages
- [ ] GraphQL subscriptions working
- [ ] Animations smooth and performant
- [ ] Transparent backgrounds work in OBS
- [ ] No scrollbars or UI artifacts
- [ ] Events display correctly
- [ ] Error handling implemented
- [ ] Configuration loading works
- [ ] Testing documentation provided

### Important Rules

- Use design system from `~/styles/design-system.ts`
- Follow SolidJS best practices (signals, effects)
- Cleanup subscriptions on unmount
- Use TypeScript for all code
- Follow file-based routing rules from CLAUDE.md
- Run `npm run build` to verify no errors
- Test in actual OBS if possible

## Deliverables

1. Updated URQL client with subscription support
2. OBS page for each widget type
3. CSS animations for widget displays
4. Error handling and connection status
5. Testing documentation
6. Configuration loading
7. TypeScript types for all event data

Begin implementation immediately. Prioritize Alertbox and Donation Goal as they are most commonly used.
