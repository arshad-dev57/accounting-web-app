/**
 * PM2 ecosystem — Bisonstechs Next.js web app (Windows on-prem, standalone).
 *
 * Runtime env (PORT, HOSTNAME, API_URL, COOKIE_SECURE, etc.) comes from the
 * standalone folder `.env` / `.env.production` — do not put secrets here.
 *
 * Resolves runtime root in order:
 *   1. BISONSTECHS_WEB_RUNTIME env var
 *   2. Same folder as this file (packaged `package/` layout)
 *   3. deploy/on-prem/windows/package/
 *   4. Repo .next/standalone (dev build on server)
 */
const fs = require('fs');
const path = require('path');

function resolveRuntimeRoot() {
  if (process.env.BISONSTECHS_WEB_RUNTIME) {
    return path.resolve(process.env.BISONSTECHS_WEB_RUNTIME);
  }

  const candidates = [
    __dirname,
    path.join(__dirname, 'package'),
    path.resolve(__dirname, '../../..', '.next', 'standalone'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'server.js'))) {
      return dir;
    }
  }

  throw new Error(
    'Standalone Next.js server not found. Run build-production.ps1 and package-standalone.ps1 first.'
  );
}

const runtimeRoot = resolveRuntimeRoot();
const logsDir = path.join(__dirname, 'logs');

module.exports = {
  apps: [
    {
      name: 'bisonstechs-web',
      script: path.join(runtimeRoot, 'server.js'),
      cwd: runtimeRoot,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 50,
      min_uptime: '10s',
      restart_delay: 3000,
      max_memory_restart: '1500M',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: path.join(logsDir, 'web-out.log'),
      error_file: path.join(logsDir, 'web-error.log'),
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
