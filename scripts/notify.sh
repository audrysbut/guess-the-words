#!/usr/bin/env bash
TITLE="${1:-WordWeave}"
BODY="${2:-Done}"
ICON="${3:-terminal}"
SOUND="${4:-/usr/share/sounds/Pop/stereo/notification/message.oga}"

if command -v paplay &>/dev/null && [ -f "$SOUND" ]; then
  paplay "$SOUND" &
fi

if command -v notify-send &>/dev/null; then
  notify-send "$TITLE" "$BODY" -i "$ICON"
fi
