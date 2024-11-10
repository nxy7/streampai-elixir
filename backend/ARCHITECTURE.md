# Streampai Architecture

This document outlines the architecture of the Streampai Phoenix application, focusing on scalability, maintainability, and separation of concerns.

## Core Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Composability**: Components and contexts can be easily combined and reused  
3. **Consistency**: Standardized patterns across all LiveViews and components
4. **Error Handling**: Centralized, user-friendly error handling
5. **Real-time Communication**: PubSub-driven updates for live features

## Architecture Overview

### Technology Stack
- **Phoenix 1.7.14** with LiveView for real-time web interface
- **Ash Framework** for resource modeling and business logic
- **AshAuthentication** with multi-provider OAuth (Google, Twitch) + password auth
- **AshPostgres** for database operations with PostgreSQL
- **LiveSvelte** integration for Svelte components within LiveView
- **Vue.js** components for complex interactive widgets

### Domain Structure
- **Streampai.Accounts** - User management and authentication
- **Streampai.Stream** - Streaming platform integration and events
- **Streampai.LivestreamManager** - Real-time stream processing and management
- **Streampai.Cloudflare** - External API integration for stream infrastructure

## Architecture Layers

### 1. Domain Layer (`lib/streampai/`)

Business logic and domain-specific operations using Ash Framework.

**Key Contexts:**
- **`Streampai.Accounts`**: User management, authentication, widget configurations
- **`Streampai.Stream`**: Stream events, metrics, donations, raids
- **`Streampai.LivestreamManager`**: Real-time stream processing and user session management
- **`Streampai.Cloudflare`**: External API integration for live streaming infrastructure

**Ash Resources Pattern:**
```elixir
# Resource definitions with clear actions and policies
defmodule Streampai.Accounts.User do
  use Ash.Resource, domain: Streampai.Accounts
  
  actions do
    defaults [:create, :read, :update, :destroy]
    
    read :by_email do
      argument :email, :string, allow_nil?: false
      filter expr(email == ^arg(:email))
    end
  end
  
  policies do
    policy action_type([:read, :update]) do
      authorize_if actor_present?()
      authorize_if expr(id == ^actor(:id))
    end
  end
end
```

### 2. Web Layer (`lib/streampai_web/`)

#### LiveViews (54 total)
Interactive pages using Phoenix LiveView with standardized patterns.

**Key LiveViews:**
- **Dashboard System**: `dashboard_live.ex`, `dashboard_*.ex` - Main user interface
- **Widget System**: `*_widget_settings_live.ex` - Widget configuration interfaces
- **Authentication**: Landing page, terms, privacy - Public pages

**Common Patterns:**
- `BaseLive` - Shared functionality and error handling
- `DashboardLayout` - Shared layout component for all dashboard pages
- PubSub integration for real-time updates
- Ash authentication and authorization

#### Components (`lib/streampai_web/components/`)
Reusable UI components with consistent APIs.

**Key Components:**
- **`DashboardLayout`** (605 lines) - Main dashboard layout with collapsible sidebar
- **`CoreComponents`** (730 lines) - Base UI components (buttons, forms, modals)
- **`DashboardComponents`** (524 lines) - Dashboard-specific components
- **`SubscriptionWidget`** (342 lines) - Complete subscription management UI
- **Widget Components** - Specialized components for OBS integration

**Component Pattern:**
```elixir
# Components use attrs and slots for flexibility
attr :title, :string, required: true
attr :variant, :atom, values: [:primary, :secondary], default: :primary
slot :inner_block, required: true

def card(assigns) do
  ~H"""
  <div class={["card", "card-#{@variant}"]}>
    <h3><%= @title %></h3>
    <%= render_slot(@inner_block) %>
  </div>
  """
end
```

### 3. Widget Architecture

Streampai uses a standardized 4-component widget pattern for OBS integration:

1. **Vue Component** (`assets/vue/[Widget]Widget.vue`) - Pure frontend display
2. **Utility Module** (`lib/streampai/fake/[widget].ex`) - Config defaults and fake data
3. **Settings LiveView** (`lib/streampai_web/live/[widget]_settings_live.ex`) - Configuration interface
4. **Display LiveView** (`lib/streampai_web/components/[widget]_obs_widget_live.ex`) - OBS embedding

