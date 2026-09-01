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

The project is currently at version `v0.1 — Product Foundation`.

This stage contains the product requirements, architecture, data model, and an architecture decision record. The application has not been implemented yet.

The goal is to complete the working application by the end of the five-week academy.

## First-Version Scope

The completed first version will focus on the main internal request process.

It will not include email or SMS notifications, attachments, live chat, AI features, appointment booking, advanced analytics, external integrations, or a mobile application.