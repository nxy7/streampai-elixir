# Ash Framework Usage Analysis & Improvements

## Executive Summary

This document details the comprehensive analysis and improvements made to the Streampai Elixir codebase to maximize the benefits of the Ash Framework. The focus was on moving business logic from LiveViews and helper modules into proper Ash actions, changes, preparations, and validations.

## Issues Found & Fixed

### HIGH PRIORITY (COMPLETED)

#### 1. Name Validation Business Logic Outside Ash Actions
**Problem**: `NameValidator.validate_availability/2` contained business logic that bypassed Ash's built-in validation and authorization features.

**Location**: `/home/nxyt/streampai-elixir/lib/streampai/accounts/name_validator.ex`

**Solution**: Created a dedicated Ash read action `check_name_availability` in the User resource that:
- Validates name format and length using Ash preparations
- Checks uniqueness through Ash queries with proper actor context
- Returns metadata (available, message, is_current_name) for UI display
- Ensures all validation happens within Ash's authorization framework

**Files Modified**:
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user.ex` - Added `check_name_availability` action
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/dashboard_settings_live.ex` - Updated to use new action

**Benefits**:
- Authorization checks are automatically applied
- Validation is centralized in the resource definition
- Better composability and reusability
- Proper actor tracking for audit trails

#### 2. Notification Preferences Toggle - Missing Ash Action
**Problem**: `NotificationPreferences.handle_notification_toggle/1` directly modified preferences using create action instead of a dedicated toggle action.

**Location**: `/home/nxyt/streampai-elixir/lib/streampai_web/live/helpers/notification_preferences.ex`

**Solution**: Created `toggle_email_notifications` update action in UserPreferences resource that:
- Encapsulates the toggle logic in an Ash change
- Uses atomic updates for consistency
- Properly handles actor authorization

**Files Modified**:
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_preferences.ex` - Added toggle action
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/helpers/notification_preferences.ex` - Updated to use action

**Benefits**:
- Single responsibility - one action for one operation
- Better error handling and validation
- Proper authorization checks
- More maintainable code

#### 3. Donation Preferences Update - Missing Change Module
**Problem**: Donation preferences validation was happening in LiveView event handler instead of an Ash change module.

**Location**: `/home/nxyt/streampai-elixir/lib/streampai_web/live/dashboard_settings_live.ex`

**Solution**:
- Created `ValidateDonationAmounts` change module for validation logic
- Created dedicated `update_donation_settings` action with arguments
- Moved all validation logic into the change module

**Files Created**:
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_preferences/changes/validate_donation_amounts.ex`

**Files Modified**:
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_preferences.ex` - Added update action
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/dashboard_settings_live.ex` - Updated to use action

**Benefits**:
- Validation logic is testable in isolation
- Reusable across different contexts
- Better error messages from Ash
- Follows Ash best practices

#### 4. Missing Actor Parameters in ViewerDetailsLive
**Problem**: Ash queries were executed without actor context, bypassing authorization policies.

**Location**: `/home/nxyt/streampai-elixir/lib/streampai_web/live/viewer_details_live.ex`

**Solution**: Added `actor: current_user` to all Ash operations:
- `StreamViewer` query
- `ChatMessage.get_for_viewer!`
- `StreamEvent.get_for_viewer!`

**Files Modified**:
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/viewer_details_live.ex`

**Benefits**:
- Proper authorization enforcement
- Audit trail for data access
- Security compliance
- Follows Ash security best practices

#### 5. Livestream Creation in UserStreamManager - Missing Dedicated Actions
**Problem**: UserStreamManager manually constructed livestream records instead of using dedicated Ash actions with changes.

**Location**: `/home/nxyt/streampai-elixir/lib/streampai/livestream_manager/user_stream_manager.ex`

**Solution**:
- Created `start_livestream` action with proper title defaulting logic
- Created `end_livestream` action with validation
- Created `SetDefaultTitle` change module for title generation logic
- Updated UserStreamManager to use these new actions

**Files Created**:
- `/home/nxyt/streampai-elixir/lib/streampai/stream/livestream/changes/set_default_title.ex`

**Files Modified**:
- `/home/nxyt/streampai-elixir/lib/streampai/stream/livestream.ex` - Added new actions
- `/home/nxyt/streampai-elixir/lib/streampai/livestream_manager/user_stream_manager.ex` - Use new actions

