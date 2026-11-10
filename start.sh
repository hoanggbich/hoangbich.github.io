#!/usr/bin/env sh
cd "$(dirname "$0")"
echo "Starting local server at http://localhost:8000  (Ctrl+C to stop)"
( sleep 1; (xdg-open http://localhost:8000 || open http://localhost:8000) >/dev/null 2>&1 ) &
python3 -m http.server 8000 || python -m http.server 8000
