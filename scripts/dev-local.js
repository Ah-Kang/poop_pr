import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error('Local SQLite development requires Node.js 22.13+ (24 recommended).');
  process.exit(1);
}

const cwd = fileURLToPath(new URL('..', import.meta.url));
const env = {
  ...process.env,
  NODE_ENV: 'development',
  DATABASE_URL: '',
  SQLITE_PATH: 'data/dev-game.db',
  HOST: '127.0.0.1',
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:5173',
  KAKAO_REDIRECT_URI: 'http://localhost:3001/auth/kakao/callback',
  KAKAO_REST_API_KEY: '',
  KAKAO_CLIENT_SECRET: '',
  SESSION_SECRET: randomBytes(32).toString('hex'),
  ADMIN_TOKEN: '',
  ENABLE_ECONOMY_DEMO: 'true',
  VITE_ECONOMY_DEMO: 'true',
};

const children = [];
let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  const timer = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }, 3000);
  timer.unref();
};

for (const args of [
  ['--watch', 'server/index.js'],
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
]) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Failed to start development server: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => stop(code ?? 1));
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log('Local game: http://localhost:5173');
console.log('Local accounts and saves: data/dev-game.db (cloud database and Kakao disabled).');
