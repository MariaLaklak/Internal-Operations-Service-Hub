import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACTOR_EMAIL_BY_ALIAS,
  EMPLOYEE_ROLE,
  SUPPORTED_DEPARTMENTS
} from './request.constants';
import { RequestIntakeAdviceDto } from './dto/request-intake-advice.dto';
import { RequestIntakeAdviceResponse, RequestIntakeProvider } from './request-intake.provider';

@Injectable()
export class RequestIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: RequestIntakeProvider
  ) {}

  async createAdvice(
    actorAlias: string | undefined,
    requestIntakeAdviceDto: RequestIntakeAdviceDto
  ): Promise<RequestIntakeAdviceResponse> {
    const actorEmail = actorAlias
      ? ACTOR_EMAIL_BY_ALIAS[actorAlias as keyof typeof ACTOR_EMAIL_BY_ALIAS]
      : undefined;

    if (!actorEmail) {
      throw new UnauthorizedException('A valid actor alias is required.');
    }

    const actor = await this.prisma.user.findUnique({ where: { email: actorEmail } });
    if (!actor) {
      throw new UnauthorizedException('The actor was not found.');
    }

    if (actor.role !== EMPLOYEE_ROLE) {
      throw new ForbiddenException('Only Employees can request intake advice.');
    }

    return this.provider.generate({
      reportedIssue: requestIntakeAdviceDto.reportedIssue,
      allowedDepartments: SUPPORTED_DEPARTMENTS
    });
  }
}