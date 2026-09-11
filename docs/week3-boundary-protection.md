# Week 3 Boundary Protection

## Session 8 Scope

Session 8 adds one protected request lifecycle action: moving a request from `Submitted` to `In Progress`. The backend owns identity resolution, authorization, department matching, request-state checks, transition checks, and the final Prisma mutation.

This session uses a local teaching mechanism only. It does not add real authentication, JWTs, assignment, external integrations, or new dependencies.

## Teaching Aliases

| Alias | Persisted user | Role and department are owned by |
| --- | --- | --- |
| `demo-employee` | `demo.employee@example.com` | Backend User record |
| `it-staff-001` | `it.department.staff@example.com` | Backend User record |

The frontend sends only the selected alias in `X-Actor-Id`. The alias is not authentication and does not let the frontend choose a role or department.

## Allowed and Denied Operations

Allowed:

* `it-staff-001` may move an IT request from `Submitted` to `In Progress`.
* The request must exist, the persisted actor must be `Department Staff`, and the actor's department must match the request department.

Denied:

* Missing or unknown teaching alias: `401 Unauthorized`.
* Missing request: `404 Not Found`.
* Non-staff actor: `403 Forbidden`.
* Department Staff from another department: `403 Forbidden`.
* Recognized but invalid transition, including `Submitted` to `Resolved`: `409 Conflict`.
* Unsupported status such as `Closed`: `400 Bad Request` from DTO validation.

No denied or invalid action should update request status, timestamps, or request counts.

## Endpoint Contract

```http
PATCH /api/requests/:id/status
X-Actor-Id: it-staff-001
Content-Type: application/json

{ "status": "In Progress" }
```

The official recognized lifecycle values are `Submitted`, `In Progress`, and `Resolved`. Only `Submitted` to `In Progress` is implemented in this session.

## Authorization and Validation Order

1. Read the teaching actor only from `X-Actor-Id`.
2. Resolve the alias to a persisted User.
3. Load the request.
4. Check the persisted User role.
5. Check that the persisted User department matches the request department.
6. Check the current request status and requested transition.
7. Perform the Prisma update only after all checks pass.

## Manual Verification Results

Observed on September 11, 2026.

| Case | Expected result | Actual result |
| --- | --- | --- |
| IT Department Staff updates an IT Submitted request | `200`, status becomes `In Progress` | Passed. The request stayed visible, its status became `In Progress`, the status action disappeared, and other requests remained unchanged. |
| Demo Employee updates an IT Submitted request | `403`, status remains `Submitted` | Passed. The backend displayed `Only Department Staff can update request status.` The request remained visible and `Submitted`, and the action remained available. |
| Missing `X-Actor-Id` | `401` | Passed. Message: `A valid actor alias is required.` Before: `Submitted`, count 5. After: `Submitted`, count 5. |
| Unknown alias | `401` | Passed. Safe message: `A valid actor alias is required.` Before: `Submitted`, count 5. After: `Submitted`, count 5. |
| Unknown request ID | `404` | Pending. |
| Submitted to Resolved | `409`, no mutation | Passed. IT staff received `409 Conflict` with `The requested status transition is not allowed.` Before: `Submitted`, count 5. After: `Submitted`, count 5. |
| Unsupported `Closed` status | `400`, no mutation | Pending. |
| Human Resources request with IT Department Staff | `403`, status remains `Submitted` | Passed. The backend displayed `Department Staff can only update requests in their department.` The request remained `Submitted` and the count remained 6. |
| Request submission regression | Human Resources request starts as `Submitted` | Passed. Created `Payroll portal access`; department was Human Resources, initial status was `Submitted`, and total count became 6. |
| Browser selector and action behavior | Manual browser verification | Passed. The Demo Employee denied path and IT Department Staff allowed path behaved as recorded above. |

## No-Mutation Evidence

* Missing identity status before/after: **Submitted -> Submitted**
* Missing identity request count before/after: **5 -> 5**
* Unknown identity status before/after: **Submitted -> Submitted**
* Unknown identity request count before/after: **5 -> 5**
* Invalid-transition status before/after: **Submitted -> Submitted**
* Invalid-transition request count before/after: **5 -> 5**
* Department-mismatch status: **Submitted**
* Department-mismatch request count: **6**

Timestamps were not inspected.

## Restart-Persistence Evidence

* Backend was stopped and restarted: **Passed**
* `GET /api/requests` still returned two `In Progress` requests: **Passed**
* Total request count remained 6: **Passed**

## Regression-Check Results

The following checks were completed before this documentation phase:

* Existing backend E2E: **1 suite passed, 2 tests passed**
* Backend build: **Passed**
* Frontend build: **Passed**
* Frontend TypeScript check: **Passed**
* `git diff --check`: **Passed**

Unknown request ID and unsupported `Closed` status manual checks remain **Pending**. No timestamp inspection is claimed.

## Commit Information

Implementation commit: `f29cb83` - `feat: protect request status transitions`
