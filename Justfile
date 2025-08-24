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
	
start-interactive:
	cd backend; iex -S mix phx.server

tasks:
	hx ./tasks
