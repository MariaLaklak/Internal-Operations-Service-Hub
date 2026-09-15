const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');

const stateFileEnvironmentVariable = 'INTERNAL_OPERATIONS_SERVICE_HUB_PLAYWRIGHT_STATE_FILE';
const stateFile = process.env[stateFileEnvironmentVariable] ?? join(
  tmpdir(),
  `internal-operations-service-hub-playwright-${process.pid}-${randomUUID()}.json`
);
const playwrightBinary = join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright'
);

function readRunState() {
  if (!existsSync(stateFile)) {
    throw new Error(`Playwright test database state is missing: ${stateFile}`);
  }

  let state;
  try {
    state = JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch (error) {
    throw new Error(`Playwright test database state is malformed: ${stateFile}`, { cause: error });
  }

  if (
    typeof state !== 'object' ||
    state === null ||
    typeof state.temporaryDirectory !== 'string' ||
    typeof state.databaseUrl !== 'string'
  ) {
    throw new Error(`Playwright test database state is malformed: ${stateFile}`);
  }

  return state;
}

function removeWithRetry(target) {
  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(target, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      if (error.code !== 'EBUSY' && error.code !== 'EPERM') {
        throw error;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }

  throw lastError;
}

let playwrightExitCode = 1;
let cleanupError;

try {
  const result = spawnSync(playwrightBinary, ['test', '--reporter=line'], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, [stateFileEnvironmentVariable]: stateFile },
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  playwrightExitCode = typeof result.status === 'number' ? result.status : 1;
} catch (error) {
  cleanupError = error;
  console.error(error);
} finally {
  try {
    const { temporaryDirectory } = readRunState();
    removeWithRetry(temporaryDirectory);
    removeWithRetry(stateFile);
  } catch (error) {
    cleanupError = cleanupError ?? error;
    console.error(error);
  }
}

process.exitCode = playwrightExitCode !== 0 ? playwrightExitCode : cleanupError ? 1 : 0;
