import { createServer } from 'node:http';

const allowedDepartments = ['IT', 'Human Resources', 'Finance'];
export type LocalAiProviderMode = 'normal' | 'malformed' | 'failure';

function departmentForIssue(reportedIssue: string): string | null {
  const issue = reportedIssue.toLowerCase();
  if (/vpn|laptop|password|software|access|computer/.test(issue)) {
    return 'IT';
  }
  if (/payroll|leave|benefit|employment|hr|human resource/.test(issue)) {
    return 'Human Resources';
  }
  if (/expense|reimburse|invoice|budget|payment/.test(issue)) {
    return 'Finance';
  }
  return null;
}

function adviceFor(reportedIssue: string) {
  const suggestedDepartment = departmentForIssue(reportedIssue);
  return {
    suggestedTitle: `Help with ${reportedIssue.trim().slice(0, 80)}`,
    suggestedDepartment,
    summary: `The employee reported: ${reportedIssue.trim()}`,
    missingInformation: suggestedDepartment ? [] : ['Which department should handle this issue?'],
    suggestedNextStep: suggestedDepartment
      ? `Review the details and submit the request to ${suggestedDepartment}.`
      : 'Add the affected system, process, or business area before submitting the request.'
  };
}

function readBody(request: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer | string) => { body += chunk.toString(); });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

export function createLocalAiProviderServer(initialMode: LocalAiProviderMode = 'normal') {
  let mode = initialMode;
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
      return;
    }

    if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
      response.writeHead(404).end();
      return;
    }

    if (mode === 'failure') {
      response.writeHead(503).end();
      return;
    }

    if (mode === 'malformed') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        choices: [{ message: { content: '{ malformed provider output' } }]
      }));
      return;
    }

    try {
      const payload = JSON.parse(await readBody(request)) as {
        messages?: Array<{ role?: string; content?: string }>;
      };
      const userMessage = payload.messages?.find((message) => message.role === 'user');
      const input = JSON.parse(userMessage?.content ?? '{}') as {
        reportedIssue?: unknown;
        allowedDepartments?: unknown;
      };

      if (
        typeof input.reportedIssue !== 'string' ||
        !Array.isArray(input.allowedDepartments) ||
        input.allowedDepartments.some((department) => !allowedDepartments.includes(String(department)))
      ) {
        response.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'invalid input' }));
        return;
      }

      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(adviceFor(input.reportedIssue)) } }]
      }));
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'invalid request' }));
    }
  });

  return {
    server,
    setMode(nextMode: LocalAiProviderMode) {
      mode = nextMode;
    }
  };
}

if (require.main === module) {
  const port = Number.parseInt(process.env.AI_PROVIDER_PORT ?? '3200', 10) || 3200;
  const provider = createLocalAiProviderServer(process.env.AI_PROVIDER_TEST_MODE as LocalAiProviderMode ?? 'normal');
  provider.server.listen(port, '127.0.0.1', () => {
    console.log(`Local AI provider listening on http://127.0.0.1:${port}`);
  });
}