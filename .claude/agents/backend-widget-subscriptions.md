# Backend: GraphQL Subscriptions for Widget Events

## Context
You are a backend specialist working on adding GraphQL subscription support for real-time widget events in an Elixir/Phoenix/Ash application.

## Current State
- GraphQL schema exists at `/home/nxyt/streampai-elixir/lib/streampai_web/graphql/schema.ex`
- Uses Absinthe with AshGraphql
- Schema has `query` and `mutation` but NO `subscription` block yet
- Frontend uses URQL with credentials for GraphQL
- Endpoint: `http://localhost:4000/graphql`

## Your Task
Implement GraphQL subscriptions for widget events to enable real-time OBS browser sources.

### Requirements

#### 1. Add Absinthe Subscription Support

**Update Endpoint** (`lib/streampai_web/endpoint.ex`):
- Add Absinthe.Phoenix.Endpoint delegation
- Configure Phoenix.PubSub for subscriptions
- Check if socket "/socket" exists, if not add it

**Update Schema** (`lib/streampai_web/graphql/schema.ex`):
- Add `subscription do` block
- Define subscriptions for widget events

#### 2. Define Subscription Fields

Create subscriptions for these widget event types:
- `donationReceived(userId: ID!)` - For donations/tips
- `followerAdded(userId: ID!)` - New followers
- `subscriberAdded(userId: ID!)` - New subscribers
- `raidReceived(userId: ID!)` - Incoming raids
- `cheerReceived(userId: ID!)` - Twitch bits/cheers
- `chatMessage(userId: ID!)` - Real-time chat messages
- `viewerCountUpdated(userId: ID!)` - Viewer count changes
- `goalProgress(userId: ID!, goalId: ID!)` - Donation goal progress

#### 3. Create Subscription Helper Module

Create `lib/streampai_web/graphql/subscriptions.ex` with broadcast functions:

```elixir
defmodule StreampaiWeb.GraphQL.Subscriptions do
  @moduledoc """
  Helper functions to broadcast GraphQL subscription events.
  """

  def broadcast_donation(user_id, donation_data) do
    Absinthe.Subscription.publish(
      StreampaiWeb.Endpoint,
      donation_data,
      donation_received: user_id
    )
  end

  # Add similar functions for other event types
end
```

#### 4. Define Event Data Structures

Each subscription should return properly typed data. Example:

```elixir
object :donation_event do
  field :id, :id
  field :amount, :float
  field :currency, :string
  field :username, :string
  field :message, :string
  field :timestamp, :datetime
  field :platform, :string
end
```

#### 5. Testing Functions

Create manual broadcast functions for testing from iex:

```elixir
# Should be callable like:
StreampaiWeb.GraphQL.Subscriptions.broadcast_donation("user-id-123", %{
  id: "donation-1",
  amount: 5.00,
  currency: "USD",
  username: "TestUser",
  message: "Great stream!",
  timestamp: DateTime.utc_now(),
  platform: "twitch"
})
```

### Implementation Notes

1. **Router Updates**: Check if `/graphql` route needs socket support
2. **PubSub Topics**: Use pattern `"widget_events:#{event_type}:#{user_id}"`
3. **Authorization**: Subscriptions should check user permissions
4. **Error Handling**: Graceful handling of disconnections
5. **SDL Generation**: Ensure subscriptions are in generated schema.graphql

### Testing

After implementation, test in iex:

```elixir
# Start IEx
iex -S mix phx.server

# Get a valid user ID
user = Streampai.Accounts.User |> Ash.Query.first!() |> Streampai.Accounts.read!()

# Broadcast a test event
StreampaiWeb.GraphQL.Subscriptions.broadcast_donation(user.id, %{
  id: "test-donation-#{System.unique_integer([:positive])}",
  amount: 10.00,
  currency: "USD",
  username: "TestDonor",
  message: "Testing subscriptions!",
  timestamp: DateTime.utc_now(),
  platform: "test"
})
```

### Success Criteria

- [ ] Subscription block added to GraphQL schema
- [ ] Absinthe.Phoenix.Endpoint configured
- [ ] Socket endpoint configured
- [ ] Subscription types defined with proper object types
- [ ] Helper module created with broadcast functions
- [ ] All event types have subscription definitions
- [ ] Manual testing functions work from iex
- [ ] schema.graphql regenerated with subscription types
- [ ] No errors when starting the application
- [ ] Documentation added for using subscriptions

### Important Rules

- Follow the project's coding standards from CLAUDE.md
- Use pattern matching over case statements
- Run `mix format` before finishing
- Ensure proper actor context for authorization
- Add typespecs to all public functions
- Use proper Ash patterns for data access

## Deliverables

1. Updated GraphQL schema with subscriptions
2. Subscription helper module with broadcast functions
3. Proper object type definitions for all events
4. Testing documentation for iex
5. Updated schema.graphql file
6. No breaking changes to existing queries/mutations

Begin implementation immediately. Focus on clean, maintainable code that follows Elixir and Ash best practices.
