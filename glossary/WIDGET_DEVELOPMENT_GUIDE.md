# Widget Development Guide

This guide documents the standardized 4-component widget pattern used in Streampai for creating interactive widgets that can be embedded in OBS for streaming.

## Overview

Each widget in Streampai follows a consistent pattern consisting of 4 main components:

1. **Vue Component** - Pure frontend display logic
2. **Utility Module** - Configuration defaults and fake data generation
3. **Settings LiveView** - Configuration interface with preview
4. **Display LiveView** - Standalone widget for OBS embedding

This pattern ensures consistency, maintainability, and proper separation of concerns across all widgets.

## Architecture Diagram

```
┌─────────────────────┐    ┌─────────────────────┐
│   Settings LiveView │    │   Display LiveView  │
│  (Configuration UI) │    │   (OBS Embedding)   │
└─────────┬───────────┘    └─────────┬───────────┘
          │                          │
          │    PubSub Communication  │
          │ ◄─────────────────────── │
          │                          │
          ▼                          ▼
┌─────────────────────────────────────────────────┐
│              Utility Module                     │
│        (Defaults + Fake Data)                   │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│               Vue Component                     │
│           (Display Logic)                       │
└─────────────────────────────────────────────────┘
```

## Component Details

### 1. Vue Component (`assets/vue/[Widget]Widget.vue`)

The Vue component is a pure frontend component responsible for displaying widget data with animations and styling. It is framework-agnostic and self-contained.

**Key Characteristics:**
- Written in TypeScript with proper interface definitions
- Receives configuration and events as props
- Handles animations, styling, and real-time data updates
- No external dependencies on LiveView state
- Transparent background for OBS overlay compatibility

**Example Structure:**
```typescript
interface WidgetEvent {
  id: string
  type: string
  username: string
  timestamp: Date
  // widget-specific fields
}

interface WidgetConfig {
  // Configuration options like animation_type, display_duration, etc.
}

const props = defineProps<{
  config: WidgetConfig
  event: WidgetEvent | null
  id?: string
}>()
```

**File Location:** `assets/vue/[Widget]Widget.vue`

### 2. Utility Module (`lib/streampai/fake/[widget].ex`)

The utility module provides configuration defaults and generates realistic fake data for previews and testing.

**Key Functions:**
- `default_config/0` - Returns widget configuration defaults
- `generate_event/0` - Creates realistic fake data for preview and testing
- Contains predefined data pools (usernames, messages, etc.) for realistic demos

**Example Structure:**
```elixir
defmodule Streampai.Fake.[Widget] do
  @moduledoc """
  Utility module for generating fake [widget] events for testing and demonstration purposes.
  """

  def generate_event do
    # Generate realistic fake event data
  end

  def default_config do
    # Return default configuration
  end

  # Private data pools
  defp usernames, do: [...]
  defp messages, do: [...]
end
```

**File Location:** `lib/streampai/fake/[widget].ex`

### 3. Settings LiveView (`lib/streampai_web/live/[widget]_widget_settings_live.ex`)

The settings LiveView provides a configuration interface with real-time preview functionality.

**Key Features:**
- Form handling for widget configuration
- Real-time preview using fake events
- PubSub broadcasting of configuration changes
- OBS browser source URL generation
- Periodic mock event generation (typically every 7 seconds)

**Key Functions:**
- `mount/3` - Load existing config or create with defaults
- `handle_event("save", ...)` - Save config and broadcast changes
- `handle_info(:generate_event, ...)` - Generate preview events

**PubSub Pattern:**
- Topic: `"widget_config:#{widget_type}:#{user_id}"`
- Broadcasts configuration updates to display widgets

**Example Structure:**
```elixir
defmodule StreampaiWeb.[Widget]WidgetSettingsLive do
  use StreampaiWeb, :live_view

  def mount(_params, _session, socket) do
    # Load config, generate initial event, setup preview timer
  end

  def handle_event("save", %{"config" => config_params}, socket) do
    # Save config, broadcast changes via PubSub
  end

  def handle_info(:generate_event, socket) do
    # Generate and display preview event
  end
end
```

**File Location:** `lib/streampai_web/live/[widget]_widget_settings_live.ex`

### 4. Display LiveView (`lib/streampai_web/components/[widget]_obs_widget_live.ex`)

The display LiveView is a standalone widget designed for OBS browser source embedding.

**Key Features:**
- Subscribes to configuration updates via PubSub
- Transparent background for overlay functionality
- Listens for real widget events (donations, follows, etc.)
- Layout set to `false` for clean embedding
- Generates demo events on interval for development/demo

**PubSub Subscriptions:**
- Configuration updates: `"widget_config:#{user_id}"`
- Real events: `"[widget_type]:#{user_id}"`

**Example Structure:**
```elixir
defmodule StreampaiWeb.Components.[Widget]ObsWidgetLive do
  use StreampaiWeb, :live_view

  def mount(%{"user_id" => user_id}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")
      Phoenix.PubSub.subscribe(Streampai.PubSub, "[widget_type]:#{user_id}")
    end
    
    # Load configuration and setup widget
  end

  def handle_info({:config_updated, new_config}, socket) do
    # Handle configuration changes from settings page
  end

  def handle_info({:new_event, event}, socket) do
    # Handle real widget events
  end
end
```

