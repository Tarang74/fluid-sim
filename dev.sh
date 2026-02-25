#!/bin/bash

set -e

# aws sso login

WINDOW_NAME="dev-services"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if we're inside tmux
if [ -z "$TMUX" ]; then
    echo "❌ Not inside a tmux session. Please run this from within tmux."
    exit 1
fi

# Get current session name
CURRENT_SESSION=$(tmux display-message -p '#S')
echo "Current tmux session: $CURRENT_SESSION"

# Create new window in current session
tmux new-window -n $WINDOW_NAME

# Split into 6 panes (2 columns, 3 rows)
# First split vertically (left/right)
tmux split-window -h

# Split left side into 3 panes (top/middle/bottom)
tmux select-pane -t 0
tmux split-window -v
tmux split-window -v

# Split right side into 3 panes (top/middle/bottom)
tmux select-pane -t 3
tmux split-window -v
tmux split-window -v

# Balance the panes
tmux select-layout tiled

# Pane 0: Web service (./app/web)
tmux send-keys -t 0 "cd app/web && set -a && source ../../local.env && set +a && npm run dev" C-m

# Pane 1: API service (./app/api)
tmux send-keys -t 1 "cd app/api && set -a && source ../../local.env && set +a && npm run dev" C-m

# Pane 2: WebSocket service (./app/websocket)
tmux send-keys -t 2 "cd app/websocket && set -a && source ../../local.env && set +a && cargo run" C-m

# Pane 3: Render service (./app/render)
tmux send-keys -t 3 "cd app/render && set -a && source ../../local.env && set +a && cargo run" C-m

# Pane 4: Redis
tmux send-keys -t 4 "docker compose --env-file local.env up redis" C-m

# Pane 5: Postgres
tmux send-keys -t 5 "docker compose --env-file local.env up postgres" C-m
