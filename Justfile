_default:
  @just --unstable --list

init-dev:
	docker compose up

format:
	mix format;
	cd frontend; bun format; bun lint -- --write --unsafe

test:
	#!/usr/bin/env bash
	set -euo pipefail
	set -a
	source <(grep -v '^#' .env | grep -v '^$')
	set +a
	mix test --max-failures 3 --exclude external

start:
	mix start

si:
	#!/usr/bin/env bash
	set -euo pipefail
	set -a
	source <(grep -v '^#' .env | grep -v '^$')
	set +a
	iex -S mix phx.server

dev:
	#!/usr/bin/env bash
	set -euo pipefail

	# Load environment variables
	set -a
	source <(grep -v '^#' .env | grep -v '^$')
	set +a

	# Get ports from environment or use defaults
	PHOENIX_PORT=${PORT:-4000}
	FRONTEND_PORT=${FRONTEND_PORT:-3000}
	CADDY_PORT=${CADDY_PORT:-8000}

	# Determine worktree name for Electric slot cleanup
	current_dir=$(pwd | awk -F/ '{print $NF}')
	parent_dir=$(dirname "$(pwd)" | awk -F/ '{print $NF}')
	if [[ "$current_dir" == "streampai-elixir" && "$parent_dir" =~ ^[a-f0-9]{4}- ]]; then
		WORKTREE_NAME="$parent_dir"
	else
		WORKTREE_NAME="$current_dir"
	fi
	SLOT_PREFIX="electric_slot_streampai_$(echo "$WORKTREE_NAME" | tr '-' '_' | cut -c1-30)"

	# Set terminal title to show ports (visible in terminal tab/title bar)
	echo -ne "\033]0;Streampai | Phoenix:$PHOENIX_PORT | Caddy:$CADDY_PORT\007"

	echo "🚀 Starting Streampai development environment"
	echo "   Phoenix:  http://localhost:$PHOENIX_PORT"
	echo "   Frontend: http://localhost:$FRONTEND_PORT"
	echo "   Caddy:    https://localhost:$CADDY_PORT"
	echo ""
	echo "📱 Access the app at: https://localhost:$CADDY_PORT"
	echo ""
	echo "💡 Tips:"
	echo "   overmind connect <service>  - attach to a service (phoenix, frontend, caddy)"
	echo "   Ctrl+C                      - stop all services"
	echo ""

	# Check required tools
	if ! command -v caddy &> /dev/null; then
		echo "❌ Caddy is not installed. Please install it:"
		echo "   brew install caddy"
		echo "   caddy trust  # Install local CA certificates"
		exit 1
	fi

	if ! command -v overmind &> /dev/null; then
		echo "❌ Overmind is not installed. Enter nix shell:"
		echo "   nix develop"
		exit 1
	fi

	# Ensure dependencies are installed (in parallel)
	echo "📦 Checking dependencies..."
	(mix deps.get --check-unused 2>/dev/null || mix deps.get) &
	(cd frontend && bun install --frozen-lockfile 2>/dev/null || bun install) &
	wait
	echo "📦 Dependencies ready"
	echo ""

	# Cleanup function to drop replication slot after overmind exits
	cleanup() {
		echo ""
		echo "🧹 Cleaning up Electric replication slot..."
		sleep 2
		PGPASSWORD=postgres psql -U postgres -h localhost -c \
			"SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE active = false AND slot_name LIKE '${SLOT_PREFIX}%';" \
			2>/dev/null || true
		echo "✅ Cleanup complete"
	}

	trap cleanup EXIT

	# Use overmind to manage processes (provides tmux-based log separation)
	# -N disables overmind's automatic PORT assignment which conflicts with ours
	overmind start -f Procfile.dev -N

caddy:
	#!/usr/bin/env bash
	set -euo pipefail
	set -a
	source <(grep -v '^#' .env | grep -v '^$')
	set +a
	# Caddy reads PORT, FRONTEND_PORT, CADDY_PORT from env
	caddy run --config Caddyfile

