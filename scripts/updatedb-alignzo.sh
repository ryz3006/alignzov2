#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

get_database_url() {
  local cfg="$ROOT_DIR/backend/config/config.json"
  if [[ -f "$cfg" ]]; then
    node -e '
      const fs=require("fs");
      const p=process.argv[1];
      const c=JSON.parse(fs.readFileSync(p,"utf8"));
      const b=c.database||(c.backend&&c.backend.database)||{};
      let url=b.url&&b.url.trim();
      if(!url){
        const user=(b.username||"postgres").toString();
        const pass=b.password? encodeURIComponent(b.password.toString()) : "";
        const host=(b.host||"localhost").toString();
        const port=(b.port||5432).toString();
        const name=(b.name||"postgres").toString();
        const auth = pass? `${user}:${pass}` : user;
        url = `postgresql://${auth}@${host}:${port}/${name}`;
      }
      process.stdout.write(url);
    ' "$cfg"
    return
  fi
  if [[ -f "$ROOT_DIR/backend/.env" ]]; then
    awk -F= '/^[[:space:]]*DATABASE_URL[[:space:]]*=/{print $2}' "$ROOT_DIR/backend/.env" | sed 's/^"\(.*\)"$/\1/'
    return
  fi
  echo ""
}

ensure_extensions() {
  local db_url="$1"
  if command -v psql >/dev/null 2>&1; then
    psql --dbname "$db_url" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' || true
    psql --dbname "$db_url" -c 'CREATE EXTENSION IF NOT EXISTS vector;' || true
  fi
}

backup_database() {
  local db_url="$1"
  local backup_dir="$ROOT_DIR/backups"
  mkdir -p "$backup_dir"
  local stamp
  stamp="$(date +%Y%m%d_%H%M%S)"
  local file="$backup_dir/pre-update_${stamp}.sql"
  if command -v pg_dump >/dev/null 2>&1; then
    echo "Creating backup at $file"
    pg_dump --dbname "$db_url" --no-owner --no-privileges --clean --if-exists --file "$file"
    echo "$file"
  else
    echo "" # no backup
  fi
}

restore_database() {
  local db_url="$1"; shift
  local file="$1"
  [[ -n "$file" && -f "$file" ]] || { echo "No valid backup file to restore" >&2; return 1; }
  command -v psql >/dev/null 2>&1 || { echo "psql not found for restore" >&2; return 1; }
  echo "Restoring database from $file..."
  psql --dbname "$db_url" -f "$file"
}

run_cmd() {
  echo "→ $*"
  "$@"
}

main() {
  local db_url
  db_url="$(get_database_url)"
  if [[ -z "$db_url" ]]; then
    echo "DATABASE_URL not found in backend/config/config.json or backend/.env" >&2
    exit 1
  fi
  export DATABASE_URL="$db_url"
  echo "Using DATABASE_URL: $DATABASE_URL"

  local backup
  backup="$(backup_database "$db_url")"
  ensure_extensions "$db_url"

  set +e
  run_cmd npm run db:migrate:deploy
  local rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "migrate deploy failed ($rc). Attempting prisma db push..."
    run_cmd npm run db:push || {
      echo "db push failed; attempting restore..." >&2
      [[ -n "$backup" ]] && restore_database "$db_url" "$backup" || true
      exit 1
    }
  fi
  set -e

  run_cmd npm run db:seed
  echo "Database update completed successfully."
}

main "$@"


