# Livestream Manager Testing Guide

This guide covers the comprehensive testing strategy for the Livestream Manager system. The testing approach includes multiple layers to ensure reliability, performance, and correctness.

## 🧪 Testing Architecture Overview

### **Test Isolation Strategy**
- **Separate test environments** with isolated registries and PubSub systems
- **Mock external dependencies** (platform APIs, Cloudflare, etc.)
- **Clean state between tests** using Ecto sandbox and process cleanup
- **Concurrent test execution** using async: true where safe

### **Testing Layers**

```
┌─────────────────────────────────────┐
│           Load Testing              │ ← Realistic user simulation
├─────────────────────────────────────┤
│        Integration Testing          │ ← Full system workflows
├─────────────────────────────────────┤
│       Property-Based Testing       │ ← Edge cases & invariants
├─────────────────────────────────────┤
│           Unit Testing              │ ← Individual components
└─────────────────────────────────────┘
```

## 🔧 Test Setup and Configuration

### **Dependencies**
Add to your `mix.exs`:
```elixir
defp deps do
  [
    # Existing deps...
    {:stream_data, "~> 0.5", only: :test},
    {:ex_unit_properties, "~> 0.4", only: :test},
    {:mox, "~> 1.0", only: :test}
  ]
end
```

### **Environment Variables**
```bash
# Property testing configuration
export PROPERTY_TEST_MAX_RUNS=200

# Load testing configuration  
export LOAD_TEST_USERS=50
export LOAD_TEST_DURATION=120

# Test database
export DATABASE_URL="ecto://user:pass@localhost/streampai_test"
```

## 📝 Test Types and Usage

### **1. Unit Tests**
Test individual components in isolation.

```bash
# Run all unit tests
mix test test/streampai/livestream_manager/

# Run specific component tests
mix test test/streampai/livestream_manager/stream_state_server_test.exs
```

**Example: Testing StreamStateServer**
```elixir
test "updates stream status and broadcasts changes" do
  user_id = "test_user"
  {:ok, pid} = StreamStateServer.start_link(user_id)
  
  # Subscribe to state changes
  Phoenix.PubSub.subscribe(test_config.pubsub_name, "user_stream:#{user_id}")
  
  StreamStateServer.update_status(pid, :live)
  
  # Verify state update
  state = StreamStateServer.get_state(pid)
  assert state.status == :live
  
  # Verify broadcast
  assert_receive {:stream_state_changed, updated_state}
end
```

### **2. Integration Tests**
Test complete workflows across multiple components.

```bash
# Run integration tests
mix test --include integration
```

**Example: End-to-End Event Processing**
```elixir
test "processes donation events end-to-end" do
  user_id = "integration_user"
  {:ok, _} = start_test_user_stream(test_config, user_id)
  
  # Subscribe to alertbox events
  Phoenix.PubSub.subscribe(test_config.pubsub_name, "widget_events:#{user_id}:alertbox")
  
  # Generate donation event
  donation_event = %{
    type: :donation,
    user_id: user_id,
    amount: 10.00,
    username: "generous_viewer"
  }
  
  EventBroadcaster.broadcast_event(donation_event)
  
  # Verify alertbox receives processed event
  assert_receive {:widget_event, alertbox_event}
  assert alertbox_event.display_time == 8
  assert alertbox_event.amount == 10.00
end
```

### **3. Property-Based Testing**
Test system properties and edge cases using generated data.

```bash
# Run property tests
mix test test/streampai/livestream_manager/event_broadcaster_property_test.exs
```

**Example: Event Processing Properties**
```elixir
property "valid events are always processed correctly" do
  check all event <- valid_event_generator() do
    EventBroadcaster.broadcast_event(event)
    
    # Verify event was processed
    assert_receive {:stream_event, processed_event}
    assert processed_event.type == event.type
    assert Map.has_key?(processed_event, :timestamp)
  end
end
```

### **4. Load Testing**
Simulate realistic usage patterns at scale.

```bash
# Basic load test
mix livestream.test --load --users=10 --duration=60

# Heavy load test
mix livestream.test --load --users=100 --duration=300

# Streaming simulation
mix livestream.test --stream-sim --streamers=20 --session-duration=600
```

**Custom Load Test Example**
```elixir
results = LoadTestFramework.run_load_test(
  users: 50,
  duration_ms: 120_000
)

# Analyze results
IO.puts("Events per second: #{results.results.total_events_processed / 120}")
IO.puts("Peak memory: #{results.results.peak_memory_mb}MB")
```

## 🛠️ Mock and Test Utilities

### **Platform API Mocking**
```elixir
# Set up mock responses
StreampaiTest.Mocks.PlatformAPIMock.set_response(
  :twitch, 
  :send_chat, 
  {:ok, %{message_id: "mock_msg_123"}}
)

# Verify API calls were made
call_log = StreampaiTest.Mocks.PlatformAPIMock.get_call_log()
assert length(call_log) == 1
```

