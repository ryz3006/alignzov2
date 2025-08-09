Param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ProjectRoot {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  return (Resolve-Path (Join-Path $scriptDir '..')).Path
}

function Get-DatabaseUrl {
  $root = Get-ProjectRoot
  $cfgPath = Join-Path $root 'backend\config\config.json'
  $dbUrl = ''
  try {
    if (Test-Path $cfgPath) {
      $nodeCmd = @"
const fs=require('fs');
const p=process.argv[1];
const cfg=JSON.parse(fs.readFileSync(p,'utf8'));
const b=cfg.database||(cfg.backend&&cfg.backend.database)||{};
let url=b.url&&b.url.trim();
if(!url){
  const user=(b.username||'postgres').toString();
  const pass=b.password? encodeURIComponent(b.password.toString()) : '';
  const host=(b.host||'localhost').toString();
  const port=(b.port||5432).toString();
  const name=(b.name||'postgres').toString();
  const auth = pass? `${user}:${pass}` : user;
  url = `postgresql://${auth}@${host}:${port}/${name}`;
}
console.log(url);
"@
      $dbUrl = node -e $nodeCmd $cfgPath | Select-Object -First 1
    }
  } catch {}
  if (-not $dbUrl) {
    $envPath = Join-Path $root 'backend\.env'
    if (Test-Path $envPath) {
      $line = Select-String -Path $envPath -Pattern '^\s*DATABASE_URL\s*=\s*(.+)$' -AllMatches | Select-Object -First 1
      if ($line) {
        $dbUrl = $line.Matches[0].Groups[1].Value.Trim('"')
      }
    }
  }
  return $dbUrl
}

function Ensure-Extensions([string]$dbUrl) {
  if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { return }
  try { & psql --dbname $dbUrl -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' | Out-Null } catch {}
  try { & psql --dbname $dbUrl -c 'CREATE EXTENSION IF NOT EXISTS vector;' | Out-Null } catch {}
}

function Backup-Database([string]$dbUrl) {
  $root = Get-ProjectRoot
  $backupDir = Join-Path $root 'backups'
  if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
  $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
  $file = Join-Path $backupDir ("pre-update_" + $stamp + ".sql")
  if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    Write-Host "Creating backup at $file"
    & pg_dump --dbname $dbUrl --no-owner --no-privileges --clean --if-exists --file $file
    if ($LASTEXITCODE -ne 0) { throw "Backup failed with exit code $LASTEXITCODE" }
    return $file
  } else {
    Write-Warning 'pg_dump not found. Skipping backup.'
    return $null
  }
}

function Restore-Database([string]$dbUrl, [string]$backupFile) {
  if (-not $backupFile) { throw 'No backup file available to restore.' }
  if (-not (Test-Path $backupFile)) { throw "Backup file not found: $backupFile" }
  if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw 'psql not found for restore.' }
  Write-Warning "Restoring database from $backupFile..."
  & psql --dbname $dbUrl -f $backupFile
  if ($LASTEXITCODE -ne 0) { throw "Restore failed with exit code $LASTEXITCODE" }
}

function Run-Cmd([string]$cmd) {
  Write-Host "→ $cmd"
  cmd.exe /c $cmd
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $cmd" }
}

try {
  $root = Get-ProjectRoot
  Set-Location $root

  $dbUrl = Get-DatabaseUrl
  if (-not $dbUrl) { throw 'DATABASE_URL not found in backend/config/config.json or backend/.env' }
  $env:DATABASE_URL = $dbUrl
  Write-Host "Using DATABASE_URL: $dbUrl"

  $backup = Backup-Database -dbUrl $dbUrl
  Ensure-Extensions -dbUrl $dbUrl

  try {
    Run-Cmd 'npm run db:migrate:deploy'
  } catch {
    Write-Warning "Migrate deploy failed. Attempting prisma db push..."
    Run-Cmd 'npm run db:push'
  }

  Run-Cmd 'npm run db:seed'

  Write-Host 'Database update completed successfully.'
  exit 0
} catch {
  Write-Error $_
  try {
    if ($backup) { Restore-Database -dbUrl $dbUrl -backupFile $backup }
  } catch {
    Write-Error "Automatic restore failed: $_"
  }
  exit 1
}


