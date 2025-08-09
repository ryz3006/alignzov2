#!/usr/bin/env bash
# Alignzo process manager

# Ensure bash even if invoked with sh
if [ -z "${BASH_VERSION:-}" ]; then exec bash "$0" "$@"; fi

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<EOF
Usage: $0 {start|stop|restart|status} [--dev|--prod] [--nohup|--background] [--hard-kill]

Options:
  --dev           Run in development mode (backend: nest --watch, frontend: next dev)
  --prod          Run in production mode (backend: node dist, frontend: next start)
  --nohup         Run with nohup, logs to nohup.out in project root
  --background    Run in background with logs suppressed (redirect to /dev/null)
  --hard-kill     Stop: kill all node processes (be careful)

Examples:
  $0 start --dev --nohup
  $0 stop --hard-kill
  $0 restart --prod --background
EOF
}

MODE="dev"
LAUNCH="foreground"
HARD_KILL="no"
ACTION=""

for arg in "$@"; do
  case "$arg" in
    start|stop|restart|status) ACTION="$arg" ;;
    --dev) MODE="dev" ;;
    --prod) MODE="prod" ;;
    --nohup) LAUNCH="nohup" ;;
    --background) LAUNCH="background" ;;
    --hard-kill) HARD_KILL="yes" ;;
    -h|--help) usage; exit 0 ;;
    *) ;;
  esac
done

if [[ -z "$ACTION" ]]; then usage; exit 1; fi

CFG_BACKEND="$ROOT_DIR/backend/config/config.json"
CFG_FRONTEND="$ROOT_DIR/frontend/config/config.json"

get_from_cfg() {
  local file="$1"; shift
  local expr="$1"; shift
  if [[ -f "$file" ]]; then
    node -e '
      const fs=require("fs");
      const file=process.argv[1];
      const expr=process.argv[2];
      const c=JSON.parse(fs.readFileSync(file,"utf8"));
      const v=expr.split(".").reduce((a,k)=>a&&a[k], c);
      if(v!=null) process.stdout.write(String(v));
    ' "$file" "$expr"
  fi
}

get_backend_port() { get_from_cfg "$CFG_BACKEND" "ports.backend"; }
get_frontend_port() { get_from_cfg "$CFG_FRONTEND" "port"; }
get_api_url() { get_from_cfg "$CFG_FRONTEND" "apiUrl"; }

BACKEND_PORT="$(get_backend_port || true)"
FRONTEND_PORT="$(get_frontend_port || true)"
API_URL="$(get_api_url || true)"

# Sanitize values: if empty or non-numeric for ports, fallback
if ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]]; then BACKEND_PORT=""; fi
if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]]; then FRONTEND_PORT=""; fi

# Defaults if not set
: "${BACKEND_PORT:=3001}"
: "${FRONTEND_PORT:=3000}"
: "${API_URL:=http://localhost:${BACKEND_PORT}}"

# Do not export PORT globally; pass per-process to avoid leaking to frontend
export NEXT_PUBLIC_API_URL="$API_URL"

# Compose commands
BACKEND_CMD_DEV=(bash -lc "cd backend && PORT=$BACKEND_PORT NODE_ENV=development npm run dev")
FRONTEND_CMD_DEV=(bash -lc "cd frontend && PORT=$FRONTEND_PORT NODE_ENV=development NEXT_PUBLIC_API_URL='$API_URL' npm run dev")
BACKEND_CMD_PROD=(bash -lc "cd backend && PORT=$BACKEND_PORT NODE_ENV=production npm run start:prod")
FRONTEND_CMD_PROD=(bash -lc "cd frontend && PORT=$FRONTEND_PORT NODE_ENV=production NEXT_PUBLIC_API_URL='$API_URL' npm run start")