**Benefits**:
- Business logic centralized in resource
- Validation automatically applied
- Better error handling
- Composable actions for future use

#### 6. User Lookup by Name - Missing Ash Action
**Problem**: `UserRoleHelpers.find_user_by_username/1` manually constructed Ash queries instead of using a dedicated read action.

**Location**: `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_role_helpers.ex`

**Solution**:
- Created `get_by_name` read action in User resource
- Updated helper to use the new action
- Simplified error handling

**Files Modified**:
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user.ex` - Added get_by_name action
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_role_helpers.ex` - Use new action

**Benefits**:
- Consistent query patterns
- Better caching opportunities
- Reusable across codebase
- Follows Ash conventions

## Code Quality Improvements

### Actions Added
1. `User.check_name_availability` - Validate name availability with metadata
2. `User.get_by_name` - Look up user by display name
3. `UserPreferences.toggle_email_notifications` - Toggle email notifications
4. `UserPreferences.update_donation_settings` - Update donation settings with validation
5. `Livestream.start_livestream` - Start a new livestream with defaults
6. `Livestream.end_livestream` - End an active livestream with validation

### Change Modules Created
1. `Streampai.Accounts.UserPreferences.Changes.ValidateDonationAmounts` - Validates min/max donation amounts
2. `Streampai.Stream.Livestream.Changes.SetDefaultTitle` - Sets default title based on ID

### Pattern Improvements
- All LiveView operations now use proper Ash actions with actor context
- Business logic moved from helpers to Ash changes/preparations
- Validation logic centralized in Ash validations and change modules
- Consistent error handling using Ash error system

## Testing Results

All tests passing: **238 tests, 0 failures, 21 skipped**

The changes maintain backward compatibility while improving code quality and following Ash Framework best practices.

## Recommendations for Future Work

### Medium Priority

1. **ChatMessage and StreamEvent Queries**: Consider adding dedicated read actions for common query patterns instead of exposing flexible `get_for_*` actions. This would allow better authorization policies.

2. **Platform Connection Management**: Review platform connection/disconnection logic in settings to ensure it's using proper Ash actions with authorization.

3. **Avatar Upload**: The avatar upload component could benefit from a dedicated Ash action instead of direct file handling.

4. **Role Management**: While UserRoleHelpers is acceptable as a convenience layer, consider if some of the query logic could be moved to UserRole preparations.

### Low Priority

1. **Dashboard Data Aggregation**: `Dashboard.get_dashboard_data/1` could potentially use Ash calculations and aggregates for better caching.

2. **Usage Tracking**: Consider if usage metrics could be tracked using Ash actions for better audit trails.

3. **Billing Operations**: Review billing integration to ensure actor context is properly passed through subscription operations.

## Summary

This refactoring successfully moved significant business logic from LiveViews and helper modules into proper Ash Framework primitives. The codebase now:

1. ✅ Properly encapsulates business logic in Ash actions
2. ✅ Uses change modules for complex transformations
3. ✅ Consistently passes actor context for authorization
4. ✅ Follows Ash Framework best practices
5. ✅ Maintains test coverage with all tests passing

The improvements provide better:
- **Security**: Consistent authorization enforcement
- **Maintainability**: Business logic centralized in resources
- **Testability**: Change modules can be tested in isolation
- **Composability**: Actions can be reused across contexts
- **Audit Trail**: Proper actor tracking throughout

## Files Changed

**New Files Created:**
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_preferences/changes/validate_donation_amounts.ex`
- `/home/nxyt/streampai-elixir/lib/streampai/stream/livestream/changes/set_default_title.ex`

**Modified Files:**
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user.ex`
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_preferences.ex`
- `/home/nxyt/streampai-elixir/lib/streampai/accounts/user_role_helpers.ex`
- `/home/nxyt/streampai-elixir/lib/streampai/stream/livestream.ex`
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/dashboard_settings_live.ex`
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/viewer_details_live.ex`
- `/home/nxyt/streampai-elixir/lib/streampai_web/live/helpers/notification_preferences.ex`
- `/home/nxyt/streampai-elixir/lib/streampai/livestream_manager/user_stream_manager.ex`
