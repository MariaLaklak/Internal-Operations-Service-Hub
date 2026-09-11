# Internal Operations Service Hub

## Project Overview

The Internal Operations Service Hub is a company web application where employees can submit and follow requests for IT, Human Resources, and Finance.

The system gives employees and departments one organized place to manage requests instead of using different communication channels.

## Problem

Employee requests may currently be sent through different and unorganized channels. Because of this, requests can be forgotten, sent to the wrong person, or handled without a clear status or responsible staff member.

This project aims to make the request process clearer and easier to follow.

## Main Users

- **Employee:** Submits requests, follows their status, and adds comments.
- **Department Staff:** Handles requests for their department, assigns requests, updates statuses, and adds comments.
- **Approver:** Approves or rejects requests that require authorization.

## Main Features

- Registered-user login
- Role-based access
- Request submission
- Request assignment
- Status tracking
- Approval or rejection
- Comments
- Request history
- Clear error handling
- Safe handling of simultaneous requests

## Request Workflow

A new request starts with the status `Submitted`.

The main request workflow is:

```text
Submitted → In Progress → Resolved
```
Some requests may also require an approval decision from an approver.

## Architecture

The system uses three main parts:

1. A Web Interface for pages, forms, results, and errors.
2. An Application Backend for validation, authorization, and request rules.
3. Data Storage for users, requests, comments, approvals, and history.

One web application, one backend, and one data store keep the project manageable within the five-week academy.

## Project Documentation

- [Product Specification](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Data Model](docs/data-model.md)
- [Architecture Decision Record](docs/decisions/ADR-001.md)

## Current Status

The project is currently at version `v0.3 — Request Boundary Protection`.

The request-submission slice and the first protected status transition are implemented. Real authentication, assignment, approvals, comments, and later lifecycle transitions remain future work.

The first implemented slice is a request-submission flow using a React frontend, NestJS backend, Prisma, and SQLite. The goal is to complete the working application by the end of the five-week academy.

## Running the Request Submission Slice

Requirements: Node.js 22.

From the repository root, copy `backend/.env.example` to `backend/.env`, then run:

```powershell
npm.cmd --prefix backend install
npm.cmd --prefix backend run prisma:generate
npm.cmd --prefix backend run prisma:migrate
npm.cmd --prefix backend run prisma:seed
npm.cmd --prefix backend run test:e2e
npm.cmd --prefix backend run build
npm.cmd --prefix backend run start:dev
```

In another terminal, run the frontend:

```powershell
npm.cmd --prefix frontend install
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run dev
```

The API exposes `POST /api/requests`, `GET /api/requests`, and `PATCH /api/requests/:id/status`. The backend selects the seeded demo employee and assigns the creation time and initial `Submitted` status. The frontend does not send requester ID, creation time, or initial status.

### Teaching Status Update

For local teaching only, the frontend selects one of these aliases and sends it in the `X-Actor-Id` header:

* `demo-employee`
* `it-staff-001`

This is a local teaching mechanism, not authentication. The backend resolves the alias to a persisted user and owns role, department, request-state, and transition checks.

To attempt the status update, call:

```http
PATCH /api/requests/:id/status
X-Actor-Id: it-staff-001
Content-Type: application/json

{ "status": "In Progress" }
```

The only implemented transition is `Submitted` to `In Progress`. `Resolved` is recognized for validation but has no action yet. A `401` means the teaching header is missing or unknown, `403` means the persisted actor is not authorized for the request, `404` means the request does not exist, and `409` means the lifecycle transition is recognized but not allowed. Unsupported values such as `Closed` are `400` validation errors.

### Windows PowerShell Manual Verification

Run these commands against a running local backend after creating or obtaining a request ID. These commands are documentation examples and have not been recorded as completed verification in this session.

```powershell
$baseUrl = 'http://localhost:3000/api/requests'
$requestId = '<request-id>'
$body = @{ status = 'In Progress' } | ConvertTo-Json

# Authorized IT Department Staff attempt
Invoke-RestMethod -Method Patch -Uri "$baseUrl/$requestId/status" -Headers @{ 'X-Actor-Id' = 'it-staff-001' } -ContentType 'application/json' -Body $body

# Employee attempt: expected 403
Invoke-RestMethod -Method Patch -Uri "$baseUrl/$requestId/status" -Headers @{ 'X-Actor-Id' = 'demo-employee' } -ContentType 'application/json' -Body $body

# Missing header: expected 401
Invoke-RestMethod -Method Patch -Uri "$baseUrl/$requestId/status" -ContentType 'application/json' -Body $body

# Unknown request: expected 404
Invoke-RestMethod -Method Patch -Uri "$baseUrl/does-not-exist/status" -Headers @{ 'X-Actor-Id' = 'it-staff-001' } -ContentType 'application/json' -Body $body

# Recognized but invalid transition: expected 409 after the request is In Progress
$resolvedBody = @{ status = 'Resolved' } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$baseUrl/$requestId/status" -Headers @{ 'X-Actor-Id' = 'it-staff-001' } -ContentType 'application/json' -Body $resolvedBody
```

To prove persistence, submit a request, stop and restart the backend, then call `GET http://localhost:3000/api/requests` and confirm the request remains. The Week 3 manual persistence result is pending.

## First-Version Scope

The completed first version will focus on the main internal request process.

It will not include email or SMS notifications, attachments, live chat, AI features, appointment booking, advanced analytics, external integrations, or a mobile application.