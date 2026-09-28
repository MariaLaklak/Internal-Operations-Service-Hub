const backendBaseUrl = (process.env.BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const actorId = process.env.SMOKE_ACTOR_ID ?? 'demo-employee';
const requestTimeoutMs = 10000;
const adviceFields = [
  'suggestedTitle',
  'suggestedDepartment',
  'summary',
  'missingInformation',
  'suggestedNextStep'
];
const departments = ['IT', 'Human Resources', 'Finance'];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  return isRecord(value) &&
    Object.keys(value).sort().join('|') === [...expectedKeys].sort().join('|');
}

async function getJson(path, expectedStatus, headers = {}) {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    headers,
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  if (response.status !== expectedStatus) {
    throw new Error();
  }
  try {
    return await response.json();
  } catch {
    throw new Error();
  }
}

async function postJson(path, expectedStatus, body, headers = {}) {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  if (response.status !== expectedStatus) {
    throw new Error();
  }
  try {
    return await response.json();
  } catch {
    throw new Error();
  }
}

const steps = [
  {
    name: 'health live',
    async run() {
      const body = await getJson('/api/health/live', 200);
      if (!hasExactKeys(body, ['status']) || body.status !== 'ok') {
        throw new Error();
      }
    }
  },
  {
    name: 'health ready',
    async run() {
      const body = await getJson('/api/health/ready', 200);
      if (!hasExactKeys(body, ['status', 'checks']) || body.status !== 'ready' ||
          !hasExactKeys(body.checks, ['database']) || body.checks.database !== 'ok') {
        throw new Error();
      }
    }
  },
  {
    name: 'health overall',
    async run() {
      const body = await getJson('/api/health', 200);
      if (!hasExactKeys(body, ['status', 'checks']) ||
          !hasExactKeys(body.checks, ['database', 'aiProvider']) || body.checks.database !== 'ok') {
        throw new Error();
      }
      if (body.status === 'ok') {
        if (body.checks.aiProvider !== 'ok') throw new Error();
      } else if (body.status === 'degraded') {
        if (body.checks.aiProvider !== 'unavailable') throw new Error();
      } else {
        throw new Error();
      }
    }
  },
  {
    name: 'request list',
    async run() {
      const body = await getJson('/api/requests', 200, { 'X-Actor-Id': actorId });
      if (!Array.isArray(body)) {
        throw new Error();
      }
    }
  },
  {
    name: 'AI intake advice',
    async run() {
      const body = await postJson(
        '/api/requests/intake-advice',
        200,
        { reportedIssue: 'I need VPN access for remote work' },
        { 'X-Actor-Id': actorId }
      );
      if (!hasExactKeys(body, adviceFields) ||
          typeof body.suggestedTitle !== 'string' ||
          !(body.suggestedDepartment === null || departments.includes(body.suggestedDepartment)) ||
          typeof body.summary !== 'string' ||
          !Array.isArray(body.missingInformation) ||
          !body.missingInformation.every((item) => typeof item === 'string') ||
          typeof body.suggestedNextStep !== 'string') {
        throw new Error();
      }
    }
  }
];

for (const [index, step] of steps.entries()) {
  try {
    await step.run();
    console.log(`PASS ${step.name}`);
  } catch {
    console.log(`FAIL ${step.name}`);
    console.log(`SUMMARY FAIL: ${index}/${steps.length} steps passed`);
    process.exit(1);
  }
}

console.log(`SUMMARY PASS: ${steps.length}/${steps.length} steps passed`);
