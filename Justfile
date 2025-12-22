_default:
  @just --unstable --list

init-dev:
	docker compose up

format:
	mix format;

test:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
	mix test --max-failures 3 --exclude external

start:
	mix start
	
si:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
	iex -S mix phx.server

# Setup and run in production mode locally (for benchmarking)
prod:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
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

# Create a new git worktree with environment configuration
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
	name=$(pwd | awk -F/ '{print $NF}')

	echo "Setting up worktree: $name"
	
	PORT=$(($(random) % 3000 + 4000))
	DB_NAME="streampai_$(echo "$name" | tr '-' '_')_dev"
	DB_URL="postgresql://postgres:postgres@localhost:5432/$DB_NAME?sslmode=disable"
	PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE $DB_NAME;" || echo "Database $DB_NAME already exists"
	claude mcp add --transport http tidewave http://localhost:$PORT/tidewave/mcp || echo "MCP already exists"

	cp ~/streampai-elixir/.env .
	# copy compiled artifacts for faster startup
	cp -r ~/streampai-elixir/deps .
	cp -r ~/streampai-elixir/_build .
	# Append worktree-specific configuration to .env before setup
	echo "" >> .env
	echo "# Worktree-specific configuration for: $name" >> .env
	echo "DATABASE_URL=$DB_URL" >> .env
	echo "PORT=$PORT" >> .env
	echo "DISABLE_LIVE_DEBUGGER=true" >> .env

	mix deps.get
	mix assets.setup
	mix assets.build

	# Export environment variables and run setup
	export $(grep -v '^#' .env | grep -v '^$' | xargs)

	# Create the database first (ecto.create connects to postgres db to create target db)
	mix ecto.create || echo "Database $DB_NAME already exists"

	# Then run ash.setup for migrations and seeds
	mix ash.setup
	mix compile
	claude --dangerously-skip-permissions .

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
