#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

echo "Stopping server..."
bash "$SCRIPT_DIR/stop.sh"

echo "Starting server..."
bash "$SCRIPT_DIR/start.sh" "$@"
