# Internal Operations Service Hub

## Purpose and Current Slice

This repository contains a small internal request workflow for IT, Human Resources, and Finance. The current slice lets a Demo Employee submit and list requests, then lets the local teaching actor representing IT Department Staff move an IT request from `Submitted` to `In Progress`.

The application path is React -> HTTP API -> NestJS -> Prisma -> SQLite. Real authentication, assignment, approvals, comments, notifications, and external integrations are outside this slice.

See [Week 3 full-stack delivery](docs/week3-full-stack-delivery.md) for the evidence record, [Week 3 boundary protection](docs/week3-boundary-protection.md) for the authorization details, and [Week 4 production AI delivery](docs/week4-production-ai.md) for the advisory intake boundary and evidence.

## Prerequisites

- Windows PowerShell
- Node.js 22 with npm
- Chromium installed for the first browser E2E run

## Project Documentation

- [Product Specification](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Data Model](docs/data-model.md)
- [Architecture Decision Record](docs/decisions/ADR-001.md)

## Install and Initialize

From the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
npm.cmd --prefix backend install
npm.cmd --prefix frontend install
npm.cmd --prefix backend run prisma:generate
npm.cmd --prefix backend run prisma:migrate
npm.cmd --prefix backend run prisma:seed
```

The development database is `backend/prisma/dev.db` through `backend/.env`. Do not commit `backend/.env` or the database file.

## Run Locally

Use two PowerShell terminals from the repository root.

Terminal 1, backend:

```powershell
npm.cmd --prefix backend run start:dev
```

Terminal 2, frontend:

```powershell
npm.cmd --prefix frontend run dev
```

Open the frontend at `http://localhost:5173`. The API is available at `http://localhost:3000/api/requests`.

## Exercise the Workflow

Submit a request in the browser with a title, description, and department. It appears as `Submitted` in the request list. The request body does not include requester, requester ID, creation time, or initial status; the backend owns those values.

For local teaching only, the actor selector sends one of these aliases in `X-Actor-Id`:

- `it-staff-001`: persisted IT Department Staff; allowed to update an IT request.
- `demo-employee`: persisted Demo Employee; receives `403 Forbidden` for the status action.

The aliases are not authentication. The backend resolves them to persisted users and checks the persisted role, department, request state, and transition.

To exercise the API directly in PowerShell after submitting a request, set its ID and call the allowed and denied paths:

```powershell
$baseUrl = 'http://localhost:3000/api/requests'
$requestId = '<request-id>'
$body = @{ status = 'In Progress' } | ConvertTo-Json

# List requests
Invoke-RestMethod -Method Get -Uri $baseUrl

# Allowed: IT Department Staff updates an IT request
Invoke-RestMethod -Method Patch -Uri "$baseUrl/$requestId/status" -Headers @{ 'X-Actor-Id' = 'it-staff-001' } -ContentType 'application/json' -Body $body

# Denied: Demo Employee receives HTTP 403
try { Invoke-RestMethod -Method Patch -Uri "$baseUrl/$requestId/status" -Headers @{ 'X-Actor-Id' = 'demo-employee' } -ContentType 'application/json' -Body $body } catch { $_.Exception.Response.StatusCode }
```

## API Examples

Create a request:

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

Successful creation returns `201` and includes `id`, `title`, `description`, `department`, `requester`, `requiresApproval`, `status`, and `createdAt`. The initial status is `Submitted` and the requester is `Demo Employee`.

List requests with `GET /api/requests`. Update status with:

```http
PATCH /api/requests/:id/status
X-Actor-Id: it-staff-001
Content-Type: application/json

{ "status": "In Progress" }
```

The implemented transition is `Submitted` to `In Progress`. Blank titles return `400`; denied status actions return `403`; missing or unknown teaching aliases return `401`; an invalid lifecycle transition returns `409`.

## Week 4 AI Intake Advice

The request form can use the existing description as employee-reported issue text and request deterministic AI intake advice. The advice suggests a title, department, summary, missing information, and next step. It is advisory only: the employee can use the title and department suggestion, but must review the form and press **Submit request**. It never creates a request or changes approval or status automatically.

The local provider requires no paid account. After installation and initialization above, start it in a separate PowerShell terminal:

```powershell
npm.cmd --prefix backend run start:provider
```

Start the backend and frontend in two additional terminals:

```powershell
# Backend
npm.cmd --prefix backend run start:dev
```

```powershell
# Frontend
npm.cmd --prefix frontend run dev
```

Open `http://localhost:5173`, enter an issue in **Description**, select **Get AI intake advice**, review the five fields, and optionally choose **Use suggestion**. The request is created only after selecting **Submit request**.

Run the deterministic eight-case evaluation with:

```powershell
npm.cmd --prefix backend run test:ai-eval
```

The complete automated check sequence is:

```powershell
npm.cmd --prefix backend run test:ai-eval
npm.cmd --prefix backend run test:unit
npm.cmd --prefix backend run test:integration
npm.cmd --prefix backend run test:e2e
npm.cmd --prefix frontend run test:e2e
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build
Push-Location frontend
npx.cmd tsc --noEmit
Pop-Location
git diff --check
```

## Automated Checks

Install Chromium once before the browser suite:

```powershell
Push-Location frontend; npx.cmd playwright install chromium; Pop-Location
```

Run the exact verification commands from the repository root:

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

AI evaluation contains 8 cases, backend unit tests contain 9 tests, database integration contains 2 tests, backend API E2E contains 8 tests, and browser E2E contains 2 tests. Integration and backend API E2E use unique temporary SQLite databases and remove their state afterward. Playwright creates its own temporary database and manages its provider, backend, and frontend test servers. These tests do not modify development data.

## Troubleshooting

- **Port 3000 or 5173 is busy:** stop the process using the port, then restart the corresponding terminal command. Playwright requires both ports to be available because its configuration starts fresh servers.
- **Database setup fails:** confirm `backend/.env` exists, then rerun `npm.cmd --prefix backend run prisma:generate`, `npm.cmd --prefix backend run prisma:migrate`, and `npm.cmd --prefix backend run prisma:seed`.
- **A server stopped:** restart `npm.cmd --prefix backend run start:dev` or `npm.cmd --prefix frontend run dev` in its terminal. The browser E2E command starts its own servers and should not be run against manually managed test servers.