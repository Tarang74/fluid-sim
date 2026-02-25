# Build stage
FROM rust:bookworm AS build

WORKDIR /app
COPY libs/sim-core libs/sim-core
COPY websocket websocket

WORKDIR /app/websocket
RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/websocket/target/release/websocket websocket

CMD ["./websocket"]

