import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const stateFileEnvironmentVariable = 'INTERNAL_OPERATIONS_SERVICE_HUB_INTEGRATION_STATE_FILE';
const stateFile = process.env[stateFileEnvironmentVariable] ?? join(
  tmpdir(),
  `internal-operations-service-hub-integration-${process.pid}-${randomUUID()}.json`
);
process.env[stateFileEnvironmentVariable] = stateFile;

function setupTemporaryDatabase() {
  const backendDirectory = resolve(__dirname, '..');
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'internal-operations-service-hub-'));
  const databasePath = join(temporaryDirectory, 'integration.db');
  const databaseUrl = `file:${databasePath.replace(/\\/g, '/')}`;
  const prismaBinary = join(
    backendDirectory,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
  );

  writeFileSync(stateFile, JSON.stringify({ temporaryDirectory }));
  process.env.DATABASE_URL = databaseUrl;
  execFileSync(
    prismaBinary,
    ['migrate', 'deploy', '--schema', join(backendDirectory, 'prisma', 'schema.prisma')],
    {
      cwd: backendDirectory,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      shell: process.platform === 'win32',
      stdio: 'inherit'
    }
  );
}

export function removeTemporaryDatabase() {
  if (!existsSync(stateFile)) {
    return;
  }

  const { temporaryDirectory } = JSON.parse(readFileSync(stateFile, 'utf8')) as {
    temporaryDirectory: string;
  };

  rmSync(temporaryDirectory, { recursive: true, force: true });
  rmSync(stateFile, { force: true });
}

if (process.env.JEST_WORKER_ID && !process.env.INTEGRATION_DATABASE_READY) {
  setupTemporaryDatabase();
  process.env.INTEGRATION_DATABASE_READY = 'true';
  process.once('exit', removeTemporaryDatabase);
}