caddy-setup:
	#!/usr/bin/env bash
	echo "Installing Caddy..."
	brew install caddy || echo "Caddy already installed"
	echo "Installing local CA certificates (may require sudo)..."
	caddy trust
	echo "✅ Caddy is ready! Run 'just dev' to start development."

worktree name:
	#!/usr/bin/env bash
	set -euo pipefail
	echo "Creating worktree: {{name}}"

	# Create the worktree
	git worktree add "../{{name}}" -b "{{name}}" || echo "Worktree ../{{name}} already exists"
	cd "../{{name}}"

	just worktree-setup

worktree-setup:
	#!/usr/bin/env bash
	set -euo pipefail

	# Allow direnv for this worktree to load flake.nix dependencies
	if command -v direnv &> /dev/null; then
		echo "🔧 Allowing direnv for this worktree..."
		direnv allow .
	fi

	# Detect worktree name: use parent dir if in vibe-kanban structure, otherwise current dir
	current_dir=$(pwd | awk -F/ '{print $NF}')
	parent_dir=$(dirname "$(pwd)" | awk -F/ '{print $NF}')

	# If current dir is streampai-elixir but parent looks like a vibe-kanban worktree ID
	# (e.g., "987c-update-claude-md"), use parent for unique naming
	if [[ "$current_dir" == "streampai-elixir" && "$parent_dir" =~ ^[a-f0-9]{4}- ]]; then
		name="$parent_dir"
		echo "Detected vibe-kanban worktree: $name"
	else
		name="$current_dir"
	fi

	echo "Setting up worktree: $name"

	# Copy .env from main repo if not already present (vibe-kanban may have copied it)
	if [ ! -f .env ]; then
		cp ~/streampai-elixir/.env .
	fi

	# Copy compiled artifacts for faster setup
	cp -r ~/streampai-elixir/deps . 2>/dev/null || true
	cp -r ~/streampai-elixir/_build . 2>/dev/null || true

	# Remove all worktree-specific variables and comments first (clean slate for idempotency)
	grep -v '^DATABASE_URL=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^CADDY_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_CLIENT_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_SERVER_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_SERVER_FUNCTION_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_SSR_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^DISABLE_LIVE_DEBUGGER=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^DB_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^PGWEB_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^MINIO_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^MINIO_CONSOLE_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^COMPOSE_PROJECT_NAME=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '# Worktree-specific configuration' .env > .env.tmp && mv .env.tmp .env || true

	# Function to find a random available port in a range
	find_port() {
		local min=$1 max=$2
		while true; do
			port=$((min + RANDOM % (max - min)))
			if ! lsof -i :$port >/dev/null 2>&1; then
				echo $port
				return
			fi
		done
	}

	# Function to get existing port from .env or generate a new one
	# Now validates that existing port is in the expected range
	get_or_generate_port() {
		local var_name=$1 min=$2 max=$3
		local existing=$(grep "^${var_name}=" .env 2>/dev/null | cut -d= -f2 | tr -d ' ')
		if [ -n "$existing" ] && [ "$existing" -ge "$min" ] && [ "$existing" -le "$max" ]; then
			echo "$existing"
		else
			find_port "$min" "$max"
		fi
	}

	# Reuse existing ports if already configured (idempotent), otherwise generate new ones
	DB_PORT=$(get_or_generate_port DB_PORT 5433 5999)
	PGWEB_PORT=$(get_or_generate_port PGWEB_PORT 8083 8199)
	MINIO_PORT=$(get_or_generate_port MINIO_PORT 9002 9099)
	MINIO_CONSOLE_PORT=$(get_or_generate_port MINIO_CONSOLE_PORT 9100 9199)
	PHOENIX_PORT=$(get_or_generate_port PORT 4100 4999)
	FRONTEND_PORT=$(get_or_generate_port FRONTEND_PORT 3100 3999)
	CADDY_PORT=$(get_or_generate_port CADDY_PORT 8100 8999)
	FRONTEND_HMR_CLIENT_PORT=$(get_or_generate_port FRONTEND_HMR_CLIENT_PORT 3100 3999)
	FRONTEND_HMR_SERVER_PORT=$(get_or_generate_port FRONTEND_HMR_SERVER_PORT 3100 3999)
	FRONTEND_HMR_SERVER_FUNCTION_PORT=$(get_or_generate_port FRONTEND_HMR_SERVER_FUNCTION_PORT 3100 3999)
	FRONTEND_HMR_SSR_PORT=$(get_or_generate_port FRONTEND_HMR_SSR_PORT 3100 3999)

	# Use worktree name as compose project name for isolated containers/volumes
	COMPOSE_PROJECT="streampai_$(echo "$name" | tr '-' '_')"
	DB_NAME="${COMPOSE_PROJECT}_dev"
	DB_URL="postgresql://postgres:postgres@localhost:$DB_PORT/$DB_NAME?sslmode=disable"

	# Append worktree-specific configuration
	echo "" >> .env
	echo "# Worktree-specific configuration (auto-generated by just worktree-setup)" >> .env
	echo "COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT" >> .env
	echo "DB_PORT=$DB_PORT" >> .env
	echo "PGWEB_PORT=$PGWEB_PORT" >> .env
	echo "MINIO_PORT=$MINIO_PORT" >> .env
	echo "MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT" >> .env
	echo "DATABASE_URL=$DB_URL" >> .env
	echo "PORT=$PHOENIX_PORT" >> .env
	echo "FRONTEND_PORT=$FRONTEND_PORT" >> .env
	echo "CADDY_PORT=$CADDY_PORT" >> .env
	echo "FRONTEND_HMR_CLIENT_PORT=$FRONTEND_HMR_CLIENT_PORT" >> .env
	echo "FRONTEND_HMR_SERVER_PORT=$FRONTEND_HMR_SERVER_PORT" >> .env
	echo "FRONTEND_HMR_SERVER_FUNCTION_PORT=$FRONTEND_HMR_SERVER_FUNCTION_PORT" >> .env
	echo "FRONTEND_HMR_SSR_PORT=$FRONTEND_HMR_SSR_PORT" >> .env
	echo "DISABLE_LIVE_DEBUGGER=true" >> .env

	echo ""
	echo "📋 Worktree ports for '$name':"
	echo "   PostgreSQL: localhost:$DB_PORT"
	echo "   Phoenix:    http://localhost:$PHOENIX_PORT"
	echo "   Frontend:   http://localhost:$FRONTEND_PORT"
	echo "   Caddy:      https://localhost:$CADDY_PORT"
	echo "   PgWeb:      http://localhost:$PGWEB_PORT"
	echo "   Minio:      http://localhost:$MINIO_PORT (console: $MINIO_CONSOLE_PORT)"
	echo ""

	# Export environment variables for subsequent commands
	export $(grep -v '^#' .env | grep -v '^$' | xargs)

	# Start Docker containers for this worktree
	echo "🐳 Starting Docker containers..."
	docker compose up -d

	# Wait for PostgreSQL to be ready
	echo "⏳ Waiting for PostgreSQL to be ready..."
	for i in {1..30}; do
		if PGPASSWORD=postgres psql -U postgres -h localhost -p $DB_PORT -c "SELECT 1" >/dev/null 2>&1; then
			echo "✅ PostgreSQL is ready"
			break
		fi
		if [ $i -eq 30 ]; then
			echo "❌ PostgreSQL failed to start. Check 'docker compose logs timescaledb'"
			exit 1
		fi
		sleep 1
	done

	# Install backend dependencies
	mix deps.get

	# Create database and run migrations/seeds
	mix ecto.create 2>/dev/null || echo "Database already exists"
	mix ash.setup

	# Compile to verify everything works
	mix compile

	# Install frontend dependencies
	echo "Installing frontend dependencies..."
	cd frontend && bun install

	# Add MCP server for this worktree
	claude mcp add --transport http tidewave "http://localhost:$PHOENIX_PORT/tidewave/mcp" 2>/dev/null || true

	echo ""
	echo "✅ Worktree '$name' is ready!"
	echo "   Run 'just dev' to start with Caddy (recommended)"
	echo "   Run 'just si' to start without Caddy"
	echo ""
	echo "   Docker containers are running in background."
	echo "   Use 'docker compose down' to stop them when done."

	claude --dangerously-skip-permissions .

