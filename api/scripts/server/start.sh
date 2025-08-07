#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/../.."

PID_FILE="$SCRIPT_DIR/server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"

POSTGRES_PORT=5432

# Kill existing server if running
if [ -f "$PID_FILE" ]; then
    EXISTING_PID=$(sed -n '2p' "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$EXISTING_PID" ] && kill -0 "$EXISTING_PID" 2>/dev/null; then
        EXISTING_MODE=$(sed -n '1p' "$PID_FILE" 2>/dev/null || echo "unknown")
        echo "Stopping existing server with PID $EXISTING_PID (Mode: $EXISTING_MODE)"
        kill "$EXISTING_PID" 2>/dev/null || true
        sleep 2
    fi
    rm "$PID_FILE"
fi

# Clear previous log
> "$LOG_FILE"

echo "Starting server..."

# Start the server with proper error handling
nohup env POSTGRES_PORT=$POSTGRES_PORT NODE_ENV=${NODE_ENV:-development} node -r tsconfig-paths/register -r ts-node/register/transpile-only "$SCRIPT_DIR/../../src/main.ts" > "$LOG_FILE" 2>&1 &

# Save PID with mode information
SERVER_PID=$!
echo "dev" > "$PID_FILE"
echo $SERVER_PID >> "$PID_FILE"

# Wait a moment and check if the process is still running
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    cat "$LOG_FILE"
    echo "✅ Server started successfully with PID $SERVER_PID"
    echo "📁 Logs: $LOG_FILE"
    echo "🔍 Use 'yarn server:log to see the log file"
else
    echo "❌ Failed to start server"
    echo "📋 Check logs for details: $LOG_FILE"
    if [ -s "$LOG_FILE" ]; then
        echo "Last few lines from log:"
        tail -30 "$LOG_FILE"
    fi
    rm -f "$PID_FILE"
    exit 1
fi
