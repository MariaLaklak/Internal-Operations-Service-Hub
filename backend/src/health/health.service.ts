import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestIntakeProvider } from '../requests/request-intake.provider';

export type HealthChecks = {
  database: 'ok' | 'unavailable';
  aiProvider?: 'ok' | 'unavailable' | 'unknown';
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: RequestIntakeProvider
  ) {}

  live() {
    return { status: 'ok' as const };
  }

  async readiness() {
    const databaseAvailable = await this.databaseAvailable();
    return databaseAvailable
      ? { status: 'ready' as const, checks: { database: 'ok' as const } }
      : { status: 'not_ready' as const, checks: { database: 'unavailable' as const } };
  }

  async overall() {
    const [databaseAvailable, aiAvailable] = await Promise.all([
      this.databaseAvailable(),
      this.aiProvider.checkHealth()
    ]);
    const status = !databaseAvailable ? 'unavailable' : aiAvailable ? 'ok' : 'degraded';
    return {
      status,
      checks: {
        database: databaseAvailable ? 'ok' as const : 'unavailable' as const,
        aiProvider: aiAvailable ? 'ok' as const : 'unavailable' as const
      }
    };
  }

  private async databaseAvailable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}