# Week 4 Production AI Delivery

## Capability

An employee enters a normal service-request description in the existing request form and explicitly requests AI intake advice. The advice contains:

* `suggestedTitle`
* `suggestedDepartment`
* `summary`
* `missingInformation`
* `suggestedNextStep`

The employee reviews the advice before deciding what to do. `Use suggestion` changes only the title and, when it is not null, the department. The original description and approval selection remain under employee control. The employee must still press the normal `Submit request` button.

AI advice is advisory only. It never creates or updates a request, approves or rejects anything, or changes request status.

## Product Boundary

The endpoint is:

```http
POST /api/requests/intake-advice
X-Actor-Id: demo-employee
Content-Type: application/json

{
  "reportedIssue": "I need VPN access for remote work."
}
```

Successful advice explicitly returns `200 OK`. The allowed department values are `IT`, `Human Resources`, `Finance`, or `null` when clarification is needed.

The response contains exactly these five public fields:

* `suggestedTitle`
* `suggestedDepartment`
* `summary`
* `missingInformation`
* `suggestedNextStep`

Unexpected provider fields are stripped before the response is returned.

## Trust and Context

The backend resolves the teaching identity and trusts the persisted actor role. The allowed department list is backend-owned product context. The employee's reported issue is unverified input, and the provider response is untrusted output.

Authorization happens before provider contact. The provider receives only:

* the reported issue text;
* the allowed department names.

Employee names, email addresses, actor aliases, database IDs, request history, request counts, and unrelated records are not sent.

## Validation and Failure Handling

DTO validation rejects blank reported issues. The provider envelope and structured output are parsed and validated at runtime. Unsupported departments and malformed fields are rejected.

Provider errors return HTTP `502` with this stable message:

`The Service Hub could not produce request intake advice right now.`

Provider failure does not create or modify requests. This delivery adds no retries, RAG, MCP, tools, queues, or external production integration.

## Local Provider

The repository includes a deterministic OpenAI-compatible local provider for development, browser testing, and evaluation. Its default endpoint is `http://127.0.0.1:3200/v1/chat/completions`; its readiness endpoint is `http://127.0.0.1:3200/health`.

Start it with:

```powershell
npm.cmd --prefix backend run start:provider
```

A paid provider is not required for this delivery.

## Automated Evidence

Observed verification evidence:

* AI evaluations: 8 cases.
* Backend unit tests: 9 tests.
* Backend integration tests: 2 tests.
* Backend API E2E: 8 tests total, including the Week 3 API tests and the intake API regression tests.
* Browser E2E: 2 tests, including the Week 3 request journey and the AI intake journey.

The eight evaluation cases cover clear IT, Human Resources, and Finance issues; thin input; ambiguous input; bounded five-field output; malformed provider output; and provider failure. Assertions check product properties such as allowed departments, required fields, clarification behavior, bounded output, and stable failures rather than exact generated prose.

Backend integration and API E2E tests use isolated temporary SQLite databases. Browser E2E uses its own temporary database and wrapper-owned cleanup. These tests do not modify `backend/prisma/dev.db`.

## Commands

Run from the repository root:

```powershell
npm.cmd --prefix backend run test:ai-eval
npm.cmd --prefix backend run test:unit
npm.cmd --prefix backend run test:integration
npm.cmd --prefix backend run test:e2e
npm.cmd --prefix frontend run test:e2e
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build
```

Then run the frontend TypeScript check:

```powershell
Push-Location frontend
npx.cmd tsc --noEmit
Pop-Location
```

## Delivery Reference

Commit reference: `0da5e63` (`feat: add AI-assisted request intake`)