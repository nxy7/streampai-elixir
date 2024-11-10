_default:
  @just --unstable --list

# starts development cluster and applies kubernetes manifests
init-dev:
	code .
	docker compose up

format:
	cd backend; mix format;

test:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
	cd backend
	mix test --max-failures 3 --exclude external

start:
	cd backend; mix start
	
si:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
	cd backend
	iex -S mix phx.server

# Setup and run in production mode locally (for benchmarking)
prod:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
	cd backend
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
	cd backend; MIX_ENV=prod mix do deps.get, assets.deploy, compile, phx.digest

tasks:
	hx ./tasks

test-deploy-prod:
	git pull
	docker compose -f docker-compose.prod.yml build streampai
	docker compose -f docker-compose.prod.yml up
