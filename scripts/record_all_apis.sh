#!/bin/bash
set -e

echo "🎬 WireMock API Recording Session"
echo "=================================="

# Check if required environment variables are set
check_env() {
    local var_name=$1
    if [ -z "${!var_name}" ]; then
        echo "❌ Error: Environment variable $var_name is not set"
        echo "   Please set it and try again"
        return 1
    fi
}

# Function to start WireMock recorder
start_recorder() {
    echo "🚀 Starting WireMock recorder..."
    docker compose -f docker-compose.test.yml up -d wiremock-recorder

    # Wait for WireMock to be ready
    echo "⏳ Waiting for WireMock to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/__admin/health >/dev/null 2>&1; then
            echo "✅ WireMock recorder is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ WireMock failed to start after 30 seconds"
            exit 1
        fi
        sleep 1
    done
}

# Function to clean up existing mappings
cleanup_mappings() {
    echo "🧹 Cleaning up old mappings..."
    rm -rf test/fixtures/wiremock/mappings/*
    echo "   Cleared mapping files"
}

# Function to record Cloudflare API
record_cloudflare() {
    echo ""
    echo "📡 Recording Cloudflare API..."
    echo "=============================="

    if check_env "CLOUDFLARE_API_TOKEN" && check_env "CLOUDFLARE_ACCOUNT_ID"; then
        mix run scripts/record_cloudflare_api.exs
        echo "✅ Cloudflare recording completed"
    else
        echo "⚠️  Skipping Cloudflare API recording due to missing credentials"
        echo "   Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to record"
        return 1
    fi
}

# Function to record YouTube API
record_youtube() {
    echo ""
    echo "📺 Recording YouTube API..."
    echo "==========================="

    if check_env "YOUTUBE_ACCESS_TOKEN"; then
        mix run scripts/record_youtube_api.exs
        echo "✅ YouTube recording completed"
    else
        echo "⚠️  Skipping YouTube API recording due to missing credentials"
        echo "   Set YOUTUBE_ACCESS_TOKEN to record"
        echo "   Get token from: https://developers.google.com/oauthplayground"
        echo "   Scopes: https://www.googleapis.com/auth/youtube"
        return 1
    fi
}

# Function to stop recorder and show results
finalize_recording() {
    echo ""
    echo "🏁 Finalizing recording session..."
    echo "================================="

    # Stop the recorder
    docker compose -f docker-compose.test.yml stop wiremock-recorder

    # Count generated mappings
    mapping_count=$(find test/fixtures/wiremock/mappings -name "*.json" 2>/dev/null | wc -l)

    echo "✅ Recording session completed!"
    echo "   Generated $mapping_count API mappings"
    echo "   Files saved in: test/fixtures/wiremock/mappings/"

    if [ $mapping_count -gt 0 ]; then
        echo ""
        echo "📋 Generated mappings:"
        ls -la test/fixtures/wiremock/mappings/
    fi
}

# Main execution flow
main() {
    echo "Starting at: $(date)"
    echo ""

    # Ensure we're in the right directory
    if [ ! -f "mix.exs" ]; then
        echo "❌ Error: Please run this script from the project root directory"
        exit 1
    fi

    # Setup
    cleanup_mappings
    start_recorder

    # Record APIs
    cloudflare_success=0
    youtube_success=0

    if record_cloudflare; then
        cloudflare_success=1
    fi

    if record_youtube; then
        youtube_success=1
    fi

    # Finalize
    finalize_recording

    # Summary
    echo ""
    echo "📊 Recording Summary:"
    echo "===================="
    echo "Cloudflare API: $([ $cloudflare_success -eq 1 ] && echo "✅ Recorded" || echo "❌ Skipped")"
    echo "YouTube API:    $([ $youtube_success -eq 1 ] && echo "✅ Recorded" || echo "❌ Skipped")"

    if [ $cloudflare_success -eq 1 ] || [ $youtube_success -eq 1 ]; then
        echo ""
        echo "🎉 Ready for testing! Run:"
        echo "   WIREMOCK_ENABLED=true mix test"
    else
        echo ""
        echo "⚠️  No APIs were recorded. Set credentials and try again."
    fi
}

# Run main function
main "$@"