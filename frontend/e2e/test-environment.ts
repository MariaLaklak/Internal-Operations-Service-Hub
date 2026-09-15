import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const stateFileEnvironmentVariable = 'INTERNAL_OPERATIONS_SERVICE_HUB_PLAYWRIGHT_STATE_FILE';

function getStateFile(): string {
  const stateFile = process.env[stateFileEnvironmentVariable];
  if (!stateFile) {
    throw new Error(`The ${stateFileEnvironmentVariable} environment variable is required.`);
  }

  return stateFile;
}

type TestDatabaseState = {
  temporaryDirectory: string;
  databaseUrl: string;
};

function readTestDatabaseState(): TestDatabaseState {
  const stateFile = getStateFile();
  if (!existsSync(stateFile)) {
    throw new Error(`Playwright test database state is missing: ${stateFile}`);
  }

  let state: unknown;
  try {
    state = JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch (error) {
    throw new Error(`Playwright test database state is malformed: ${stateFile}`, { cause: error });
  }

  if (
    typeof state !== 'object' ||
    state === null ||
    typeof (state as Partial<TestDatabaseState>).temporaryDirectory !== 'string' ||
    typeof (state as Partial<TestDatabaseState>).databaseUrl !== 'string'
  ) {
    throw new Error(`Playwright test database state is malformed: ${stateFile}`);
  }

  return state as TestDatabaseState;
}

function runLocalBinary(binary: string, args: string[], environment: NodeJS.ProcessEnv, cwd: string) {
  execFileSync(binary, args, {
    cwd,
    env: environment,
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });
}

export function prepareTestDatabase() {
  const stateFile = getStateFile();
  if (existsSync(stateFile)) {
    process.env.DATABASE_URL = readTestDatabaseState().databaseUrl;
    return;
  }

  const repositoryDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const backendDirectory = join(repositoryDirectory, 'backend');
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'internal-operations-service-hub-playwright-'));
  const databasePath = join(temporaryDirectory, 'browser-e2e.db');
  const databaseUrl = `file:${databasePath.replace(/\\/g, '/')}`;
  const environment = { ...process.env, DATABASE_URL: databaseUrl };
  const prismaBinary = join(
    backendDirectory,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
  );
  const tsxBinary = join(
    backendDirectory,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
  );

  writeFileSync(stateFile, JSON.stringify({ temporaryDirectory, databaseUrl }));
  process.env.DATABASE_URL = databaseUrl;

  try {
    runLocalBinary(
      prismaBinary,
      ['migrate', 'deploy', '--schema', join(backendDirectory, 'prisma', 'schema.prisma')],
      environment,
      backendDirectory
    );
    runLocalBinary(tsxBinary, ['prisma/seed.ts'], environment, backendDirectory);
  } catch (error) {
    cleanupTestDatabase();
    throw error;
  }
}

export function cleanupTestDatabase() {
  const stateFile = getStateFile();
  const { temporaryDirectory } = readTestDatabaseState();
  rmSync(temporaryDirectory, { recursive: true, force: true });
  rmSync(stateFile, { force: true });
}