start_procs() {
  local log_target="/dev/stdout"
  case "$LAUNCH" in
    nohup)
      log_target="$ROOT_DIR/nohup.out"
      : > "$log_target"
      ;;
    background)
      log_target="/dev/null"
      ;;
  esac

  echo "Config: backend_port=$BACKEND_PORT frontend_port=$FRONTEND_PORT api_url=$API_URL mode=$MODE launch=$LAUNCH"
  if [[ "$MODE" == "dev" ]]; then
    echo "Starting Backend (DEV) on :$BACKEND_PORT" 
    echo "Starting Frontend (DEV) on :$FRONTEND_PORT"
    if [[ "$LAUNCH" == "nohup" ]]; then
      nohup "${BACKEND_CMD_DEV[@]}" >> "$log_target" 2>&1 & echo $! > "$ROOT_DIR/.backend.pid"
      nohup "${FRONTEND_CMD_DEV[@]}" >> "$log_target" 2>&1 & echo $! > "$ROOT_DIR/.frontend.pid"
    elif [[ "$LAUNCH" == "background" ]]; then
      "${BACKEND_CMD_DEV[@]}" > /dev/null 2>&1 & echo $! > "$ROOT_DIR/.backend.pid"
      "${FRONTEND_CMD_DEV[@]}" > /dev/null 2>&1 & echo $! > "$ROOT_DIR/.frontend.pid"
    else
      "${BACKEND_CMD_DEV[@]}" & echo $! > "$ROOT_DIR/.backend.pid"
      "${FRONTEND_CMD_DEV[@]}" & echo $! > "$ROOT_DIR/.frontend.pid"
      echo "Backend on port $BACKEND_PORT, Frontend on port $FRONTEND_PORT"
      wait
    fi
  else
    echo "Starting Backend (PROD) on :$BACKEND_PORT" 
    echo "Starting Frontend (PROD) on :$FRONTEND_PORT"
    if [[ "$LAUNCH" == "nohup" ]]; then
      nohup "${BACKEND_CMD_PROD[@]}" >> "$log_target" 2>&1 & echo $! > "$ROOT_DIR/.backend.pid"
      nohup "${FRONTEND_CMD_PROD[@]}" >> "$log_target" 2>&1 & echo $! > "$ROOT_DIR/.frontend.pid"
    elif [[ "$LAUNCH" == "background" ]]; then
      "${BACKEND_CMD_PROD[@]}" > /dev/null 2>&1 & echo $! > "$ROOT_DIR/.backend.pid"
      "${FRONTEND_CMD_PROD[@]}" > /dev/null 2>&1 & echo $! > "$ROOT_DIR/.frontend.pid"
    else
      "${BACKEND_CMD_PROD[@]}" & echo $! > "$ROOT_DIR/.backend.pid"
      "${FRONTEND_CMD_PROD[@]}" & echo $! > "$ROOT_DIR/.frontend.pid"
      echo "Backend on port $BACKEND_PORT, Frontend on port $FRONTEND_PORT"
      wait
    fi
  fi
}

kill_pidfile() {
  local file="$1"
  if [[ -f "$file" ]]; then
    local pid; pid="$(cat "$file" || true)"
    if [[ -n "$pid" && -e "/proc/$pid" ]]; then kill "$pid" || true; fi
    rm -f "$file"
  fi
}

stop_procs() {
  if [[ "$HARD_KILL" == "yes" ]]; then
    echo "Hard killing all node processes..."
    pkill -9 node || true
    rm -f "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid"
    return
  fi
  kill_pidfile "$ROOT_DIR/.backend.pid"
  kill_pidfile "$ROOT_DIR/.frontend.pid"
}

status_procs() {
  for f in "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid"; do
    if [[ -f "$f" ]]; then
      pid="$(cat "$f")"
      if [[ -n "$pid" && -e "/proc/$pid" ]]; then
        echo "$(basename "$f"): running (pid $pid)"
      else
        echo "$(basename "$f"): not running"
      fi
    else
      echo "$(basename "$f"): not running"
    fi
  done
}

case "$ACTION" in
  start) start_procs ;;
  stop) stop_procs ;;
  restart) stop_procs; sleep 1; start_procs ;;
  status) status_procs ;;
  *) usage; exit 1 ;;
 esac