**File Location:** `lib/streampai_web/components/[widget]_obs_widget_live.ex`

## Integration Requirements

### Database & Configuration

Widget configurations are stored using the `WidgetConfig` resource:

```elixir
# Add widget type to validation list
def widget_types, do: [:alertbox_widget, :chat_widget, :your_new_widget]

# Add helper function for default config
def get_default_config(:your_new_widget), do: YourWidget.default_config()

# Upsert configuration with user_type_unique identity
```

### Routing

Add routes for both settings and display:

```elixir
# Settings route
live "/widgets/your-widget", YourWidgetSettingsLive

# Display route for OBS
live "/widgets/your-widget/display", Components.YourWidgetObsWidgetLive
```

### Dashboard Integration

Add widget link to the dashboard:

```elixir
# In dashboard_widgets_live.ex
%{
  name: "Your Widget",
  description: "Widget description",
  path: ~p"/widgets/your-widget",
  icon: "hero-your-icon",
  category: :alerts  # or :overlays, :interactive
}
```

## Development Workflow

### 1. Create Vue Component
```bash
# Create Vue component
touch assets/vue/YourWidget.vue
```

Define interfaces and implement display logic with animations.

### 2. Create Utility Module
```bash
# Create utility module
touch lib/streampai/fake/your_widget.ex
```

Implement `default_config/0` and `generate_event/0` functions.

### 3. Create Settings LiveView
```bash
# Create settings page
touch lib/streampai_web/live/your_widget_settings_live.ex
```

Implement configuration form, preview, and PubSub broadcasting.

### 4. Create Display LiveView
```bash
# Create display widget
touch lib/streampai_web/components/your_widget_obs_widget_live.ex
```

Implement standalone widget with PubSub subscriptions.

### 5. Add Database Support
- Update `WidgetConfig` validation
- Add default config helper
- Run database migrations if needed

### 6. Add Routing
- Add settings route
- Add display route
- Update dashboard navigation

## PubSub Communication Pattern

The widget system uses Phoenix PubSub for real-time communication:

### Topics
- `"widget_config:#{widget_type}:#{user_id}"` - Configuration updates
- `"#{widget_type}:#{user_id}"` - Real widget events

### Message Format
```elixir
# Configuration update
{:config_updated, new_config}

# New widget event
{:new_event, event_data}
```

### Broadcasting (Settings Page)
```elixir
Phoenix.PubSub.broadcast(
  Streampai.PubSub,
  "widget_config:#{widget_type}:#{user_id}",
  {:config_updated, new_config}
)
```

### Subscribing (Display Widget)
```elixir
Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_config:#{user_id}")
Phoenix.PubSub.subscribe(Streampai.PubSub, "#{widget_type}:#{user_id}")
```

## Best Practices

### Vue Component
- Use TypeScript interfaces for type safety
- Keep components framework-agnostic
- Implement proper animation lifecycle management
- Use computed properties for reactive styling
- Handle transparent backgrounds for OBS

### Utility Module
- Provide realistic fake data for good demos
- Use predefined data pools for consistency
- Include variety in generated events
- Document configuration options

### Settings LiveView
- Generate initial preview event on mount
- Use reasonable timing intervals (5-10 seconds)
- Provide OBS browser source URL
- Validate configuration inputs
- Handle connected?/1 checks for timers

### Display LiveView
- Always set `layout: false`
- Subscribe to both config and event topics
- Handle disconnections gracefully
- Implement demo mode for development
- Use transparent backgrounds

### Testing
- Follow the external API testing pattern established in `api_client_test.exs`
- Test both settings and display components
- Verify PubSub communication
- Test OBS embedding scenarios

## Existing Examples

### AlertBox Widget
- **Vue:** `assets/vue/AlertboxWidget.vue` - Donation/follow alerts with animations
- **Utility:** `lib/streampai/fake/alert.ex` - Alert event generation
- **Settings:** `lib/streampai_web/live/alertbox_widget_settings_live.ex`
- **Display:** `lib/streampai_web/components/alertbox_obs_widget_live.ex`

### Chat Widget
- **Vue:** `assets/vue/ChatWidget.vue` - Chat message display
- **Utility:** `lib/streampai/fake/chat.ex` - Chat message generation
- **Settings:** `lib/streampai_web/live/chat_widget_settings_live.ex`
- **Display:** `lib/streampai_web/components/chat_obs_widget_live.ex`

## Troubleshooting

### Common Issues

1. **Widget not updating in OBS**
   - Check PubSub subscriptions are active
   - Verify topics match between settings and display
   - Ensure `connected?/1` checks in mount

2. **Preview not working in settings**
   - Check timer setup in mount
   - Verify fake data generation
   - Ensure event structure matches Vue component props

3. **Transparent background not working**
   - Ensure `layout: false` in display LiveView
   - Check CSS for transparent backgrounds
   - Verify OBS browser source settings

4. **Configuration not persisting**
   - Check WidgetConfig validation
   - Verify user_type_unique constraints
   - Ensure proper error handling in save events

## Contributing

When adding new widgets:
1. Follow the established 4-component pattern
2. Use consistent naming conventions
3. Document configuration options
4. Provide realistic fake data
5. Test in both settings preview and OBS embedding
6. Update dashboard navigation
7. Add integration tests

This pattern ensures consistency across all widgets while maintaining clean separation of concerns and enabling real-time configuration updates.