**PubSub Communication:**
- Settings pages broadcast configuration changes
- Display widgets subscribe to real-time updates
- Topics: `"widget_config:#{widget_type}:#{user_id}"`

**Existing Widgets:**
- **AlertBox Widget** - Donation/follow/subscription alerts
- **Chat Widget** - Live chat overlay

See `WIDGET_DEVELOPMENT_GUIDE.md` for detailed implementation patterns.

### 4. LiveStream Management System

**Real-time Stream Processing:**
- **Presence-based lifecycle management** - UserStreamManager processes start/stop based on user dashboard presence
- **Multi-platform integration** - Twitch, YouTube, Facebook, Kick
- **Stream state management** - Real-time metrics, events, and metadata collection
- **Cloudflare integration** - Live input/output management for streaming infrastructure

**Key Components:**
- `PresenceManager` - Manages user session lifecycle
- `UserStreamManager` - Per-user stream processing supervisor
- `StreamStateServer` - Maintains real-time stream state
- `CloudflareManager` - External API integration
- Platform managers - `TwitchManager`, `YouTubeManager`, etc.

### 5. Authentication & Authorization

**Multi-provider OAuth + Password Authentication:**
- Google, GitHub, Twitch via Ueberauth
- Password authentication with email confirmation
- JWT tokens managed by AshAuthentication

**Authorization Patterns:**
```elixir
# Route-level protection
live_session :require_authenticated_user,
  on_mount: [{StreampaiWeb.LiveUserAuth, :ensure_authenticated}] do
  live "/dashboard", DashboardLive
end

# Resource-level policies in Ash
policy action_type(:read) do
  authorize_if actor_present?()
  authorize_if expr(user_id == ^actor(:id))
end
```

### 6. Database & Persistence

**Ash + PostgreSQL:**
- Ash resources for domain modeling
- AshPostgres for database operations
- Resource snapshots in `priv/resource_snapshots/`
- Both Ecto migrations and legacy SQL migrations supported
- TimescaleDB extensions for time-series data (hypertables)

**Configuration Management:**
- `WidgetConfig` resource for widget settings
- User preferences and streaming account configurations
- Multi-tenant support through user-scoped data

## Development Patterns

### Error Handling Strategy

All LiveViews use consistent error handling via `BaseLive`:

```elixir
def safe_load(socket, load_fn, assign_key, error_message \\ nil) do
  case load_fn.() do
    {:ok, data} -> assign(socket, assign_key, data)
    {:error, reason} -> handle_error(socket, reason, error_message)
    data -> assign(socket, assign_key, data)
  end
rescue
  exception -> handle_error(socket, Exception.message(exception))
end
```

### Real-time Communication

**PubSub Topics:**
- `"widget_config:#{widget_type}:#{user_id}"` - Widget configuration updates
- `"alertbox:#{user_id}"` - Real donation/alert events
- `"chat:#{user_id}"` - Chat messages
- User presence tracking for stream management

### Testing Strategy

- **Unit tests** for domain logic and utilities
- **Integration tests** for external APIs (follow `api_client_test.exs` pattern)
- **LiveView tests** for user interactions
- **Snapshot testing** with Mneme for regression testing
- **Property-based testing** for complex business logic

## File Organization

```
lib/
├── streampai/                 # Domain layer
│   ├── accounts/             # User management
│   ├── stream/               # Streaming domain
│   ├── livestream_manager/   # Real-time processing
│   ├── cloudflare/          # External integration
│   └── fake/                # Utility data generation
├── streampai_web/           # Web layer
│   ├── components/          # Reusable UI components
│   ├── live/               # LiveView pages
│   └── utils/              # Web utilities
└── mix/                    # Mix tasks

assets/
├── vue/                    # Vue widget components
├── css/                    # Stylesheets
└── js/                     # JavaScript assets
```

## Key Architectural Decisions

1. **Ash Framework** - Chosen for resource modeling, authentication, and policies
2. **4-Component Widget Pattern** - Ensures consistency and maintainability across widgets
3. **Presence-based Stream Management** - Automatically manages resources based on user activity
4. **PubSub for Real-time Features** - Enables seamless real-time updates across components
5. **Vue + LiveView Hybrid** - Combines LiveView simplicity with Vue interactivity for widgets
6. **External API Integration** - Centralized in domain layer with proper error handling and testing

This architecture supports Streampai's core functionality while maintaining flexibility for future enhancements and platform integrations.