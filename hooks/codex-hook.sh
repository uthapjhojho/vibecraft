#!/bin/bash
# Vibecraft Codex Hook - Captures OpenAI Codex events for 3D visualization
#
# This script is called by Codex's notify system and:
# 1. Receives JSON notification as CLI argument (not stdin like Claude)
# 2. Transforms it into our event format
# 3. Appends to the events JSONL file
# 4. Optionally notifies the WebSocket server
#
# Installed to: ~/.vibecraft/hooks/codex-hook.sh
# Run `npx vibecraft setup` to install/update this hook.
#
# Codex notification JSON format:
# {
#   "type": "agent-turn-complete",
#   "thread-id": "...",
#   "turn-id": "...",
#   "cwd": "...",
#   "input-messages": [...],
#   "last-assistant-message": "..."
# }

set -e

# =============================================================================
# Cross-Platform PATH Setup
# =============================================================================

KNOWN_PATHS=(
  "/opt/homebrew/bin"
  "/usr/local/bin"
  "$HOME/.local/bin"
  "/usr/bin"
  "/bin"
)

for dir in "${KNOWN_PATHS[@]}"; do
  [ -d "$dir" ] && export PATH="$dir:$PATH"
done

# =============================================================================
# Tool Discovery
# =============================================================================

find_tool() {
  local name="$1"
  local found=$(command -v "$name" 2>/dev/null)
  if [ -n "$found" ]; then
    echo "$found"
    return 0
  fi
  for dir in "${KNOWN_PATHS[@]}"; do
    if [ -x "$dir/$name" ]; then
      echo "$dir/$name"
      return 0
    fi
  done
  return 1
}

JQ=$(find_tool "jq") || {
  echo "vibecraft-codex-hook: ERROR - jq not found" >&2
  exit 1
}

CURL=$(find_tool "curl") || {
  CURL=""
}

# =============================================================================
# Configuration
# =============================================================================

VIBECRAFT_DATA_DIR="${VIBECRAFT_DATA_DIR:-$HOME/.vibecraft/data}"
EVENTS_FILE="${VIBECRAFT_EVENTS_FILE:-$VIBECRAFT_DATA_DIR/events.jsonl}"
WS_NOTIFY_URL="${VIBECRAFT_WS_NOTIFY:-http://localhost:4003/event}"
ENABLE_WS_NOTIFY="${VIBECRAFT_ENABLE_WS_NOTIFY:-true}"

mkdir -p "$(dirname "$EVENTS_FILE")"

# =============================================================================
# Read Input (Codex passes JSON as CLI argument, not stdin)
# =============================================================================

if [ -z "$1" ]; then
  echo "vibecraft-codex-hook: ERROR - No JSON argument provided" >&2
  exit 1
fi

input="$1"

# =============================================================================
# Parse Codex Notification
# =============================================================================

codex_type=$(echo "$input" | "$JQ" -r '.type // "unknown"')
thread_id=$(echo "$input" | "$JQ" -r '.["thread-id"] // "unknown"')
turn_id=$(echo "$input" | "$JQ" -r '.["turn-id"] // ""')
cwd=$(echo "$input" | "$JQ" -r '.cwd // ""')
last_message=$(echo "$input" | "$JQ" -r '.["last-assistant-message"] // ""')

# Generate unique event ID and timestamp
if [[ "$OSTYPE" == "darwin"* ]]; then
  if command -v perl &> /dev/null; then
    timestamp=$(perl -MTime::HiRes=time -e 'printf "%.0f", time * 1000')
  elif command -v python3 &> /dev/null; then
    timestamp=$(python3 -c 'import time; print(int(time.time() * 1000))')
  else
    timestamp=$(($(date +%s) * 1000 + RANDOM % 1000))
  fi
  event_id="codex-${thread_id}-${timestamp}-${RANDOM}"
else
  ms_part=$(date +%N | cut -c1-3)
  timestamp=$(($(date +%s) * 1000 + 10#$ms_part))
  event_id="codex-${thread_id}-$(date +%s%N)"
fi

# =============================================================================
# Map Codex Event Type to Vibecraft Event Type
# =============================================================================

case "$codex_type" in
  agent-turn-complete)
    event_type="agent_turn_complete"
    ;;
  approval-requested)
    event_type="approval_requested"
    ;;
  *)
    event_type="codex_$codex_type"
    ;;
esac

# =============================================================================
# Build Event JSON
# =============================================================================

case "$event_type" in
  agent_turn_complete)
    event=$("$JQ" -n -c \
      --arg id "$event_id" \
      --argjson timestamp "$timestamp" \
      --arg type "$event_type" \
      --arg agentType "codex" \
      --arg sessionId "$thread_id" \
      --arg cwd "$cwd" \
      --arg turnId "$turn_id" \
      --arg message "$last_message" \
      '{
        id: $id,
        timestamp: $timestamp,
        type: $type,
        agentType: $agentType,
        sessionId: $sessionId,
        cwd: $cwd,
        turnId: $turnId,
        message: $message
      }')
    ;;

  approval_requested)
    event=$("$JQ" -n -c \
      --arg id "$event_id" \
      --argjson timestamp "$timestamp" \
      --arg type "$event_type" \
      --arg agentType "codex" \
      --arg sessionId "$thread_id" \
      --arg cwd "$cwd" \
      --argjson raw "$input" \
      '{
        id: $id,
        timestamp: $timestamp,
        type: $type,
        agentType: $agentType,
        sessionId: $sessionId,
        cwd: $cwd,
        raw: $raw
      }')
    ;;

  *)
    # Unknown event - store raw input
    event=$("$JQ" -n -c \
      --arg id "$event_id" \
      --argjson timestamp "$timestamp" \
      --arg type "$event_type" \
      --arg agentType "codex" \
      --arg sessionId "$thread_id" \
      --arg cwd "$cwd" \
      --argjson raw "$input" \
      '{
        id: $id,
        timestamp: $timestamp,
        type: $type,
        agentType: $agentType,
        sessionId: $sessionId,
        cwd: $cwd,
        raw: $raw
      }')
    ;;
esac

# =============================================================================
# Output Event
# =============================================================================

echo "$event" >> "$EVENTS_FILE"

# Notify WebSocket server
if [ "$ENABLE_WS_NOTIFY" = "true" ] && [ -n "$CURL" ]; then
  "$CURL" -s -X POST "$WS_NOTIFY_URL" \
    -H "Content-Type: application/json" \
    -d "$event" \
    --connect-timeout 1 \
    --max-time 2 \
    >/dev/null 2>&1 &
fi

exit 0