### **Event Capture and Verification**
```elixir
# Capture all events during test execution
{result, events} = capture_events(pubsub_name, ["user_stream:123:events"], fn ->
  # Test code that generates events
  EventBroadcaster.broadcast_event(test_event)
end)

# Verify events were broadcast
assert length(events) >= 1
```

### **Test Isolation Helpers**
```elixir
# Start isolated test environment
{test_config, cleanup_fn} = start_test_livestream_manager()

# Use test-specific registries and PubSub
{:ok, pid} = start_test_user_stream(test_config, "test_user")

# Cleanup after test
on_exit(cleanup_fn)
```

## 📊 Performance Testing

### **Metrics to Monitor**
- **Event processing throughput** (events/second)
- **Memory usage patterns** (peak and average)
- **Process count scaling** (linear vs exponential growth)
- **Message queue lengths** (backpressure indicators)
- **Response times** (API call latency)

### **Performance Benchmarks**
```elixir
# Throughput test
@tag :performance
test "processes 1000 events within 5 seconds" do
  start_time = System.monotonic_time(:millisecond)
  
  # Generate 1000 events
  for i <- 1..1000 do
    EventBroadcaster.broadcast_event(create_test_event())
  end
  
  end_time = System.monotonic_time(:millisecond)
  duration = end_time - start_time
  
  assert duration < 5000, "Processing took too long: #{duration}ms"
end
```

### **Load Test Scenarios**

#### **Scenario 1: High-Volume Streamer**
```bash
mix livestream.test --stream-sim --streamers=1 --session-duration=3600
# Simulates one streamer with high event volume for 1 hour
```

#### **Scenario 2: Platform Surge**  
```bash
mix livestream.test --load --users=500 --duration=300
# Simulates platform-wide surge (500 concurrent users)
```

#### **Scenario 3: Sustained Operations**
```bash
mix livestream.test --load --users=100 --duration=7200
# Tests system stability over 2 hours
```

## 🧾 Test Commands Reference

### **Basic Testing**
```bash
# Run all tests except performance/load tests
mix test

# Run unit tests only
mix livestream.test --unit

# Run integration tests
mix livestream.test --integration

# Run property-based tests  
mix livestream.test --property

# Run all test types
mix livestream.test --all
```

### **Performance Testing**
```bash
# Include performance tests
mix test --include performance

# Load testing with custom parameters
mix livestream.test --load --users=N --duration=SECONDS

# Streaming simulation
mix livestream.test --stream-sim --streamers=N --session-duration=SECONDS
```

### **Debugging Tests**
```bash
# Run tests with detailed output
mix test --trace

# Run specific test with debugging
mix test test/path/to/test.exs:123 --trace

# Capture logs during testing
mix test --capture-log
```

## 🔍 Test Coverage and Quality

### **Coverage Goals**
- **Unit tests**: >90% line coverage
- **Integration tests**: All critical workflows
- **Property tests**: All public APIs
- **Load tests**: Realistic usage patterns

### **Code Quality Checks**
```bash
# Run with coverage reporting
mix test --cover

# Check test quality with Credo
mix credo test/

# Verify property test coverage
mix test --include property --cover
```

### **Continuous Integration**
```yaml
# .github/workflows/test.yml
- name: Run Unit Tests
  run: mix test --exclude performance --exclude load_test

- name: Run Integration Tests  
  run: mix test --include integration --exclude performance

- name: Run Property Tests
  run: mix livestream.test --property

- name: Run Basic Load Test
  run: mix livestream.test --load --users=5 --duration=30
```

## 🚨 Test Troubleshooting

### **Common Issues**

#### **Tests Timing Out**
```elixir
# Increase timeout for slow tests
@tag timeout: 30_000
test "slow integration test" do
  # Test code
end
```

#### **Process Cleanup**
```elixir
# Ensure proper cleanup in setup
setup do
  on_exit(fn ->
    # Clean up test processes
    cleanup_test_environment()
  end)
end
```

#### **Event Ordering Issues**
```elixir
# Use proper synchronization
test "events processed in order" do
  Phoenix.PubSub.subscribe(pubsub, "events")
  
  # Send events
  EventBroadcaster.broadcast_event(event1)
  EventBroadcaster.broadcast_event(event2)
  
  # Wait for both events
  assert_receive {:stream_event, ^event1}
  assert_receive {:stream_event, ^event2}
end
```

## 🎯 Best Practices

### **Test Organization**
- **Group related tests** in describe blocks
- **Use descriptive test names** that explain the scenario
- **Keep tests focused** on single responsibilities
- **Use setup blocks** for common test data

### **Test Data Management**
- **Use factories** for creating test data
- **Parameterize tests** for different scenarios  
- **Clean up after tests** to prevent interference
- **Use meaningful test data** that represents real usage

### **Assertion Strategies**
- **Test behavior, not implementation** details
- **Use specific assertions** rather than generic ones
- **Verify side effects** (broadcasts, database changes)
- **Test error conditions** and edge cases

This comprehensive testing strategy ensures the livestream manager is robust, performant, and reliable under various conditions and usage patterns.