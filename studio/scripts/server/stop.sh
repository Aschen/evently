#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
PID_FILE="$SCRIPT_DIR/server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill "$PID" 2>/dev/null; then
        echo "evently Studio stopped (PID: $PID)"
    else
        echo "Process $PID not found or already stopped"
    fi
    rm "$PID_FILE"
else
    echo "No PID file found - evently Studio may not be running"
fi
