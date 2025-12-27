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

	# Load environment variables (using set -a to auto-export)
	set -a
	source <(grep -v '^#' .env | grep -v '^$')
	set +a

	# Get ports from environment or use defaults
	PHOENIX_PORT=${PORT:-4000}
	FRONTEND_PORT=${FRONTEND_PORT:-3000}
	CADDY_PORT=${CADDY_PORT:-8000}
	HMR_PORT=${HMR_PORT:-24678}

	echo "🚀 Starting Streampai development environment"
	echo "   Phoenix:  http://localhost:$PHOENIX_PORT"
	echo "   Frontend: http://localhost:$FRONTEND_PORT"
	echo "   Caddy:    https://localhost:$CADDY_PORT"
	echo ""
	echo "📱 Access the app at: https://localhost:$CADDY_PORT"
	echo ""

	# Check if caddy is installed
	if ! command -v caddy &> /dev/null; then
		echo "❌ Caddy is not installed. Please install it:"
		echo "   brew install caddy"
		echo "   caddy trust  # Install local CA certificates"
		exit 1
	fi

	# Ensure dependencies are installed
	echo "📦 Checking dependencies..."
	mix deps.get --check-unused 2>/dev/null || mix deps.get
	cd frontend && bun install --frozen-lockfile 2>/dev/null || bun install
	cd ..

	# Start all services in parallel
	trap 'kill $(jobs -p) 2>/dev/null' EXIT

	# Start Phoenix (PORT is already set from .env, sname includes port for uniqueness)
	elixir -S mix phx.server &

	# Start Frontend (override PORT for Vinxi, which reads it for dev server)
	cd frontend && PORT=$FRONTEND_PORT bun dev &

	# Wait a bit for services to start
	sleep 2

	# Start Caddy (reads PHOENIX_PORT, FRONTEND_PORT, CADDY_PORT from env)
	caddy run --config Caddyfile

	wait

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

	# Generate random available ports
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

	PHOENIX_PORT=$(find_port 4100 4999)
	FRONTEND_PORT=$(find_port 3100 3999)
	CADDY_PORT=$(find_port 8100 8999)
	# HMR ports for each Vinxi router
	FRONTEND_HMR_CLIENT_PORT=$(find_port 3100 3999)
	FRONTEND_HMR_SERVER_PORT=$(find_port 3100 3999)
	FRONTEND_HMR_SERVER_FUNCTION_PORT=$(find_port 3100 3999)
	FRONTEND_HMR_SSR_PORT=$(find_port 3100 3999)

	DB_NAME="streampai_$(echo "$name" | tr '-' '_')_dev"
	DB_URL="postgresql://postgres:postgres@localhost:5432/$DB_NAME?sslmode=disable"
	PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists"

	# Add MCP server for this worktree
	claude mcp add --transport http tidewave "http://localhost:$PHOENIX_PORT/tidewave/mcp" 2>/dev/null || true

	# Copy .env from main repo if not already present (vibe-kanban may have copied it)
	if [ ! -f .env ]; then
		cp ~/streampai-elixir/.env .
	fi

	# Always copy the latest justfile from main repo to ensure worktree has latest setup scripts
	cp ~/streampai-elixir/justfile . 2>/dev/null || true

	# Copy compiled artifacts for faster setup
	cp -r ~/streampai-elixir/deps . 2>/dev/null || true
	cp -r ~/streampai-elixir/_build . 2>/dev/null || true

	# Remove any existing worktree-specific variables before appending new ones
	# This prevents duplicates if worktree-setup is run multiple times
	# Use grep to filter out lines instead of sed -i (avoids BSD vs GNU sed issues)
	grep -v '^DATABASE_URL=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^CADDY_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_CLIENT_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_SERVER_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_SERVER_FUNCTION_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^FRONTEND_HMR_SSR_PORT=' .env > .env.tmp && mv .env.tmp .env || true
	grep -v '^DISABLE_LIVE_DEBUGGER=' .env > .env.tmp && mv .env.tmp .env || true

	# Append worktree-specific configuration
	echo "" >> .env
	echo "# Worktree-specific configuration (auto-generated by just worktree-setup)" >> .env
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
	echo "   Phoenix:  http://localhost:$PHOENIX_PORT"
	echo "   Frontend: http://localhost:$FRONTEND_PORT"
	echo "   Caddy:    https://localhost:$CADDY_PORT"
	echo ""

	# Export environment variables for subsequent commands
	export $(grep -v '^#' .env | grep -v '^$' | xargs)

	# Install backend dependencies
	mix deps.get

	# Create database and run migrations/seeds
	mix ecto.create 2>/dev/null || echo "Database $DB_NAME already exists"
	mix ash.setup

	# Compile to verify everything works
	mix compile

	# Install frontend dependencies
	echo "Installing frontend dependencies..."
	cd frontend && bun install

	# Pre-register this folder as trusted in Claude Code to avoid "Do you trust the files?" prompt
	# This adds an entry to ~/.claude.json with hasTrustDialogAccepted: true
	worktree_path=$(pwd)
	if [ -f ~/.claude.json ]; then
		if command -v jq &> /dev/null; then
			echo "🔐 Registering worktree as trusted in Claude Code..."
			tmp_file=$(mktemp)
			jq --arg path "$worktree_path" '.projects[$path] = (.projects[$path] // {}) + {
				"allowedTools": (.projects[$path].allowedTools // []),
				"hasTrustDialogAccepted": true
			}' ~/.claude.json > "$tmp_file" && mv "$tmp_file" ~/.claude.json
			echo "   ✅ Folder trusted: $worktree_path"
		else
			echo "⚠️  jq not installed - Claude Code will prompt for trust on first run"
			echo "   Install jq: brew install jq"
		fi
	fi

	# Pre-register this folder as trusted in VS Code to avoid "Do you trust the authors?" prompt
	# VS Code stores trusted folders in a SQLite database; we add the worktrees parent folder
	# so all worktrees are automatically trusted (trust is inherited by subdirectories)
	vscode_state_db="$HOME/Library/Application Support/Code/User/globalStorage/state.vscdb"
	if [ -f "$vscode_state_db" ]; then
		if command -v sqlite3 &> /dev/null; then
			# Get the worktrees parent directory (e.g., /path/to/vibe-kanban/worktrees)
			worktrees_parent=$(dirname "$(dirname "$worktree_path")")

			# Check if this parent is already trusted
			existing=$(sqlite3 "$vscode_state_db" "SELECT value FROM ItemTable WHERE key = 'security.workspace.trust.untrustedFolders'" 2>/dev/null || echo "")

			if [ -n "$existing" ] && echo "$existing" | grep -q "$worktrees_parent"; then
				echo "🔐 VS Code: Worktrees folder already trusted"
			else
				echo "🔐 Registering worktrees folder as trusted in VS Code..."
				# Get current trusted folders and add the new one
				current_trusted=$(sqlite3 "$vscode_state_db" "SELECT value FROM ItemTable WHERE key = 'security.workspace.trust.trustedFolders'" 2>/dev/null || echo "[]")
				if [ -z "$current_trusted" ] || [ "$current_trusted" = "" ]; then
					current_trusted="[]"
				fi
				# Add the worktrees parent folder to trusted list using jq
				new_trusted=$(echo "$current_trusted" | jq --arg path "$worktrees_parent" '. + [$path] | unique')
				sqlite3 "$vscode_state_db" "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('security.workspace.trust.trustedFolders', '$new_trusted')" 2>/dev/null && \
					echo "   ✅ VS Code: Trusted folder added: $worktrees_parent" || \
					echo "   ⚠️  VS Code: Could not update trusted folders (VS Code may be running)"
			fi
		else
			echo "⚠️  sqlite3 not installed - VS Code will prompt for trust on first run"
		fi
	else
		echo "ℹ️  VS Code not detected - skipping VS Code trust setup"
	fi

	echo ""
	echo "✅ Worktree '$name' is ready!"
	echo "   Run 'just dev' to start with Caddy (recommended)"
	echo "   Run 'just si' to start without Caddy"

# Show port configuration for current worktree
ports:
	#!/usr/bin/env bash
	set -a
	source <(grep -v '^#' .env | grep -v '^$') 2>/dev/null || true
	set +a
	echo "Port configuration:"
	echo "   Phoenix:  ${PORT:-4000}"
	echo "   Frontend: ${FRONTEND_PORT:-3000}"
	echo "   Caddy:    ${CADDY_PORT:-8000}"
	echo "   HMR:      ${HMR_PORT:-24678}"

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
