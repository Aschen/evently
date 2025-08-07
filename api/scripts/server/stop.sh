#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
PID_FILE="$SCRIPT_DIR/server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(sed -n '2p' "$PID_FILE")
    if [ -n "$PID" ] && kill "$PID" 2>/dev/null; then
        echo "Server stopped (PID: $PID)"
    else
        echo "Process $PID not found or already stopped"
    fi
    rm "$PID_FILE"
else
    echo "No PID file found - server may not be running"
fi
