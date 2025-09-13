# Donation TTS System

This document describes the Text-to-Speech (TTS) system for donation alerts implemented using Oban job processing.

## Overview

When a user makes a donation with a message, the system:

1. **Schedules TTS Job**: The donation page schedules an Oban job to process the donation
2. **Generates/Retrieves TTS**: The job generates TTS audio or retrieves cached version
3. **Broadcasts Alert**: Complete alert event (with TTS URL) is broadcast to the alertbox widget

## System Architecture

### 1. Donation Processing (`donation_live.ex`)

```elixir
# Instead of direct PubSub broadcast, schedule Oban job
case DonationTtsJob.schedule_donation_tts(user.id, donation_event) do
  {:ok, _job} -> Logger.info("Donation TTS job scheduled")
  {:error, reason} -> Logger.error("Failed to schedule job")
end
```

### 2. TTS Service (`tts_service.ex`)

**Hash-based Caching**: Uses SHA256 hash of `message + voice` combination to avoid regenerating identical TTS.

```elixir
# Example usage
{:ok, file_path} = TtsService.get_or_generate_tts("Thank you!", "default")
public_url = TtsService.get_tts_public_url(file_path)  # "/tts/abc123.json"
```

**Key Features**:
- Content-based deduplication (same message + voice = same file)
- Mock TTS provider (JSON metadata files for development)
- Graceful fallback (continues without TTS if generation fails)
- Public URL generation for frontend access

### 3. Donation TTS Job (`jobs/donation_tts_job.ex`)

**Oban Worker** that processes donations asynchronously:

```elixir
defmodule Streampai.Jobs.DonationTtsJob do
  use Oban.Worker, queue: :default, max_attempts: 3
  
  def perform(%Oban.Job{args: %{"user_id" => user_id, "donation_event" => event}}) do
    # 1. Generate TTS if message exists
    # 2. Create complete alert event with TTS info
    # 3. Broadcast to alertbox widget
  end
end
```

### 4. Alertbox Widget Integration

The alertbox widget receives complete events with TTS information:

```elixir
alert_event = %{
  type: :donation,
  username: "DonorName",
  message: "Thank you for the stream!",
  amount: 25.0,
  currency: "USD",
  voice: "default",
  tts_path: "/path/to/audio/file.json",
  tts_url: "/tts/abc123.json",  # Public URL for frontend
  timestamp: ~U[2025-09-10 20:00:00Z],
  platform: :twitch
}
```

## File Structure

```
lib/streampai/
├── jobs/
│   └── donation_tts_job.ex          # Oban job for processing donations
├── tts_service.ex                   # TTS generation and caching
└── ...

lib/streampai_web/
├── live/
│   └── donation_live.ex             # Updated to use Oban jobs
└── components/
    └── alertbox_obs_widget_live.ex  # Receives complete alert events

priv/static/
└── tts/                            # TTS audio files (served as static assets)
    ├── abc123.json                 # Mock TTS files (JSON metadata)
    └── def456.json

test/streampai/
├── tts_service_test.exs            # TTS service tests
└── jobs/
    └── donation_tts_job_test.exs   # Job processing tests
```

## Configuration

### Static File Serving

TTS files are served as static assets. The `tts` path is added to `static_paths`:

```elixir
# lib/streampai_web.ex
def static_paths, do: ~w(assets fonts images tts favicon.ico ...)
```

### Oban Configuration

The system uses the existing Oban setup. Jobs are processed in the `:default` queue.

## Development vs Production

### Current (Development)
- **Mock TTS Provider**: Creates JSON metadata files instead of real audio
- **File Extension**: `.json` (would be `.mp3` in production)
- **Content**: Metadata about the TTS request for testing

### Future (Production)
- **Real TTS Provider**: Integration with services like ElevenLabs, Azure Speech, etc.
- **Audio Files**: Actual MP3/WAV audio files
- **Enhanced Features**: Voice cloning, custom voices, speed/pitch control

## Testing

Comprehensive test coverage includes:

1. **TTS Service Tests**: Hash generation, caching, file management
2. **Job Tests**: Event processing, PubSub broadcasting, error handling
3. **Integration**: End-to-end donation flow with TTS

```bash
# Run TTS-related tests
mix test test/streampai/tts_service_test.exs test/streampai/jobs/donation_tts_job_test.exs
```

## Usage

### For Streamers

1. Viewers make donations with messages on `/u/{username}`
2. Messages are automatically converted to speech (if provided)
3. Alertbox widget displays donation with optional TTS playback
4. OBS embeds the widget as a browser source

### For Developers

```elixir
# Schedule a donation TTS job
{:ok, job} = DonationTtsJob.schedule_donation_tts(user_id, donation_event)

# Generate TTS manually
{:ok, file_path} = TtsService.get_or_generate_tts("Hello world", "default")
public_url = TtsService.get_tts_public_url(file_path)

# Cleanup old files (maintenance)
{:ok, deleted_count} = TtsService.cleanup_old_tts_files(30)  # Remove files older than 30 days
```

## Future Enhancements

1. **Real TTS Integration**: Replace mock provider with actual TTS service
2. **Voice Management**: User-selectable voices, voice cloning
3. **Audio Processing**: Volume normalization, speed adjustment
4. **Moderation**: Content filtering, inappropriate message detection
5. **Analytics**: TTS usage statistics, popular voices
6. **Caching Strategy**: Redis-based caching for high-volume streamers
7. **CDN Integration**: Serve TTS files from CDN for better performance

## Error Handling

The system is designed to be resilient:

- **TTS Generation Failure**: Alert still displays without audio
- **Job Failures**: Oban retries up to 3 times
- **File Access Issues**: Graceful fallback to no TTS
- **Invalid Input**: Default values for missing fields

This ensures donation alerts always work, even if TTS processing encounters issues.