# Backend GraphQL Enhancement Task for Admin Users Page

## Context
We are migrating the Admin Users page from LiveView to SolidJS. The LiveView implementation at `/lib/streampai_web/live/dashboard_admin_users_live.ex` provides user management functionality including:
- User listing with keyset pagination
- PRO tier granting/revoking
- User role and tier display
- Account confirmation status

## Current State
- User resource exists at `/lib/streampai/accounts/user.ex`
- `role` and `tier` are calculations, not direct fields
- `confirmed_at` is a direct attribute
- `UserPremiumGrant` resource has `create_grant` action for granting PRO access
- GraphQL query `listUsers` exists but doesn't return all needed fields

## Requirements

### 1. Expose Missing Fields in GraphQL User Type

The GraphQL schema at `/frontend/schema.graphql` shows the User type currently has:
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  extraData: JsonString
  avatarFileId: ID
  displayAvatar: String
  isModerator: Boolean
  hoursStreamedLast30Days: Float
  storageQuota: Int
  storageUsedPercent: Float
}
```

**Need to add:**
- `role: UserRole!` (enum: ADMIN, REGULAR)
- `tier: UserTier!` (enum: PRO, FREE)
- `confirmedAt: DateTime`

These fields already exist in the backend as calculations (role, tier) and attribute (confirmedAt), they just need to be exposed in the GraphQL type definition.

### 2. Create GraphQL Mutations for PRO Access Management

Create two mutations:

**grantProAccess:**
```graphql
mutation grantProAccess(userId: ID!, durationDays: Int!, reason: String!): User
```

Implementation should:
- Use existing `UserPremiumGrant.create_grant/5` function
- Accept: user_id, granted_by_user_id (from actor), expires_at (calculated from durationDays), granted_at (now), grant_reason
- Return the updated User with new tier
- Require admin authorization

**revokeProAccess:**
```graphql
mutation revokeProAccess(userId: ID!): User
```

Implementation should:
- Find active UserPremiumGrant records for user (where revoked_at is nil)
- Set revoked_at to current timestamp on all active grants
- Return the updated User with new tier
- Require admin authorization

Reference the LiveView implementation at lines 186-227 in `dashboard_admin_users_live.ex` for the revocation logic.

### 3. Ensure listUsers Query Loads Required Fields

The existing `listUsers` query should load:
- role (calculation)
- tier (calculation)
- confirmedAt (attribute)
- displayAvatar (calculation)

Check the User resource's `list_all` read action - it already loads role, display_avatar, and tier. Just ensure these are exposed in GraphQL.

## Files to Modify

1. `/lib/streampai/accounts/user.ex` - GraphQL type configuration
2. `/lib/streampai/accounts.ex` - If mutations need to be added to domain
3. Potentially create new mutation files if following existing patterns

## Acceptance Criteria

- [ ] User GraphQL type includes role, tier, and confirmedAt fields
- [ ] grantProAccess mutation works and grants PRO for specified duration
- [ ] revokeProAccess mutation works and revokes all active grants
- [ ] Both mutations require admin authorization
- [ ] Both mutations return the updated User object
- [ ] GraphQL schema regenerated at `/frontend/schema.graphql` includes new fields
- [ ] All changes follow existing Ash Framework patterns in the codebase
- [ ] Code formatted with `mix format`

## Notes

- The `listUsers` query uses keyset pagination (already configured)
- Admin authorization is already implemented via policies - see line 504 in user.ex
- User.ex already has an update action that admins can use
- Consider whether to create custom actions or use generic update with UserPremiumGrant operations
