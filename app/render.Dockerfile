# Build stage
FROM rust:bookworm AS build

WORKDIR /app
COPY libs/sim-core libs/sim-core
COPY render render

WORKDIR /app/render
RUN cargo build --release

# Production stage
FROM debian:bookworm

ARG BLENDER_VERSION=4.5.2
ARG BLENDER_MM=4.5

ENV DEBIAN_FRONTEND=noninteractive
# Force software GL to avoid GPU/display requirements
ENV LIBGL_ALWAYS_SOFTWARE=1
ENV MESA_GL_VERSION_OVERRIDE=4.5
ENV MESA_GLSL_VERSION_OVERRIDE=450

# Base deps + FFmpeg + Mesa + Xvfb + curl/xz for tarball install
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils \
      ffmpeg xvfb \
      libgl1 libgl1-mesa-dri libegl1 libgbm1 \
      libx11-6 libxi6 libxrender1 libxext6 libxfixes3 libxxf86vm1 \
      fonts-dejavu-core; \
    rm -rf /var/lib/apt/lists/*

# Download & verify official Blender tarball, install to /opt/blender/<version>
RUN set -eux; \
    cd /tmp; \
    curl -fsSLO "https://download.blender.org/release/Blender${BLENDER_MM}/blender-${BLENDER_VERSION}-linux-x64.tar.xz"; \
    curl -fsSLO "https://download.blender.org/release/Blender${BLENDER_MM}/blender-${BLENDER_VERSION}.sha256"; \
    grep "blender-${BLENDER_VERSION}-linux-x64.tar.xz" "blender-${BLENDER_VERSION}.sha256" | sha256sum -c -; \
    mkdir -p /opt/blender/${BLENDER_VERSION}; \
    tar -xJf "blender-${BLENDER_VERSION}-linux-x64.tar.xz" \
      -C /opt/blender/${BLENDER_VERSION} --strip-components=1; \
    ln -s /opt/blender/${BLENDER_VERSION}/blender /opt/blender/blender; \
    ln -s /opt/blender/blender /usr/bin/blender;

# Optional wrapper: safer headless invocation via virtual X screen
RUN printf '%s\n' \
      '#!/usr/bin/env bash' \
      'set -euo pipefail' \
      'exec xvfb-run -a -s "-screen 0 1280x720x24" blender "$@"' \
    > /usr/local/bin/blender-headless && \
    chmod +x /usr/local/bin/blender-headless

WORKDIR /app
COPY --from=build /app/render/target/release/render render
COPY --from=build /app/render/render.py render.py

CMD ["./render"]

