_default:
  @just --unstable --list

# starts development cluster and applies kubernetes manifests
init-dev:
	code .
	docker compose up

test:
	cd backend; mix test

start:
	cd backend; mix start
	
si:
	#!/usr/bin/env bash
	set -euo pipefail
	export $(grep -v '^#' .env | grep -v '^$' | xargs)
	cd backend
	iex -S mix phx.server

# Build and run in production mode
prod:
	cd backend; MIX_ENV=prod mix do assets.deploy, compile
	cd backend; ECTO_IPV6=false DATABASE_URL=ecto://postgres:postgres@localhost/postgres SECRET_KEY_BASE=$(mix phx.gen.secret) GOOGLE_CLIENT_ID=dummy GOOGLE_CLIENT_SECRET=dummy GOOGLE_REDIRECT_URI=http://localhost:4000 TWITCH_CLIENT_ID=dummy TWITCH_CLIENT_SECRET=dummy PHX_HOST=localhost PORT=4000 MIX_ENV=prod mix phx.server

# Build production release
build-prod:
	cd backend; MIX_ENV=prod mix do deps.get, assets.deploy, compile, phx.digest

tasks:
	hx ./tasks

test-deploy-prod:
	git pull
	docker compose -f docker-compose.prod.yml build streampai
	docker compose -f docker-compose.prod.yml up
