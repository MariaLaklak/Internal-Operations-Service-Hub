import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthModule } from '../src/health/health.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RequestIntakeProvider } from '../src/requests/request-intake.provider';

describe('Health API', () => {
  let app: INestApplication;
  let queryRaw: jest.Mock;
  let checkHealth: jest.Mock;

  beforeAll(async () => {
    queryRaw = jest.fn().mockResolvedValue(1);
    checkHealth = jest.fn().mockResolvedValue(true);
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw })
      .overrideProvider(RequestIntakeProvider)
      .useValue({ checkHealth })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    queryRaw.mockReset().mockResolvedValue(1);
    checkHealth.mockReset().mockResolvedValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns live success', async () => {
    await request(app.getHttpServer())
      .get('/api/health/live')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('returns readiness success', async () => {
    await request(app.getHttpServer())
      .get('/api/health/ready')
      .expect(200)
      .expect({ status: 'ready', checks: { database: 'ok' } });
  });

  it('returns sanitized readiness failure', async () => {
    queryRaw.mockRejectedValue(new Error('private database URL and path'));
    await request(app.getHttpServer())
      .get('/api/health/ready')
      .expect(503)
      .expect({ status: 'not_ready', checks: { database: 'unavailable' } });
  });

  it('returns overall health success', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', checks: { database: 'ok', aiProvider: 'ok' } });
  });

  it('returns degraded when the AI provider is unavailable', async () => {
    checkHealth.mockResolvedValue(false);
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'degraded', checks: { database: 'ok', aiProvider: 'unavailable' } });
  });

  it('returns unavailable when the database is unavailable', async () => {
    queryRaw.mockRejectedValue(new Error('private database details'));
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(503)
      .expect({ status: 'unavailable', checks: { database: 'unavailable', aiProvider: 'ok' } });
  });
});