# Clean up orphaned Electric replication slots
cleanup-slots:
	#!/usr/bin/env bash
	echo "🔍 Checking for orphaned Electric replication slots..."
	slots=$(PGPASSWORD=postgres psql -U postgres -h localhost -t -c \
		"SELECT slot_name FROM pg_replication_slots WHERE active = false AND slot_name LIKE 'electric_slot_%';" 2>/dev/null | tr -d ' ')
	if [ -z "$slots" ]; then
		echo "✅ No orphaned slots found"
	else
		echo "Found orphaned slots:"
		echo "$slots" | while read slot; do
			[ -n "$slot" ] && echo "  - $slot"
		done
		echo ""
		echo "Dropping orphaned slots..."
		PGPASSWORD=postgres psql -U postgres -h localhost -c \
			"SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE active = false AND slot_name LIKE 'electric_slot_%';" \
			>/dev/null 2>&1
		echo "✅ Orphaned slots cleaned up"
	fi

# Clean up current worktree's Electric replication slot
cleanup-worktree-slot:
	#!/usr/bin/env bash
	set -a
	source <(grep -v '^#' .env | grep -v '^$') 2>/dev/null || true
	set +a
	DB_PORT=${DB_PORT:-5432}
	# Determine worktree name
	current_dir=$(pwd | awk -F/ '{print $NF}')
	parent_dir=$(dirname "$(pwd)" | awk -F/ '{print $NF}')
	if [[ "$current_dir" == "streampai-elixir" && "$parent_dir" =~ ^[a-f0-9]{4}- ]]; then
		name="$parent_dir"
	else
		name="$current_dir"
	fi
	SLOT_PREFIX="electric_slot_streampai_$(echo "$name" | tr '-' '_' | cut -c1-30)"
	echo "🧹 Cleaning up Electric slot for worktree: $name"
	echo "   Slot prefix: $SLOT_PREFIX"
	echo "   Database port: $DB_PORT"
	PGPASSWORD=postgres psql -U postgres -h localhost -p $DB_PORT -c \
		"SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE active = false AND slot_name LIKE '${SLOT_PREFIX}%';" \
		2>/dev/null || echo "No matching slots found"
	echo "✅ Done"

