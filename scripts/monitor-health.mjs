function positiveInteger(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error();
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error();
  }
  return parsed;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeCheckState(value) {
  return value === 'ok' || value === 'unavailable' || value === 'unknown' ? value : 'unknown';
}

function emit(state, httpStatus, database, aiProvider) {
  const record = {
    timestamp: new Date().toISOString(),
    state,
    ...(Number.isInteger(httpStatus) ? { httpStatus } : {}),
    database,
    aiProvider
  };
  console.log(JSON.stringify(record));
}

let intervalMs;
let failureThreshold;
try {
  intervalMs = positiveInteger(process.env.MONITOR_INTERVAL_MS, 2000);
  failureThreshold = positiveInteger(process.env.MONITOR_FAILURE_THRESHOLD, 3);
} catch {
  emit('CONFIG_ERROR', undefined, 'unknown', 'unknown');
  process.exit(1);
}

const healthUrl = process.env.HEALTH_URL ?? 'http://localhost:3000/api/health';
const requestTimeoutMs = 5000;
let consecutiveFailures = 0;
let alertActive = false;
let stopping = false;
let activeController;
let sleepTimer;
let resumeSleep;

function stop() {
  stopping = true;
  activeController?.abort();
  if (sleepTimer) {
    clearTimeout(sleepTimer);
    sleepTimer = undefined;
  }
  resumeSleep?.();
}

process.once('SIGINT', stop);

async function observe(signal) {
  let httpStatus;
  let database = 'unknown';
  let aiProvider = 'unknown';
  let healthy = false;

  try {
    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
    const requestSignal = AbortSignal.any([signal, timeoutSignal]);
    const response = await fetch(healthUrl, { signal: requestSignal });
    httpStatus = response.status;
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (isRecord(body) && isRecord(body.checks)) {
      database = safeCheckState(body.checks.database);
      aiProvider = safeCheckState(body.checks.aiProvider);
    }

    healthy = response.ok && isRecord(body) && body.status === 'ok' &&
      database === 'ok' && aiProvider === 'ok';
  } catch {
    healthy = false;
  }

  return { healthy, httpStatus, database, aiProvider };
}

function waitForNextPoll() {
  return new Promise((resolve) => {
    resumeSleep = resolve;
    sleepTimer = setTimeout(() => {
      sleepTimer = undefined;
      resumeSleep = undefined;
      resolve();
    }, intervalMs);
  });
}

while (!stopping) {
  activeController = new AbortController();
  const result = await observe(activeController.signal);
  activeController = undefined;
  if (stopping) {
    break;
  }

  let state;
  if (result.healthy) {
    consecutiveFailures = 0;
    state = alertActive ? 'RESOLVED' : 'HEALTHY';
    alertActive = false;
  } else {
    consecutiveFailures += 1;
    if (consecutiveFailures >= failureThreshold && !alertActive) {
      state = 'ALERT';
      alertActive = true;
    } else {
      state = 'NON_HEALTHY';
    }
  }

  emit(state, result.httpStatus, result.database, result.aiProvider);
  await waitForNextPoll();
}

emit('STOPPED', undefined, 'unknown', 'unknown');
