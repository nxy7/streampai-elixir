# WireMock Record-Playback System

This setup uses **WireMock's record-playback functionality** to capture real API responses from YouTube and Cloudflare APIs, then replay them during tests. This provides authentic, up-to-date mock responses without manual stub creation.

## 🎯 Benefits of Record-Playback

✅ **Authentic API Responses** - Real data structures, edge cases, and timing
✅ **No Manual Mock Creation** - Automatically generated from real interactions
✅ **Easy Updates** - Re-record when APIs change
✅ **Complete Coverage** - Captures all response variations
✅ **Error Scenarios** - Records real error responses (404s, rate limits, etc.)

## 📋 Prerequisites

### Required Credentials

**Cloudflare API:**
```bash
export CLOUDFLARE_API_TOKEN="your_api_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
```

**YouTube API:**
```bash
export YOUTUBE_ACCESS_TOKEN="your_oauth_token"
```

Get YouTube token from [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
1. Go to https://developers.google.com/oauthplayground
2. Add scope: `https://www.googleapis.com/auth/youtube`
3. Authorize and get access token

## 🚀 Quick Start

### 1. Record All APIs (Recommended)
```bash
# Set your credentials first
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account"
export YOUTUBE_ACCESS_TOKEN="your_youtube_token"

# Record all APIs at once
./scripts/record_all_apis.sh
```

### 2. Record Individual APIs

**Cloudflare Only:**
```bash
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account"

docker compose -f docker-compose.test.yml up -d wiremock-recorder
mix run scripts/record_cloudflare_api.exs
docker compose -f docker-compose.test.yml stop wiremock-recorder
```

**YouTube Only:**
```bash
export YOUTUBE_ACCESS_TOKEN="your_token"

docker compose -f docker-compose.test.yml up -d wiremock-recorder
mix run scripts/record_youtube_api.exs
docker compose -f docker-compose.test.yml stop wiremock-recorder
```

### 3. Use Recorded Responses
```bash
# Test with recorded responses (no API credentials needed!)
WIREMOCK_ENABLED=true mix test

# Run specific WireMock tests
WIREMOCK_ENABLED=true mix test --only wiremock
```

## 📖 How It Works

### Recording Process

1. **WireMock Recorder Starts** - Acts as a proxy to real APIs
2. **API Operations Execute** - Scripts make real API calls through WireMock
3. **Responses Captured** - WireMock records requests and responses
4. **Mappings Generated** - Creates JSON stub files automatically
5. **Cleanup Applied** - Removes sensitive data, adds templating

### Playback Process

1. **WireMock Server Starts** - Loads recorded mappings
2. **Tests Run** - API clients point to WireMock instead of real APIs
3. **Responses Served** - WireMock returns recorded responses
4. **No Network Calls** - All API interactions are local

## 📁 File Structure

```
scripts/
├── record_all_apis.sh          # Master recording script
├── record_cloudflare_api.exs   # Cloudflare API recorder
├── record_youtube_api.exs      # YouTube API recorder
└── clean_recordings.exs        # Post-processing cleanup

test/fixtures/wiremock/
├── mappings/                   # Recorded API mappings (auto-generated)
│   ├── cloudflare_*.json      # Cloudflare API responses
│   └── youtube_*.json         # YouTube API responses
├── __files/                   # Large response bodies
└── recordings/                # Raw recording data

docker-compose.test.yml         # WireMock configurations
├── wiremock                   # Playback mode (tests)
└── wiremock-recorder          # Recording mode
```

## 🔄 Recording Workflow

### What Gets Recorded

**Cloudflare Stream API:**
- ✅ Create live input with metadata
- ✅ Retrieve live input details
- ✅ Create live output (RTMP destinations)
- ✅ List all outputs for input
- ✅ Toggle output enabled/disabled
- ✅ Delete output and input
- ✅ Error responses (404, validation errors)

**YouTube Live API:**
- ✅ List user's broadcasts
- ✅ Create new broadcast
- ✅ List user's live streams
- ✅ Create new live stream
- ✅ Bind stream to broadcast
- ✅ Insert chat messages
- ✅ Delete resources (cleanup)

### Automatic Data Sanitization

The recording process automatically:

**🔒 Removes Sensitive Data:**
- API tokens → `Bearer .*` pattern matching
- Account IDs → `{{account_id}}` template
- UUIDs → `{{uuid}}` template
- Stream keys → `{{randomValue}}` template

**📝 Adds Dynamic Templating:**
- Timestamps → `{{now}}`
- Random IDs → `{{uuid}}`
- Stream keys → `{{randomValue length=32 type='ALPHANUMERIC'}}`
- Channel IDs → `{{randomValue length=24 type='ALPHANUMERIC'}}`

**📊 Preserves Structure:**
- Response schemas remain identical
- Error response formats maintained
- Pagination and metadata intact

## 🛠️ Advanced Usage

### Manual Recording Steps

```bash
# 1. Start recorder
docker compose -f docker-compose.test.yml up -d wiremock-recorder

# 2. Check recorder status
curl http://localhost:8080/__admin/health

# 3. View recording UI (optional)
open http://localhost:8080/__admin/recorder

# 4. Run your recording script
mix run scripts/record_cloudflare_api.exs

# 5. Check generated mappings
ls test/fixtures/wiremock/mappings/

# 6. Stop recorder
docker compose -f docker-compose.test.yml stop wiremock-recorder
```

### Customizing Recordings

**Edit recording scripts** to modify what gets recorded:
- Add new API operations
- Change request parameters
- Test different error scenarios
- Capture edge cases

**Example: Add new Cloudflare operation:**
```elixir
defp record_new_operation(client, account_id) do
  Logger.info("  🆕 Recording: New operation")

  payload = %{"new_field" => "test_value"}
  {:ok, _response} = Req.post(client, url: "/client/v4/accounts/#{account_id}/new/endpoint", json: payload)

  Logger.info("    ✓ Recorded new operation")
end
```

### Post-Processing Recordings

```bash
# Clean up sensitive data and add templating
mix run scripts/clean_recordings.exs

# Or do it manually during recording
./scripts/record_all_apis.sh  # (includes automatic cleanup)
```

### Debugging Recordings

**Check WireMock logs:**
```bash
docker compose -f docker-compose.test.yml logs wiremock-recorder
```

**View all recorded mappings:**
```bash
curl -s http://localhost:8080/__admin/mappings | jq
```

**Test specific mapping:**
```bash
curl -s -X POST http://localhost:8080/client/v4/accounts/test_account/stream/live_inputs \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d '{"meta":{"user_id":"test"}}'
```

## 🔄 Updating Recordings

### When to Re-record

- 📅 **Monthly** - Keep responses current
- 🆕 **API Changes** - New endpoints or fields
- 🐛 **Test Failures** - Response structure changes
- ✨ **New Features** - Additional API operations needed

### Re-recording Process

```bash
# 1. Clear old recordings
rm -rf test/fixtures/wiremock/mappings/*

# 2. Record fresh responses
./scripts/record_all_apis.sh

# 3. Test the new recordings
WIREMOCK_ENABLED=true mix test

# 4. Commit updated mappings
git add test/fixtures/wiremock/mappings/
git commit -m "Update API recordings"
```

## 🧪 Testing with Recordings

### Test Configuration

Your tests automatically use recordings when:
```bash
export WIREMOCK_ENABLED=true
```

### Example Test

```elixir
defmodule MyAPITest do
  use ExUnit.Case

  # This will use recorded responses!
  test "cloudflare integration works" do
    {:ok, response} = Streampai.Cloudflare.APIClient.create_live_input("test-user")

    # Response comes from recording, not real API
    assert response["meta"]["user_id"] == "test-user"
    assert response["uid"] != nil
  end
end
```

### Hybrid Testing Strategy

```bash
# Fast development with recordings
WIREMOCK_ENABLED=true mix test

# Periodic real API validation
mix test --only integration  # (uses real APIs)

# CI/CD pipeline
WIREMOCK_ENABLED=true mix test  # (no credentials needed)
```

## 🚨 Troubleshooting

### Common Issues

**"Connection refused to WireMock"**
```bash
# Check if recorder is running
docker ps | grep wiremock
docker compose -f docker-compose.test.yml up -d wiremock-recorder
```

**"No mappings generated"**
- Check API credentials are valid
- Verify network connectivity
- Review WireMock logs for errors

**"Test failures with recordings"**
- Re-record latest API responses
- Check if API contracts changed
- Verify request formats match recordings

**"Sensitive data in recordings"**
```bash
# Run post-processing cleanup
mix run scripts/clean_recordings.exs

# Or check manual cleanup in scripts
grep -r "your_actual_token" test/fixtures/wiremock/mappings/
```

### Health Checks

```bash
# WireMock status
curl http://localhost:8080/__admin/health

# List all mappings
curl http://localhost:8080/__admin/mappings

# Test a recording
curl -X POST http://localhost:8080/client/v4/accounts/test_account/stream/live_inputs \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"meta":{"user_id":"test"}}'
```

## 📈 Best Practices

### Recording
- 🔄 **Record regularly** (monthly) to keep responses current
- 🛡️ **Review recordings** before committing (check for sensitive data)
- 📝 **Document changes** when API contracts evolve
- 🧪 **Test recordings** after capturing to ensure they work

### Development
- 🚀 **Use recordings by default** for fast development
- 🔍 **Real API validation** weekly or before releases
- 📊 **Monitor real APIs** for contract changes
- 🔧 **Update scripts** when adding new API operations

### Team Usage
- 📚 **Share recordings** via git (safe after cleanup)
- 🔑 **Protect credentials** (never commit real tokens)
- 📖 **Document workflow** for new team members
- 🤝 **Coordinate updates** to avoid conflicts

This record-playback system provides the best of both worlds: authentic API responses for realistic testing, combined with fast, reliable execution without external dependencies.