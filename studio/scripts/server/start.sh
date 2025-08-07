#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/../.."

PID_FILE="$SCRIPT_DIR/server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"

# Parse arguments
MODE_TEXT="standard mode"

# Kill existing server if running
if [ -f "$PID_FILE" ]; then
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Stopping existing server with PID $(cat "$PID_FILE")"
        kill $(cat "$PID_FILE") 2>/dev/null || true
        sleep 2
    fi
    rm "$PID_FILE"
fi

# Clear previous log
> "$LOG_FILE"

echo "Starting evently Studio in $MODE_TEXT..."

# Start the server with proper error handling
nohup yarn start > "$LOG_FILE" 2>&1 &

# Save PID
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

# Wait a moment and check if the process is still running
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ evently Studio started successfully with PID $SERVER_PID in $MODE_TEXT"
    echo "📁 Logs: $LOG_FILE"
    echo "🔍 Use 'yarn server:log to see the log file"
    echo "🌐 Server should be available at http://localhost:4200"
else
    echo "❌ Failed to start evently Studio"
    echo "📋 Check logs for details: $LOG_FILE"
    rm -f "$PID_FILE"
fi

# Show recent logs before exiting
echo ""
echo "📋 Recent server logs:"
echo "========================"
if [ -s "$LOG_FILE" ]; then
    tail -30 "$LOG_FILE"
else
    echo "No logs available yet"
fi

# Exit with appropriate code
if kill -0 $SERVER_PID 2>/dev/null; then
    exit 0
else
    exit 1
fi
