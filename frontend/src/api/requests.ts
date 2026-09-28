import type { ActorAlias, CreateRequestInput, Request, RequestIntakeAdvice } from '../types/request';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}/api/requests`;

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const messages = body?.message;
    throw new Error(Array.isArray(messages) ? messages.join(' ') : messages ?? 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export async function createRequest(input: CreateRequestInput): Promise<Request> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  return readResponse<Request>(response);
}

export async function getRequestIntakeAdvice(
  reportedIssue: string,
  actorAlias: ActorAlias
): Promise<RequestIntakeAdvice> {
  const response = await fetch(`${API_URL}/intake-advice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': actorAlias
    },
    body: JSON.stringify({ reportedIssue })
  });

  return readResponse<RequestIntakeAdvice>(response);
}

export async function getRequests(): Promise<Request[]> {
  const response = await fetch(API_URL);
  return readResponse<Request[]>(response);
}

export async function updateRequestStatus(requestId: string, actorAlias: ActorAlias): Promise<Request> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(requestId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': actorAlias
    },
    body: JSON.stringify({ status: 'In Progress' })
  });

  return readResponse<Request>(response);
}
