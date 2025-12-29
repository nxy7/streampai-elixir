# Find eligible builder and runner images on Docker Hub.
# Using Debian slim for compatibility with native dependencies (picosat_elixir).
#
# https://hub.docker.com/_/elixir/tags
#
# This file is based on these images:
#
#   - https://hub.docker.com/_/elixir/tags - for the build image
#   - https://hub.docker.com/_/debian/tags - for the release image
#
# IMPORTANT: The runner image must use the same Debian version as the builder
# to avoid glibc version mismatches. elixir:1.19.4-otp-28-slim uses Debian trixie.
#
ARG ELIXIR_VERSION=1.19.4
ARG OTP_VERSION=28
ARG DEBIAN_VERSION=trixie-slim

ARG BUILDER_IMAGE="docker.io/elixir:${ELIXIR_VERSION}-otp-${OTP_VERSION}-slim"
ARG RUNNER_IMAGE="docker.io/debian:${DEBIAN_VERSION}"

FROM ${BUILDER_IMAGE} AS builder

# install build dependencies
RUN apt-get update -y && apt-get install -y build-essential git \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

# prepare build dir
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force \
  && mix local.rebar --force

# set build ENV
ENV MIX_ENV="prod"

# install mix dependencies
COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config

# copy compile-time config files before we compile dependencies
# to ensure any relevant config change will trigger the dependencies
# to be re-compiled.
COPY config/config.exs config/${MIX_ENV}.exs config/
RUN mix deps.compile

# Remove duplicate Google.Protobuf modules from protox
# Both protobuf and protox define these modules - we keep protobuf's versions
# This must happen after deps.compile but before app compile
# We need to: 1) remove BEAM files 2) edit .app file to remove module entries
RUN rm -f _build/prod/lib/protox/ebin/'Elixir.Google.Protobuf.'*.beam && \
    sed -i "s/'Elixir.Google.Protobuf.[^']*',//g" _build/prod/lib/protox/ebin/protox.app && \
    echo "Checking .app file for Google.Protobuf modules after edit:" && \
    (cat _build/prod/lib/protox/ebin/protox.app | grep -o "'Elixir.Google.Protobuf[^']*'" | head -5 || echo "None found - success!")

COPY priv priv
COPY lib lib

# Compile the release
RUN mix compile

# Changes to config/runtime.exs don't require recompiling the code
COPY config/runtime.exs config/

COPY rel rel
RUN mix release

# start a new build stage so that the final image will only contain
# the compiled release and other runtime necessities
FROM ${RUNNER_IMAGE} AS final

RUN apt-get update -y && apt-get install -y libstdc++6 openssl libncurses6 ca-certificates \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Set the locale
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

WORKDIR "/app"
RUN chown nobody /app

# set runner ENV
ENV MIX_ENV="prod"

# Only copy the final release from the build stage
COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/streampai ./

USER nobody

# If using an environment that doesn't automatically reap zombie processes, it is
# advised to add an init process such as tini via `apt-get install`
# above and adding an entrypoint. See https://github.com/krallin/tini for details
# ENTRYPOINT ["/tini", "--"]

CMD ["/app/bin/server"]