# Show port configuration for current worktree
ports:
	#!/usr/bin/env bash
	set -a
	source <(grep -v '^#' .env | grep -v '^$') 2>/dev/null || true
	set +a
	echo "Port configuration:"
	echo "   PostgreSQL: ${DB_PORT:-5432}"
	echo "   Phoenix:    ${PORT:-4000}"
	echo "   Frontend:   ${FRONTEND_PORT:-3000}"
	echo "   Caddy:      ${CADDY_PORT:-8000}"
	echo "   PgWeb:      ${PGWEB_PORT:-8082}"
	echo "   Minio:      ${MINIO_PORT:-9000} (console: ${MINIO_CONSOLE_PORT:-9001})"

# Kill processes running on overmind ports (Phoenix, Frontend, Caddy)
kill-ports:
	#!/usr/bin/env bash
	set -a
	source <(grep -v '^#' .env | grep -v '^$') 2>/dev/null || true
	set +a

	PHOENIX_PORT=${PORT:-4000}
	FRONTEND_PORT=${FRONTEND_PORT:-3000}
	CADDY_PORT=${CADDY_PORT:-8000}
	FRONTEND_HMR_CLIENT_PORT=${FRONTEND_HMR_CLIENT_PORT:-3001}
	FRONTEND_HMR_SERVER_PORT=${FRONTEND_HMR_SERVER_PORT:-3002}
	FRONTEND_HMR_SERVER_FUNCTION_PORT=${FRONTEND_HMR_SERVER_FUNCTION_PORT:-3003}
	FRONTEND_HMR_SSR_PORT=${FRONTEND_HMR_SSR_PORT:-3004}


	echo "🔪 Killing processes on overmind ports..."

	kill_port() {
		local port=$1
		local name=$2
		local pids=$(lsof -ti :$port 2>/dev/null)
		if [ -n "$pids" ]; then
			echo "   Killing $name on port $port (PIDs: $pids)"
			echo "$pids" | xargs kill -9 2>/dev/null || true
		else
			echo "   $name port $port: no process running"
		fi
	}

	kill_port $PHOENIX_PORT "Phoenix"
	kill_port $FRONTEND_PORT "Frontend"
	kill_port $CADDY_PORT "Caddy"
	kill_port $FRONTEND_HMR_CLIENT_PORT "Frontend HMR Client"
	kill_port $FRONTEND_HMR_SERVER_PORT "Frontend HMR Server"
	kill_port $FRONTEND_HMR_SERVER_FUNCTION_PORT "Frontend HMR Server Function"
	kill_port $FRONTEND_HMR_SSR_PORT "Frontend HMR SSR"
	rm .overmind.sock 2>/dev/null || true

	echo "✅ Done"

