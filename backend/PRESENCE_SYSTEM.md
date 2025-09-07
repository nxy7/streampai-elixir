# Presence-Based UserStreamManager System - Quick Reference

## ⚡ What It Does
Automatically starts/stops UserStreamManager processes when users visit/leave dashboard pages.

## 🔍 Debug & Monitor

### **See current state:**
```bash
# In your running Phoenix app's IEx console:
iex> Streampai.LivestreamManager.PresenceHelper.debug()
```

### **Check managed users:**
```bash  
iex> Streampai.LivestreamManager.PresenceHelper.get_managed_users()
```

### **Expected console logs:**
```
[PresenceManager] Phoenix.Presence join: user-id-123
[UserStreamManager:user-id-123] Console log #1 - 2025-09-07 17:39:20.121132Z
[UserStreamManager:user-id-123] Console log #2 - 2025-09-07 17:39:21.123121Z
```

## 📁 Key Files
- **`USER_STREAM_MANAGER_FLOW.md`** - Complete step-by-step flow documentation
- **`presence_manager.ex`** - Manages lifecycle based on presence events  
- **`user_stream_manager.ex`** - Supervisor for user processes (add streaming components here)
- **`console_logger.ex`** - Test component that logs every second

## ⚙️ Configuration
```elixir
# Change cleanup timeout in presence_manager.ex:
@cleanup_timeout 5_000  # 5 seconds (default)
```

## 🎯 How It Works (Simple)
1. User visits dashboard → Phoenix.Presence tracks them
2. PresenceManager sees event → starts UserStreamManager
3. User closes all tabs → waits 5 seconds → stops UserStreamManager
4. Multi-session aware: only stops when ALL user sessions are closed

**See `USER_STREAM_MANAGER_FLOW.md` for complete technical details.**