# Week 3 Full-Stack Delivery

## Delivered Slice

The Internal Operations Service Hub currently delivers a narrow request workflow:

1. A Demo Employee submits a request for IT, Human Resources, or Finance.
2. The backend assigns the persisted requester and initial `Submitted` status.
3. The request list shows the employee's requests and current status.
4. The local teaching actor `it-staff-001` may move an IT request from `Submitted` to `In Progress`.
5. A Demo Employee attempting the same status action receives `403 Forbidden`.

The flow is intentionally small. It demonstrates request ownership, validation, persistence, authorization, and a browser-visible lifecycle action without claiming a complete identity system.

## Runtime Path

```text
React form and request list
        -> HTTP JSON API
        -> NestJS controller and service
        -> Prisma Client
        -> SQLite
```

The frontend calls the NestJS API at `http://localhost:3000/api`. The React development server runs at `http://localhost:5173`. Development data uses `backend/.env` and its `DATABASE_URL`, normally `file:./dev.db`.

## API Contracts

### Create

```http
POST /api/requests
Content-Type: application/json

{
  "title": "VPN access",
  "description": "I need VPN access for remote work.",
  "department": "IT",
  "requiresApproval": false
}
```

A successful response is `201 Created`:

```json
{
  "id": "cm...",
  "title": "VPN access",
  "description": "I need VPN access for remote work.",
  "department": "IT",
  "requester": "Demo Employee",
  "requiresApproval": false,
  "status": "Submitted",
  "createdAt": "2026-09-15T00:00:00.000Z"
}
```

The client does not provide `requester`, `requesterId`, `status`, or `createdAt`. The backend owns those values. A blank title is rejected with `400 Bad Request`; the request count remains unchanged.

### List

```http
GET /api/requests
```

The response is `200 OK` with an array of the same request response objects, ordered newest first. The service returns requests owned by the seeded Demo Employee.

### Status update

```http
PATCH /api/requests/:id/status
X-Actor-Id: it-staff-001
Content-Type: application/json

{ "status": "In Progress" }
```

An allowed IT Department Staff update returns `200 OK` with the updated request response and `status: "In Progress"`. The persisted request is re-read in the database by integration tests.

The recognized status values are `Submitted`, `In Progress`, and `Resolved`; only `Submitted` to `In Progress` is implemented. A rejected status action leaves the visible request state and persisted request state unchanged.

## Teaching Actors and Authorization

The UI uses two teaching aliases:

| Alias | Persisted user | Result |
| --- | --- | --- |
| `it-staff-001` | `it.department.staff@example.com` | May update an IT request from `Submitted` to `In Progress` |
| `demo-employee` | `demo.employee@example.com` | Receives `403 Forbidden` for the status action |

The selector and `X-Actor-Id` header are teaching aliases, not real authentication. The backend resolves the alias to a persisted User and owns the role, department, request state, and transition checks. The frontend cannot choose a role or department by changing the request body.

## Test Evidence

| Claim | Evidence |
| --- | --- |
| Business rule: Demo Employee cannot update status | Unit suite: 1 suite, 1 test; verifies `ForbiddenException` and that `request.update` is not called |
| Authorized IT staff update persists | Database integration suite: 1 suite, 2 tests; directly re-queries SQLite and verifies `In Progress` |
| Denied employee update leaves state and count unchanged | Database integration test directly re-queries status and request count after `403` behavior |
| POST and GET regression protection | Backend API E2E suite: 1 suite, 2 tests; valid POST proves backend-owned requester/status and GET listing; invalid blank title returns `400` with unchanged GET count |
| Browser request journey | Playwright: 1 test; submits an IT request, observes `Submitted`, advances it as IT staff, reloads, and observes persisted `In Progress` |
| Test isolation | Backend integration and API E2E suites apply migrations to unique temporary SQLite files and remove database/state files afterward; Playwright uses its own temporary browser-E2E database and teardown |

The complete verification matrix passed on September 15, 2026:

```text
Backend unit:        1 suite passed, 1 test passed
Backend integration: 1 suite passed, 2 tests passed
Backend API E2E:     1 suite passed, 2 tests passed
Frontend browser E2E:1 test passed
Backend build:       passed
Frontend build:      passed
Frontend TypeScript: passed
Diff check:          passed
```

Run the matrix from the repository root:

```powershell
npm.cmd --prefix backend run test:unit
npm.cmd --prefix backend run test:integration
npm.cmd --prefix backend run test:e2e
npm.cmd --prefix frontend run test:e2e
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build
Push-Location frontend; npx.cmd tsc --noEmit; Pop-Location
git diff --check
```

## Isolation and Scope

Automated tests do not use or modify `backend/prisma/dev.db`. They create temporary SQLite databases, apply the existing migrations, create only the canonical fixtures required by the test, disconnect Prisma, and remove temporary state. Tests run serially; Playwright manages its own test servers through its configuration rather than requiring a manually managed server.

External integration is intentionally not required for this product slice. There are no email, SMS, identity-provider, approval-system, or other external service integrations.

Remaining production limitations and non-goals include real authentication, user registration, assignment, approvals, comments, request history, notifications, complete lifecycle transitions, concurrency handling, and a production database deployment strategy.

Commit reference: `097275f` (`test: automate week 3 product confidence`).

Verification date: **September 15, 2026**.
