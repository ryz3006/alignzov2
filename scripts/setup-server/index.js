const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const os = require('os');
const { exec } = require('child_process');
const { Client } = require('pg');

const app = express();
const PORT = process.env.SETUP_PORT || 3300;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory state for setup session
const state = {
  prerequisites: null,
  config: null,
};

// Serve the static SPA from the same folder's public
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// File upload storage
const upload = multer({ dest: path.join(os.tmpdir(), 'alignzo-setup') });

// Utilities
function runCmd(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout, stderr, error });
    });
  });
}

async function checkBinary(binary, versionArgs = ['--version']) {
  const cmd = process.platform === 'win32' ? `where ${binary}` : `which ${binary}`;
  const found = await runCmd(cmd);
  if (!found.ok) return { name: binary, installed: false };
  const ver = await runCmd(`${binary} ${versionArgs.join(' ')}`);
  return { name: binary, installed: true, version: ver.stdout.trim() };
}

// API: prerequisites
app.get('/api/setup/prerequisites', async (_req, res) => {
  const platform = `${os.platform()} ${os.release()}`;
  const arch = os.arch();
  const bins = await Promise.all([
    checkBinary('node', ['-v']),
    checkBinary('npm', ['-v']),
    checkBinary('psql', ['--version']),
    checkBinary('prisma', ['-v']).catch(() => ({ name: 'prisma', installed: false })),
  ]);
  state.prerequisites = { platform, arch, bins };
  res.json({ ok: true, data: state.prerequisites });
});

// API: attempt install missing (best-effort, platform dependent)
app.post('/api/setup/prerequisites/install', async (req, res) => {
  const pkg = req.body?.package;
  if (!pkg) return res.status(400).json({ ok: false, error: 'package required' });

  // best-effort installer
  let installCmd = null;
  if (process.platform === 'linux') {
    // detect apt or yum
    const hasApt = await runCmd('which apt-get');
    const hasYum = await runCmd('which yum');
    if (hasApt.ok) installCmd = `sudo apt-get update && sudo apt-get install -y ${pkg}`;
    else if (hasYum.ok) installCmd = `sudo yum install -y ${pkg}`;
  } else if (process.platform === 'darwin') {
    installCmd = `brew install ${pkg}`;
  } else if (process.platform === 'win32') {
    installCmd = `choco install -y ${pkg}`;
  }
  if (!installCmd) return res.json({ ok: false, error: 'Unsupported platform for auto-install' });

  const result = await runCmd(installCmd);
  res.json({ ok: result.ok, stdout: result.stdout, stderr: result.stderr });
});

// API: receive config
app.post('/api/setup/config', async (req, res) => {
  state.config = req.body;
  res.json({ ok: true });
});

// API: upload files (firebase service account, certs)
app.post('/api/setup/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'file required' });
  res.json({ ok: true, path: req.file.path, originalname: req.file.originalname });
});

// API: run DB migration + seed
app.post('/api/setup/apply', async (_req, res) => {
  try {
    // persist config into backend/frontend config.json
    const backendConfigDir = path.join(process.cwd(), 'backend', 'config');
    const frontendConfigDir = path.join(process.cwd(), 'frontend', 'config');
    await fs.ensureDir(backendConfigDir);
    await fs.ensureDir(frontendConfigDir);

    const config = state.config || {};
    await fs.writeJson(path.join(backendConfigDir, 'config.json'), config.backend || {}, { spaces: 2 });
    await fs.writeJson(path.join(frontendConfigDir, 'config.json'), config.frontend || {}, { spaces: 2 });

    // also generate .env for backend from config
    const envLines = [];
    if (config.backend?.database?.url) envLines.push(`DATABASE_URL=${config.backend.database.url}`);
    if (config.backend?.redis?.url) envLines.push(`REDIS_URL=${config.backend.redis.url}`);
    if (config.backend?.ports?.backend) envLines.push(`PORT=${config.backend.ports.backend}`);
    if (config.backend?.security?.jwtSecret) envLines.push(`JWT_SECRET=${config.backend.security.jwtSecret}`);
    if (config.backend?.cors?.origin) envLines.push(`CORS_ORIGIN=${config.backend.cors.origin}`);
    if (config.backend?.seed?.adminEmail) envLines.push(`SEED_ADMIN_EMAIL=${config.backend.seed.adminEmail}`);
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    await fs.writeFile(backendEnvPath, envLines.join('\n'));

    // generate frontend .env.local
    const feLines = [];
    if (config.frontend?.apiUrl) feLines.push(`NEXT_PUBLIC_API_URL=${config.frontend.apiUrl}`);
    if (config.frontend?.firebase?.apiKey) feLines.push(`NEXT_PUBLIC_FIREBASE_API_KEY=${config.frontend.firebase.apiKey}`);
    if (config.frontend?.firebase?.authDomain) feLines.push(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.frontend.firebase.authDomain}`);
    if (config.frontend?.firebase?.projectId) feLines.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.frontend.firebase.projectId}`);
    const frontendEnvPath = path.join(process.cwd(), 'frontend', '.env.local');
    await fs.writeFile(frontendEnvPath, feLines.join('\n'));

    // Ensure required DB extensions
    const dbUrl = config.backend?.database?.url;
    if (dbUrl) {
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      } catch {}
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      } catch {}
      await client.end();
    }

    // prisma migrate + seed
    const migrate = await runCmd('npm run db:migrate:deploy');
    if (!migrate.ok) return res.status(500).json({ ok: false, error: 'migration failed', details: migrate.stderr });
    const seed = await runCmd('npm run db:seed');
    if (!seed.ok) return res.status(500).json({ ok: false, error: 'seed failed', details: seed.stderr });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Alignzo Setup server running on http://localhost:${PORT}`);
  console.log('Please open http://localhost:3300 in your browser to start the setup.');
});


