# UserStreamManager Flow Documentation

## 🎯 Simple Overview

When a user opens your dashboard in their browser, a UserStreamManager process automatically starts for that user. When they close all their browser tabs/sessions, the process stops after 5 seconds.

## 📋 Complete Flow: User → UserStreamManager

### 1. **User Opens Dashboard Page** 
```
User visits: /dashboard, /dashboard/stream, /dashboard/analytics, etc.
```

### 2. **LiveView Mounts with Authentication**
```elixir
# In router.ex - all dashboard routes use this:
ash_authentication_live_session :authentication_required,
  on_mount: [
    {StreampaiWeb.LiveUserAuth, :handle_impersonation},
    {StreampaiWeb.LiveUserAuth, :dashboard_presence}    # <-- This triggers the flow
  ]
```

### 3. **Presence Tracking Starts**
```elixir
# In live_user_auth.ex - dashboard_presence hook:
def on_mount(:dashboard_presence, _params, _session, socket) do
  if socket.assigns.current_user do
    if Phoenix.LiveView.connected?(socket) do
      topic = "users_presence"
      
      # Track user in Phoenix.Presence
      Presence.track(self(), topic, socket.assigns.current_user.id, %{
        email: socket.assigns.current_user.email,
        joined_at: System.system_time(:second)
      })
    end
  end
end
```

### 4. **Phoenix.Presence Broadcasts Join Event**
```
Phoenix.PubSub automatically broadcasts presence_diff event:
%{event: "presence_diff", payload: %{joins: %{"user-123" => meta}, leaves: %{}}}
```

### 5. **PresenceManager Receives Event**
```elixir
# In presence_manager.ex:
def handle_info(%Phoenix.Socket.Broadcast{
  event: "presence_diff", 
  payload: %{joins: joins, leaves: leaves}
}, state) do
  
  # For each joining user:
  Enum.reduce(joins, {state.active_users, state.managers}, fn {user_id, _meta}, {users_acc, managers_acc} ->
    # Add to active users
    users_acc = MapSet.put(users_acc, user_id)
    
    # Start UserStreamManager if not already running
    managers_acc = ensure_manager_started(managers_acc, user_id)
  end)
end
```

### 6. **UserStreamManager Starts**
```elixir
# PresenceManager calls:
DynamicSupervisor.start_child(
  Streampai.LivestreamManager.DynamicSupervisor,
  {UserStreamManager, user_id}
)

# UserStreamManager starts its children:
def init(user_id) do
  children = [
    {ConsoleLogger, user_id}  # Logs every second to show it's running
    # Other streaming components will be added here later
  ]
end
```

### 7. **Process Running & Logging**
```
[UserStreamManager:user-123] Console log #1 - 2025-09-07 17:39:20.121132Z
[UserStreamManager:user-123] Console log #2 - 2025-09-07 17:39:21.123121Z
[UserStreamManager:user-123] Console log #3 - 2025-09-07 17:39:22.124072Z
```

### 8. **User Closes Browser Tab**
```
LiveView process dies → Phoenix.Presence detects → broadcasts presence_diff with leaves
```

### 9. **Multi-Session Check**
```elixir
# PresenceManager checks if user has other sessions:
current_presence = StreampaiWeb.Presence.list("users_presence")
user_still_present = Map.has_key?(current_presence, user_id)

if user_still_present do
  # User has other tabs open - keep UserStreamManager running
else
  # No more sessions - schedule cleanup in 5 seconds
end
```

### 10. **Cleanup After 5 Seconds**
```elixir
# If no sessions remain after 5 seconds:
def handle_info({:cleanup_user, user_id}, state) do
  DynamicSupervisor.terminate_child(Streampai.LivestreamManager.DynamicSupervisor, pid)
  # UserStreamManager and all its children (ConsoleLogger) stop
end
```

## 🔍 Key Components

### **Files Involved:**
1. **`router.ex`** - Sets up `dashboard_presence` hook
2. **`live_user_auth.ex`** - Tracks user in Phoenix.Presence  
3. **`presence_manager.ex`** - Reacts to presence events, manages UserStreamManagers
4. **`user_stream_manager.ex`** - Supervisor for user-specific processes
5. **`console_logger.ex`** - Logs every second to show process is alive

### **Automatic Integration:**
- ✅ **No manual calls needed** - works with existing authentication
- ✅ **Phoenix.Presence handles** session tracking automatically  
- ✅ **Multiple tabs/sessions** handled correctly
- ✅ **Process cleanup** only happens when ALL sessions close

## 🧪 How to Verify It's Working

### **1. Start your server:**
```bash
mix phx.server
```

### **2. Log into dashboard:**
Visit `http://localhost:4000/dashboard` and log in.

### **3. Watch the logs:**
You should see:
```
[PresenceManager] Phoenix.Presence join: your-user-id
[UserStreamManager:your-user-id] Console log #1 - 2025-09-07 17:39:20.121132Z
[UserStreamManager:your-user-id] Console log #2 - 2025-09-07 17:39:21.123121Z
```

### **4. Open multiple tabs:**
- Open `/dashboard` in 3 tabs
- Close 2 tabs → logs should continue (UserStreamManager stays alive)
- Close last tab → after 5 seconds, logs stop (cleanup happens)

### **5. Debug in IEx console:**
```bash
iex -S mix phx.server

# In IEx:
iex> Streampai.LivestreamManager.PresenceHelper.debug()
```

## ⚙️ Configuration

### **Change cleanup timeout:**
```elixir
# In presence_manager.ex:
@cleanup_timeout 10_000  # Change to 10 seconds instead of 5
```

### **Add more streaming components:**
```elixir
# In user_stream_manager.ex, uncomment:
children = [
  {ConsoleLogger, user_id},
  {StreamStateServer, user_id},           # Stream state management  
  {PlatformSupervisor, user_id},         # Platform connections
  {CloudflareManager, user_id},          # Live streaming
  {AlertManager, user_id}                # Donation alerts
]
```

## 🎯 Summary

The system is **fully automatic**:
1. User visits dashboard → Phoenix.Presence tracks them
2. PresenceManager sees presence event → starts UserStreamManager  
3. UserStreamManager runs → ConsoleLogger shows it's alive
4. User closes all tabs → 5-second cleanup timer starts
5. No more sessions after 5 seconds → UserStreamManager stops

**Zero configuration needed** - it works with your existing authentication system!