# ============================================================================
# Production Commands
# ============================================================================

# Setup and run in production mode locally (for benchmarking)
prod:
	#!/usr/bin/env bash
	set -euo pipefail
	set -a
	source <(grep -v '^#' .env | grep -v '^$')
	set +a
	export MIX_ENV=prod
	export SECRET_KEY_BASE=$(mix phx.gen.secret)
	export TOKEN_SIGNING_SECRET=$(openssl rand -base64 32)
	export GOOGLE_CLIENT_ID=dummy
	export GOOGLE_CLIENT_SECRET=dummy
	export GOOGLE_REDIRECT_URI=http://localhost:4000
	export TWITCH_CLIENT_ID=dummy
	export TWITCH_CLIENT_SECRET=dummy
	export PHX_HOST=localhost
	export PORT=4000
	export ECTO_IPV6=false
	echo "Installing prod dependencies..."
	mix deps.get --only prod
	echo "Compiling..."
	mix compile
	echo "Building assets..."
	mix assets.deploy
	echo "Creating/migrating database..."
	mix ecto.create --quiet || true
	mix ecto.migrate
	echo "Starting production server at http://localhost:4000"
	mix phx.server

# Build production release
build-prod:
	MIX_ENV=prod mix do deps.get, assets.deploy, compile, phx.digest

# ============================================================================
# Utility Commands
# ============================================================================

tasks:
	hx ./tasks

test-deploy-prod:
	git pull
	docker compose -f docker-compose.prod.yml build streampai
	docker compose -f docker-compose.prod.yml up

test-stream stream-key:
	ffmpeg -re -loop 1 -i priv/static/lenny.jpg \
		-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
		-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
		-c:v libx264 \
		-preset veryfast \
		-profile:v high \
		-b:v 6000k \
		-minrate 6000k \
		-maxrate 6000k \
		-bufsize 12000k \
		-pix_fmt yuv420p \
		-r 60 \
		-g 60 \
		-c:a aac \
		-b:a 128k \
		-f flv \
		rtmps://live.streampai.com:443/live/{{stream-key}}

proto-gen:
	protoc --proto_path=proto/yt --elixir_out=plugins=grpc:./lib/streampai/youtube/generated stream_list.proto
