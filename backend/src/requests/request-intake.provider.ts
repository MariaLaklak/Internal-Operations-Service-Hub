import { BadGatewayException, Injectable } from '@nestjs/common';
import { INTAKE_ADVICE_FAILURE_MESSAGE, SUPPORTED_DEPARTMENTS } from './request.constants';

export type RequestIntakeAdviceResponse = {
  suggestedTitle: string;
  suggestedDepartment: (typeof SUPPORTED_DEPARTMENTS)[number] | null;
  summary: string;
  missingInformation: string[];
  suggestedNextStep: string;
};

type RequestIntakeProviderInput = {
  reportedIssue: string;
  allowedDepartments: readonly string[];
};

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

@Injectable()
export class RequestIntakeProvider {
  async generate(input: RequestIntakeProviderInput): Promise<RequestIntakeAdviceResponse> {
    const providerUrl = process.env.AI_PROVIDER_URL ?? 'http://127.0.0.1:3200/v1/chat/completions';
    const model = process.env.AI_PROVIDER_MODEL ?? 'local-request-intake';

    let response: Response;
    try {
      response = await fetch(providerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Return only a JSON request intake advice object using the supplied allowed departments.'
            },
            {
              role: 'user',
              content: JSON.stringify({
                reportedIssue: input.reportedIssue,
                allowedDepartments: input.allowedDepartments
              })
            }
          ]
        })
      });
    } catch {
      throw this.providerFailure();
    }

    if (!response.ok) {
      throw this.providerFailure();
    }

    let envelope: OpenAiResponse;
    try {
      envelope = await response.json() as OpenAiResponse;
    } catch {
      throw this.providerFailure();
    }

    const content = envelope.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw this.providerFailure();
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(content);
    } catch {
      throw this.providerFailure();
    }

    return this.reconstructAdvice(candidate);
  }

  private reconstructAdvice(candidate: unknown): RequestIntakeAdviceResponse {
    if (!this.isRecord(candidate)) {
      throw this.providerFailure();
    }

    const suggestedTitle = candidate.suggestedTitle;
    const suggestedDepartment = candidate.suggestedDepartment;
    const summary = candidate.summary;
    const missingInformation = candidate.missingInformation;
    const suggestedNextStep = candidate.suggestedNextStep;

    if (
      !this.isNonEmptyString(suggestedTitle) ||
      !this.isAllowedDepartment(suggestedDepartment) ||
      !this.isNonEmptyString(summary) ||
      !this.isStringArray(missingInformation) ||
      !this.isNonEmptyString(suggestedNextStep)
    ) {
      throw this.providerFailure();
    }

    return {
      suggestedTitle: suggestedTitle.trim(),
      suggestedDepartment,
      summary: summary.trim(),
      missingInformation: missingInformation.map((item) => item.trim()),
      suggestedNextStep: suggestedNextStep.trim()
    };
  }

  private isAllowedDepartment(value: unknown): value is (typeof SUPPORTED_DEPARTMENTS)[number] | null {
    return value === null || (
      typeof value === 'string' &&
      (SUPPORTED_DEPARTMENTS as readonly string[]).includes(value)
    );
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => this.isNonEmptyString(item));
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private providerFailure(): BadGatewayException {
    return new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE);
  }
}