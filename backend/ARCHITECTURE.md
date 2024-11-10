# Phoenix Application Architecture

This document outlines the improved architecture patterns implemented to make the Phoenix application more composable, understandable, and scalable.

## Core Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Composability**: Components and contexts can be easily combined and reused
3. **Consistency**: Standardized patterns across all LiveViews and components
4. **Error Handling**: Centralized, user-friendly error handling
5. **Documentation**: Comprehensive docs for all public APIs

## Architecture Layers

### 1. Domain Layer (`lib/streampai/`)

Business logic and domain-specific operations.

- **`Streampai.Dashboard`**: Dashboard-specific business logic
  - User statistics and metrics
  - Platform connection status
  - Usage tracking and limits

**Pattern**: Pure functions that operate on domain data, return `{:ok, result}` or `{:error, reason}`.

```elixir
# Good: Pure function with clear return type
def get_dashboard_data(%User{} = user) do
  %{
    user_info: get_user_info(user),
    streaming_status: get_streaming_status(user),
    usage: get_usage_stats(user)
  }
end

# Bad: Mixed concerns, unclear return type
def get_dashboard_data_and_render(user, socket) do
  # ... mixing domain logic with view logic
end
```

### 2. Web Layer (`lib/streampai_web/`)

#### Components (`lib/streampai_web/components/`)

Reusable UI components with consistent APIs.

- **`DashboardComponents`**: Reusable dashboard UI elements
  - `dashboard_card/1`: Consistent card styling
  - `status_badge/1`: Status indicators
  - `info_row/1`: Information display rows
  - `platform_connection/1`: Platform connection items
  - `empty_state/1`: Empty state displays

**Pattern**: Components use attrs and slots for flexibility, include comprehensive docs.

```elixir
@doc """
Renders a dashboard card with consistent styling.

## Examples

    <.dashboard_card title="Account Info" icon="user">
      Card content goes here
    </.dashboard_card>
"""
attr :title, :string, required: true, doc: "Card title"  
attr :icon, :string, default: nil, doc: "Icon name"
slot :inner_block, required: true, doc: "Card content"

def dashboard_card(assigns) do
  # Component implementation
end
```

#### LiveViews (`lib/streampai_web/live/`)

Interactive pages using standardized patterns.

- **`BaseLive`**: Common LiveView patterns and error handling
- **`LiveHelpers`**: Utility functions for LiveViews
- **Individual LiveViews**: Focused on specific page functionality

**Pattern**: Use `BaseLive` for dashboard pages, implement `mount_page/3` instead of `mount/3`.

```elixir
defmodule StreampaiWeb.DashboardLive do
  use StreampaiWeb.BaseLive
  
  @impl true
  def mount_page(socket, _params, _session) do
    socket = 
      safe_load(socket, fn -> 
        Dashboard.get_dashboard_data(socket.assigns.current_user)
      end, :dashboard_data, "Failed to load dashboard data")
    
    {:ok, socket, layout: false}
  end
end
```

### 3. Error Handling Strategy

#### Centralized Error Handling

All LiveViews use consistent error handling patterns via `LiveHelpers`.

```elixir
# Standardized error handling
def handle_error(socket, :not_found, custom_message) do
  message = custom_message || "The requested resource was not found."
  put_flash(socket, :error, message)
end

# Safe data loading with error handling
def safe_load(socket, load_fn, assign_key, error_message \\ nil) do
  case load_fn.() do
    {:ok, data} -> assign(socket, assign_key, data)
    {:error, reason} -> handle_error(socket, reason, error_message)
    data -> assign(socket, assign_key, data)  # Handle plain data
  end
rescue
  exception -> handle_error(socket, Exception.message(exception))
end
```

## Component Design Patterns

### 1. Composable Components

Components are designed to be easily composed together:

```elixir
# Dashboard card containing info rows and status badges
<.dashboard_card title="Account Info" icon="user">
  <div class="space-y-3">
    <.info_row label="Email" value={@user.email} />
    <.info_row label="Status">
      <.status_badge status="online">Online</.status_badge>
    </.info_row>
  </div>
</.dashboard_card>
```

### 2. Consistent APIs

All components follow consistent patterns:
- Required attributes are clearly marked
- Documentation includes examples  
- Slots are used for flexible content
- CSS classes can be customized via `class` attribute

### 3. Icon System

Centralized icon system with inline SVGs for performance:

```elixir
def icon(%{name: "user"} = assigns) do
  ~H"""
  <svg class={@class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="..."/>
  </svg>
  """
end
```

## LiveView Patterns

### 1. Standardized Mount Pattern

```elixir
# Old pattern (inconsistent)
def mount(_params, _session, socket) do
  data = SomeContext.get_data()  # No error handling
  {:ok, assign(socket, :data, data)}
end

# New pattern (standardized)
def mount_page(socket, _params, _session) do
  socket = 
    safe_load(socket, fn -> 
      SomeContext.get_data(socket.assigns.current_user)
    end, :data, "Failed to load data")
  
  {:ok, socket, layout: false}
end
```

### 2. Error Handling

```elixir
# Consistent error handling in events
def handle_event("save", params, socket) do
  handle_form_submit(socket, fn ->
    SomeContext.create_item(params)
  end, "Item created successfully!")
end
```

### 3. Data Loading

```elixir
# Safe data loading with user feedback
socket = safe_load(socket, fn ->
  Dashboard.get_complex_data(user_id)
end, :complex_data, "Unable to load dashboard data")
```

## File Organization

```
lib/streampai_web/
├── components/
│   ├── dashboard_components.ex    # Reusable dashboard components
│   ├── dashboard_layout.ex       # Layout component
│   └── core_components.ex        # Base Phoenix components
├── live/
│   ├── base_live.ex             # Base LiveView module  
│   ├── live_helpers.ex          # LiveView utilities
│   ├── dashboard_live.ex        # Main dashboard
│   ├── analytics_live.ex        # Analytics page
│   └── settings_live.ex         # Settings page
└── ...

lib/streampai/
├── dashboard.ex                 # Dashboard domain logic
├── accounts.ex                  # User account logic  
└── ...
```

## Benefits of This Architecture

### 1. Composability
- Components can be mixed and matched easily
- Domain logic is separated and reusable
- Consistent patterns across all pages

### 2. Maintainability  
- Clear separation of concerns
- Standardized error handling
- Comprehensive documentation
- Consistent file organization

### 3. Scalability
- Easy to add new dashboard pages
- Components scale without duplication
- Domain logic can grow independently
- Testing is straightforward with pure functions

### 4. Developer Experience
- Clear conventions to follow
- Helpful error messages
- Comprehensive documentation with examples
- IDE-friendly with proper specs and docs

## Migration Guide

### For New Dashboard Pages

1. Use `StreampaiWeb.BaseLive` instead of direct LiveView
2. Implement `mount_page/3` instead of `mount/3`  
3. Use `safe_load/4` for data loading
4. Use dashboard components for UI consistency

### For New Components

1. Add comprehensive `@doc` with examples
2. Use `attr` and `slot` declarations
3. Follow naming conventions (`*_component`)
4. Add to appropriate component module

### For Domain Logic  

1. Keep functions pure when possible
2. Use `{:ok, result}` / `{:error, reason}` patterns
3. Add comprehensive moduledocs
4. Group related functions in domain modules

This architecture provides a solid foundation for scaling the Phoenix application while maintaining code quality and developer productivity.