import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import { prepareTestDatabase } from './e2e/test-environment';

const stateFileEnvironmentVariable = 'INTERNAL_OPERATIONS_SERVICE_HUB_PLAYWRIGHT_STATE_FILE';
process.env[stateFileEnvironmentVariable] ??= join(
  tmpdir(),
  `internal-operations-service-hub-playwright-${process.pid}-${randomUUID()}.json`
);

prepareTestDatabase();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'npm.cmd --prefix ../backend run start:dev',
      url: 'http://127.0.0.1:3000/api/requests',
      reuseExistingServer: false,
      timeout: 120000
    },
    {
      command: 'npm.cmd run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 120000
    }
  ]
});