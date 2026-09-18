import { BadGatewayException } from '@nestjs/common';
import { createLocalAiProviderServer } from '../scripts/local-ai-provider';
import {
  INTAKE_ADVICE_FAILURE_MESSAGE,
  SUPPORTED_DEPARTMENTS
} from '../src/requests/request.constants';
import { RequestIntakeProvider, RequestIntakeAdviceResponse } from '../src/requests/request-intake.provider';

const publicFields = [
  'suggestedTitle',
  'suggestedDepartment',
  'summary',
  'missingInformation',
  'suggestedNextStep'
];

describe('deterministic request intake evaluations', () => {
  const providerHarness = createLocalAiProviderServer();
  const provider = new RequestIntakeProvider();
  const previousProviderUrl = process.env.AI_PROVIDER_URL;

  beforeAll(async () => {
    await new Promise<void>((resolve) => providerHarness.server.listen(0, '127.0.0.1', resolve));
    const address = providerHarness.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('The evaluation provider did not expose an isolated port.');
    }
    process.env.AI_PROVIDER_URL = `http://127.0.0.1:${address.port}/v1/chat/completions`;
  });

  afterAll(async () => {
    if (previousProviderUrl === undefined) {
      delete process.env.AI_PROVIDER_URL;
    } else {
      process.env.AI_PROVIDER_URL = previousProviderUrl;
    }
    await new Promise<void>((resolve, reject) => providerHarness.server.close((error) => error ? reject(error) : resolve()));
  });

  async function evaluate(reportedIssue: string): Promise<RequestIntakeAdviceResponse> {
    providerHarness.setMode('normal');
    return provider.generate({ reportedIssue, allowedDepartments: SUPPORTED_DEPARTMENTS });
  }

  function expectUsefulAdvice(advice: RequestIntakeAdviceResponse) {
    expect(advice.suggestedTitle.trim()).not.toHaveLength(0);
    expect(advice.summary.trim()).not.toHaveLength(0);
    expect(advice.suggestedNextStep.trim()).not.toHaveLength(0);
    expect(Array.isArray(advice.missingInformation)).toBe(true);
    expect(advice.missingInformation.every((item) => typeof item === 'string')).toBe(true);
  }

  it('gives useful advice and suggests IT for a clear IT issue', async () => {
    const advice = await evaluate('I cannot connect to the company VPN from my laptop.');
    expectUsefulAdvice(advice);
    expect(advice.suggestedDepartment).toBe('IT');
  });

  it('suggests Human Resources for a clear HR issue', async () => {
    const advice = await evaluate('I need an employment letter for a visa application.');
    expectUsefulAdvice(advice);
    expect(advice.suggestedDepartment).toBe('Human Resources');
  });

  it('suggests Finance for a clear finance issue', async () => {
    const advice = await evaluate('I need reimbursement for a business expense.');
    expectUsefulAdvice(advice);
    expect(advice.suggestedDepartment).toBe('Finance');
  });

  it('identifies missing information for thin input without inventing a department', async () => {
    const advice = await evaluate('I need help.');
    expectUsefulAdvice(advice);
    expect(advice.suggestedDepartment).toBeNull();
    expect(advice.missingInformation.length).toBeGreaterThan(0);
  });

  it('asks for clarification for ambiguous input', async () => {
    const advice = await evaluate('Something is wrong.');
    expectUsefulAdvice(advice);
    expect(advice.suggestedDepartment).toBeNull();
    expect(advice.missingInformation.length).toBeGreaterThan(0);
  });

  it('returns exactly the five public fields and only supported departments', async () => {
    const advice = await evaluate('Please help with a software access issue.');
    expect(Object.keys(advice).sort()).toEqual([...publicFields].sort());
    expect([...SUPPORTED_DEPARTMENTS, null]).toContain(advice.suggestedDepartment);
    expectUsefulAdvice(advice);
  });

  it('maps malformed provider output to the stable 502 error', async () => {
    providerHarness.setMode('malformed');
    await expect(provider.generate({ reportedIssue: 'I need help.', allowedDepartments: SUPPORTED_DEPARTMENTS }))
      .rejects.toThrow(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));
  });

  it('maps provider unavailability to the same stable 502 error', async () => {
    providerHarness.setMode('failure');
    await expect(provider.generate({ reportedIssue: 'I need help.', allowedDepartments: SUPPORTED_DEPARTMENTS }))
      .rejects.toThrow(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));
  });
});