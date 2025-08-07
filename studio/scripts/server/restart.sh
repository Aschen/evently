#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

echo "Stopping evently Studio..."
bash "$SCRIPT_DIR/stop.sh"

echo "Starting evently Studio..."
bash "$SCRIPT_DIR/start.sh" "$@"
