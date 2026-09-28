# Week 5 Local Release Operations

## Runtime Configuration

Backend configuration is supplied through `backend/.env.example`, including `DATABASE_URL`, `PORT`, `CORS_ORIGINS`, `AI_PROVIDER_URL`, `AI_PROVIDER_HEALTH_URL`, `AI_PROVIDER_MODEL`, `AI_PROVIDER_HOST`, `AI_PROVIDER_PORT`, `AI_PROVIDER_TIMEOUT_MS`, and `AI_PROVIDER_TEST_MODE`. The frontend API origin is configured by `VITE_API_BASE_URL` in `frontend/.env.example`; the client retains its local development fallback when unset and removes trailing slashes before adding API paths. This document does not reproduce local environment values.

`DATABASE_URL` controls the SQLite file location. Keep `backend/.env` local and uncommitted. For a fresh local setup, follow the initialization steps in the root README; do not replace an existing local configuration or database without checking its owner and backup first.

## Local Startup

Start each process in a separate PowerShell terminal from the repository root, in this order:

1. Deterministic AI provider: `npm.cmd --prefix backend run start:provider`
2. NestJS API: `npm.cmd --prefix backend run start:dev`
3. React frontend: `npm.cmd --prefix frontend run dev`

The local URLs are provider health `http://127.0.0.1:3200/health`, API `http://localhost:3000`, and frontend `http://localhost:5173`. Stop only these locally started processes with Ctrl+C when finished.

## Health Contracts

- `GET /api/health/live` returns HTTP 200 and `{ "status": "ok" }` while Nest is serving.
- `GET /api/health/ready` returns HTTP 200 with database `ok`, or HTTP 503 with database `unavailable`.
- `GET /api/health` returns HTTP 200 `ok` when database and AI provider are available, HTTP 200 `degraded` when only AI is unavailable, and HTTP 503 `unavailable` when the database is unavailable.

Health output contains only status and bounded check states; it does not return connection details or exception text.

## Operational Commands

From the repository root:

```powershell
npm.cmd run verify:release
npm.cmd run monitor:health
npm.cmd run smoke
```

The release gate runs client generation, backend build, frontend TypeScript check and build, backend unit/integration/API E2E tests, AI evaluations, browser E2E tests, and `git diff --check` sequentially. It stops on the first failed command.

The monitor polls the endpoint selected by `HEALTH_URL` at the interval selected by `MONITOR_INTERVAL_MS`, and alerts after the configured `MONITOR_FAILURE_THRESHOLD` consecutive failures. Numeric settings require positive integers; each request has a finite timeout. To collect a short local sample in PowerShell, set a short interval and a suitable positive failure threshold before running `npm.cmd run monitor:health`; interrupt it with Ctrl+C. Its output reports timestamps, healthy/alert state, HTTP status when available, and sanitized database/AI check states only.

The smoke proof accepts `BACKEND_BASE_URL` and `SMOKE_ACTOR_ID`, with local-development fallbacks in the script. It validates liveness, readiness, aggregate health, request listing, and the five-field intake-advice response. It only reads the request list and requests advisory intake advice; it does not call request creation or status-update routes.

## Local Evidence

Observed locally on September 28, 2026:

- Provider health responded HTTP 200.
- Backend liveness returned `ok`; readiness returned `ready` with database `ok`.
- Frontend returned HTTP 200 at `http://localhost:5173`.
- The short monitor sample produced four `HEALTHY` observations with HTTP 200, database `ok`, and AI provider `ok`, then stopped cleanly on Ctrl+C. No URLs, database paths, prompts, identities, or secrets appeared in monitor output.
- Smoke checks passed 5/5: live, ready, aggregate health, request list, and AI intake advice. The smoke code uses no mutating request endpoint, so it created or updated no request.
- The developer SQLite database was not deleted, and no migrations were run during this local operational proof.
- The release gate passed all steps: 10 backend unit tests, 2 database integration tests, 14 backend API E2E tests, 8 AI evaluations, and 2 browser E2E tests. Prisma generation, backend/frontend builds, frontend TypeScript checking, and the final diff check also passed.

This establishes local operational proof only. The service has not been deployed. Pending deployment URL: **TBD**.

## Recovery Principle

If a local process or check fails, stop the processes started for the check and restore the last known-good local configuration. Preserve the SQLite file and take a backup before any future schema or deployment operation. For a future deployment, roll back application/configuration to a known-good release; do not delete or blindly roll back persistent data.
