// Hostinger Node.js entry — listen on the platform PORT, all interfaces.
const { spawn } = require('child_process');
const path = require('path');

const port = String(process.env.PORT || 3000);
const host = process.env.HOSTNAME || '0.0.0.0';
const nextBin = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'start', '-H', host, '-p', port], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
