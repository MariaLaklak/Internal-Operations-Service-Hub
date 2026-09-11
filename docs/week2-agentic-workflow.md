# Week 2 Agentic Workflow: Request Submission Slice

## Week 1 Sources Used

- `README.md`
- `docs/product-spec.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/decisions/ADR-001.md`
- `docs/architecture.excalidraw` and `docs/architecture.png`

## Selected Lifecycle Behavior

The request lifecycle remains:

```text
Submitted -> In Progress -> Resolved
```

Week 2 implements creation only. Every successful submission starts in `Submitted`.

## States, Rules, and Invariant

Supported departments are `IT`, `Human Resources`, and `Finance`.

A request requires a title, description, department, approval-required flag, requester, creation time, and status. Invalid input returns HTTP 400 and is not saved. The backend selects the seeded demo employee and assigns both the creation time and initial `Submitted` status. React does not send requester ID, creation time, or status.

Invariant: every successfully created request has exactly one backend-selected requester, one target department, required text fields, a creation timestamp, and status `Submitted`.

## Implementation Area

- NestJS backend with CORS and global DTO validation.
- Prisma 6.x with SQLite.
- React frontend using `POST /api/requests` and `GET /api/requests`.
- One backend end-to-end test file for valid and invalid submissions.

## Explicit Non-Goals

Authentication, full role authorization, assignment, status transitions, approvals, comments, history, notifications, attachments, live chat, AI, analytics, priorities, reopening resolved requests, external integrations, mobile support, and automatic company-account registration remain outside this slice.

The seeded demo employee is a temporary limitation. It is selected by the backend until authentication and boundary protection are implemented in a following session.

## Bounded Agent Task and Relevant Context

The bounded task was to implement one employee request-submission slice without changing the existing ADR-001 decision history. Relevant context was the Week 1 product specification, architecture, data model, ADR-001, and architecture diagram.

## Inspection and Plan Review

Before implementation, the repository was inspected without edits. The approved plan specified the new Week 2 workflow document, ADR-002, Prisma/SQLite, the two API endpoints, backend-owned identity and status, a single backend end-to-end test file, and manual restart verification.

## Verification Cases

Valid case:

```json
{
  "title": "VPN access request",
  "description": "I need VPN access for remote work.",
  "department": "IT",
  "requiresApproval": false
}
```

Expected: HTTP 201, a saved request, requester `Demo Employee`, department `IT`, a creation timestamp, and status `Submitted`.

Invalid case: submit the otherwise valid payload with department `Legal`.

Expected: HTTP 400 and no new database row.

## Expected Versus Actual Evidence

### Manual Verification

Valid case:

- Title: `VPN access request`
- Description: `I need VPN access for remote work.`
- Department: `IT`
- `requiresApproval`: `false`
- React displayed the saved request.
- The backend assigned status `Submitted`.
- Two separate submissions produced two separate persisted requests.

Invalid case:

- The otherwise valid payload was submitted with department `Legal`.
- The backend returned HTTP 400.
- The response stated that department must be `IT`, `Human Resources`, or `Finance`.
- No `Legal` request appeared in the application.

Persistence proof:

- The requests were created on September 10, 2026.
- Both servers were stopped.
- The backend and frontend were restarted on September 11, 2026.
- The same two VPN requests reappeared through `GET /api/requests` with status `Submitted`.

### Previous Automated Verification

- Backend tests: 1 suite passed, 2 tests passed.
- Backend build passed.
- Frontend build and TypeScript check passed.

## Regression Check

Run the backend end-to-end test after migration and seeding. Run both backend and frontend builds. Confirm that the invalid-input test still leaves the request count unchanged.

## Persistence Proof

The requests were created on September 10, 2026. Both servers were stopped, then the backend and frontend were restarted on September 11, 2026. The same two VPN requests reappeared through `GET /api/requests` with status `Submitted`.

## Final Commit Information

Implementation commit identifier: `dbcbb79`.
Implementation commit message: `feat: add persistent request submission slice`.

## Discovered Defect and Bounded Fix

The backend originally tried to start from `dist/main.js`, but the NestJS compiler emits the entry point at `dist/src/main.js` because the source root is `src` and no output path remapping is configured. The incorrect path prevented the compiled backend from starting.

The start script was corrected to `node dist/src/main.js`, and the backend build passed again.

Verification: `npm.cmd --prefix backend run build` completed successfully after the fix. The compiled entry point remains `backend/dist/src/main.js`.
