alias id := init-dev
alias es := elixir-start
alias si := start-interactive

_default:
  @just --unstable --list

# starts development cluster and applies kubernetes manifests
init-dev:
	code .
	docker compose up

elixir-start:
	cd backend; mix phx.server
	
start-interactive:
	cd backend; iex -S mix phx.server

tasks:
	hx ./tasks
