# WireMock Setup for Mocking YouTube and Cloudflare APIs

This setup uses **WireMock's record-playback functionality** to capture real API responses and replay them during tests. This provides authentic, up-to-date mock responses without manual stub creation.

🚀 **For the complete record-playback workflow, see [WIREMOCK_RECORDING.md](./WIREMOCK_RECORDING.md)**

## Quick Start (Record-Playback Mode)

### 1. Record Real API Responses

```bash
# Set your API credentials
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account"
export YOUTUBE_ACCESS_TOKEN="your_youtube_token"

# Record all APIs (one-time setup)
./scripts/record_all_apis.sh
```

### 2. Use Recorded Responses

```bash
# Test with recorded responses (no credentials needed!)
WIREMOCK_ENABLED=true mix test
```

### 2. Manual WireMock Server Management (Optional)

```bash
# Start WireMock server
docker-compose -f docker-compose.test.yml up -d wiremock

# Stop WireMock server
docker-compose -f docker-compose.test.yml down
```

## How It Works

### Architecture

- **WireMock Server**: Runs in Docker container on port 8080
- **API Clients**: Automatically redirect to WireMock when `WIREMOCK_ENABLED=true`
- **Mock Definitions**: JSON files in `test/fixtures/wiremock/mappings/`
- **Test Helpers**: Automatic WireMock lifecycle management

### Configuration

When `WIREMOCK_ENABLED=true`:
- Cloudflare API base URL → `http://localhost:8080`
- YouTube API base URL → `http://localhost:8080`
- Test credentials are automatically provided
- Real API calls are completely avoided

## Available Mock APIs

### Cloudflare Stream API

✅ **Live Inputs**
- `POST /accounts/test_account/stream/live_inputs` - Create live input
- `GET /accounts/test_account/stream/live_inputs/{id}` - Get live input
- `DELETE /accounts/test_account/stream/live_inputs/{id}` - Delete live input

✅ **Live Outputs**
- `POST /accounts/test_account/stream/live_inputs/{id}/outputs` - Create output
- `GET /accounts/test_account/stream/live_inputs/{id}/outputs` - List outputs
- `PUT /accounts/test_account/stream/live_inputs/{id}/outputs/{output_id}` - Toggle output
- `DELETE /accounts/test_account/stream/live_inputs/{id}/outputs/{output_id}` - Delete output

### YouTube Live Streaming API

✅ **Live Broadcasts**
- `GET /liveBroadcasts` - List broadcasts
- `POST /liveBroadcasts` - Create broadcast

✅ **Live Streams**
- `GET /liveStreams` - List streams
- `POST /liveStreams` - Create stream

✅ **Live Chat**
- `POST /liveChat/messages` - Insert chat message

## Usage Examples

### Testing with WireMock

```elixir
defmodule MyAPITest do
  use ExUnit.Case

  setup do
    setup_external_api_test(
      env_vars: [],  # No real credentials needed!
      service: "Test Service",
      tags: [:integration]
    )
  end

  test "cloudflare api works" do
    {:ok, response} = Streampai.Cloudflare.APIClient.create_live_input("test-user")
    assert response["meta"]["user_id"] == "test-user"
  end
end
```

### Running Different Test Types

```bash
# WireMock tests only (fast, no credentials needed)
WIREMOCK_ENABLED=true mix test --only wiremock

# Real API integration tests (requires credentials)
mix test --only integration

# All tests (skips real API tests if no credentials)
mix test
```

## Mock Response Features

### Dynamic Values
- **Timestamps**: Auto-generated current timestamps
- **UUIDs**: Random UUIDs for each request
- **User Data**: Echoed from request payloads
- **Secrets**: Realistic random keys and tokens

### Response Templates
```json
{
  "created": "{{now format='yyyy-MM-dd'T'HH:mm:ss'.'SSS'Z'}}",
  "uid": "{{uuid}}",
  "user_id": "{{jsonPath request.body '$.meta.user_id'}}"
}
```

## Development Workflow

### Adding New Mock Endpoints

1. **Create stub file** in `test/fixtures/wiremock/mappings/`
2. **Follow naming convention**: `{service}_{operation}.json`
3. **Use templating** for dynamic responses
4. **Test thoroughly** with real API patterns

### Example Stub Structure
```json
{
  "request": {
    "method": "POST",
    "urlPath": "/api/endpoint"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "id": "{{uuid}}",
      "timestamp": "{{now}}"
    }
  }
}
```

## Troubleshooting

### WireMock Won't Start
```bash
# Check if port 8080 is available
lsof -i :8080

# View WireMock logs
docker-compose -f docker-compose.test.yml logs wiremock
```

### API Calls Not Being Mocked
1. Verify `WIREMOCK_ENABLED=true` is set
2. Check that stub JSON files are valid
3. Ensure URL paths match exactly
4. Review WireMock admin interface: http://localhost:8080/__admin

### Test Failures
1. Compare expected vs actual request patterns
2. Check WireMock mappings are loaded correctly
3. Verify test credentials match stub expectations

## Benefits

✅ **No API Credentials Required**: Developers can run tests without setting up real API access
✅ **Fast Test Execution**: No network calls to external services
✅ **Predictable Responses**: Consistent, controllable API behavior
✅ **Offline Development**: Work without internet connectivity
✅ **Easy CI/CD**: No secret management in build pipelines
✅ **API Contract Testing**: Validate integration with expected API responses

## File Structure

```
test/
├── fixtures/wiremock/
│   ├── mappings/           # API endpoint stubs
│   │   ├── cloudflare_*.json
│   │   └── youtube_*.json
│   └── __files/            # Static response files (if needed)
├── support/
│   └── wiremock_helpers.ex # WireMock management utilities
└── wiremock_test.exs       # Example WireMock tests

docker-compose.test.yml     # WireMock server configuration
```

This setup provides a robust foundation for testing external API integrations while maintaining the ability to run real integration tests when needed.