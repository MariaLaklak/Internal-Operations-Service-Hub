import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const backendDirectory = join(rootDirectory, 'backend');
const frontendDirectory = join(rootDirectory, 'frontend');
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

const steps = [
  { name: 'Backend Prisma client generation', command: npmCommand, args: ['run', 'prisma:generate'], cwd: backendDirectory },
  { name: 'Backend production build', command: npmCommand, args: ['run', 'build'], cwd: backendDirectory },
  { name: 'Frontend TypeScript check', command: npmCommand, args: ['exec', '--', 'tsc', '--noEmit'], cwd: frontendDirectory },
  { name: 'Frontend production build', command: npmCommand, args: ['run', 'build'], cwd: frontendDirectory },
  { name: 'Backend unit tests', command: npmCommand, args: ['run', 'test:unit'], cwd: backendDirectory },
  { name: 'Backend integration tests', command: npmCommand, args: ['run', 'test:integration'], cwd: backendDirectory },
  { name: 'Backend API E2E tests', command: npmCommand, args: ['run', 'test:e2e'], cwd: backendDirectory },
  { name: 'Backend AI evaluations', command: npmCommand, args: ['run', 'test:ai-eval'], cwd: backendDirectory },
  { name: 'Frontend browser E2E tests', command: npmCommand, args: ['run', 'test:e2e'], cwd: frontendDirectory },
  { name: 'Git diff whitespace check', command: 'git', args: ['diff', '--check'], cwd: rootDirectory }
];

for (const [index, step] of steps.entries()) {
  console.log(`\n[${index + 1}/${steps.length}] ${step.name}`);
  const result = spawnSync(step.command, step.args, {
    cwd: step.cwd,
    stdio: 'inherit',
    shell: isWindows
  });

  if (result.error || result.status !== 0) {
    const exitCode = Number.isInteger(result.status) && result.status !== 0 ? result.status : 1;
    console.error(`FAIL ${step.name}: ${step.command} ${step.args.join(' ')} (exit ${exitCode})`);
    process.exit(exitCode);
  }
}

console.log(`\nPASS release gate: all ${steps.length} steps succeeded.`);
