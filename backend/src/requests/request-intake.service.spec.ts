import { BadGatewayException, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { createServer } from 'node:http';
import { PrismaService } from '../prisma/prisma.service';
import { INTAKE_ADVICE_FAILURE_MESSAGE } from './request.constants';
import { RequestIntakeAdviceDto } from './dto/request-intake-advice.dto';
import { RequestIntakeProvider, RequestIntakeAdviceResponse } from './request-intake.provider';
import { RequestIntakeService } from './request-intake.service';

const validAdvice: RequestIntakeAdviceResponse = {
  suggestedTitle: 'VPN access',
  suggestedDepartment: 'IT',
  summary: 'The employee needs VPN access.',
  missingInformation: [],
  suggestedNextStep: 'Confirm the device and access scope.'
};

function createPrisma(actor: { role: string } | null) {
  return {
    user: { findUnique: jest.fn().mockResolvedValue(actor) },
    request: { create: jest.fn(), update: jest.fn() }
  } as unknown as PrismaService;
}

function createProvider() {
  return { generate: jest.fn().mockResolvedValue(validAdvice) } as unknown as RequestIntakeProvider;
}

describe('RequestIntakeService', () => {
  const input: RequestIntakeAdviceDto = { reportedIssue: 'I need VPN access.' };

  it('allows the Demo Employee and sends only bounded provider context', async () => {
    const prisma = createPrisma({ role: 'Employee' });
    const provider = createProvider();
    const service = new RequestIntakeService(prisma, provider);

    await expect(service.createAdvice('demo-employee', input)).resolves.toEqual(validAdvice);
    expect(provider.generate).toHaveBeenCalledWith({
      reportedIssue: input.reportedIssue,
      allowedDepartments: ['IT', 'Human Resources', 'Finance']
    });
  });

  it('refuses a non-Employee before contacting the provider', async () => {
    const prisma = createPrisma({ role: 'Department Staff' });
    const provider = createProvider();
    const service = new RequestIntakeService(prisma, provider);

    await expect(service.createAdvice('it-staff-001', input)).rejects.toThrow(ForbiddenException);
    expect(provider.generate).not.toHaveBeenCalled();
    expect(prisma.request.create).not.toHaveBeenCalled();
    expect(prisma.request.update).not.toHaveBeenCalled();
  });

  it.each([
    ['missing identity', undefined],
    ['unknown identity', 'unknown-actor']
  ])('refuses %s before contacting the provider', async (_label, actorAlias) => {
    const prisma = createPrisma(actorAlias === undefined ? null : { role: 'Employee' });
    const provider = createProvider();
    const service = new RequestIntakeService(prisma, provider);

    await expect(service.createAdvice(actorAlias, input)).rejects.toThrow(UnauthorizedException);
    expect(provider.generate).not.toHaveBeenCalled();
    expect(prisma.request.create).not.toHaveBeenCalled();
    expect(prisma.request.update).not.toHaveBeenCalled();
  });
});

describe('RequestIntakeProvider', () => {
  let fetchSpy: jest.SpyInstance;
  const originalProviderUrl = process.env.AI_PROVIDER_URL;
  const originalTimeout = process.env.AI_PROVIDER_TIMEOUT_MS;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalProviderUrl === undefined) {
      delete process.env.AI_PROVIDER_URL;
    } else {
      process.env.AI_PROVIDER_URL = originalProviderUrl;
    }
    if (originalTimeout === undefined) {
      delete process.env.AI_PROVIDER_TIMEOUT_MS;
    } else {
      process.env.AI_PROVIDER_TIMEOUT_MS = originalTimeout;
    }
  });

  function mockProviderResponse(content: unknown, ok = true) {
    fetchSpy.mockResolvedValue({
      ok,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }]
      })
    } as unknown as Response);
  }

  it('reconstructs valid output and strips extra provider fields', async () => {
    mockProviderResponse({ ...validAdvice, internalScore: 0.99, requestId: 'secret' });
    const provider = new RequestIntakeProvider();

    await expect(provider.generate({
      reportedIssue: 'I need VPN access.',
      allowedDepartments: ['IT', 'Human Resources', 'Finance']
    })).resolves.toEqual(validAdvice);

    const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as {
      messages: Array<{ role: string; content: string }>;
    };
    expect(JSON.parse(requestBody.messages[1].content)).toEqual({
      reportedIssue: 'I need VPN access.',
      allowedDepartments: ['IT', 'Human Resources', 'Finance']
    });
  });

  it('maps an unsupported department to the stable 502 failure', async () => {
    mockProviderResponse({ ...validAdvice, suggestedDepartment: 'Legal' });
    const provider = new RequestIntakeProvider();

    await expect(provider.generate({
      reportedIssue: 'I need help.',
      allowedDepartments: ['IT', 'Human Resources', 'Finance']
    })).rejects.toThrow(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));
  });

  it('maps malformed provider output to the stable 502 failure', async () => {
    mockProviderResponse('{ malformed json');
    const provider = new RequestIntakeProvider();

    await expect(provider.generate({
      reportedIssue: 'I need help.',
      allowedDepartments: ['IT', 'Human Resources', 'Finance']
    })).rejects.toThrow(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));
  });

  it('maps provider failure to the same stable 502 failure', async () => {
    fetchSpy.mockRejectedValue(new Error('provider details must not escape'));
    const provider = new RequestIntakeProvider();

    await expect(provider.generate({
      reportedIssue: 'I need help.',
      allowedDepartments: ['IT', 'Human Resources', 'Finance']
    })).rejects.toThrow(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));
  });

  it('times out provider requests and preserves the stable 502 response', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const server = createServer((_request, response) => {
      setTimeout(() => response.end('{}'), 150);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test provider did not bind to a port.');
    }
    process.env.AI_PROVIDER_URL = `http://127.0.0.1:${address.port}/v1/chat/completions`;
    process.env.AI_PROVIDER_TIMEOUT_MS = '20';

    try {
      const provider = new RequestIntakeProvider();
      await expect(provider.generate({
        reportedIssue: 'private reported issue',
        allowedDepartments: ['IT']
      })).rejects.toThrow(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('"category":"timeout"'));
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining('private reported issue'));
    } finally {
      loggerSpy.mockRestore();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});