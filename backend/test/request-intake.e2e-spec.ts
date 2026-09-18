import { BadGatewayException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { INTAKE_ADVICE_FAILURE_MESSAGE } from '../src/requests/request.constants';
import {
  RequestIntakeAdviceResponse,
  RequestIntakeProvider
} from '../src/requests/request-intake.provider';
import { removeTemporaryDatabase } from './test-database';

const validAdvice: RequestIntakeAdviceResponse = {
  suggestedTitle: 'VPN access',
  suggestedDepartment: 'IT',
  summary: 'The employee needs VPN access.',
  missingInformation: [],
  suggestedNextStep: 'Confirm the device and access scope.'
};

describe('Request intake advice API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let provider: { generate: jest.Mock };

  beforeAll(async () => {
    provider = { generate: jest.fn().mockResolvedValue(validAdvice) };
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(RequestIntakeProvider)
      .useValue(provider)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    prisma = app.get(PrismaService);
    await app.init();

    for (const name of ['IT', 'Human Resources', 'Finance']) {
      await prisma.department.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }

    await prisma.user.upsert({
      where: { email: 'demo.employee@example.com' },
      update: { name: 'Demo Employee', role: 'Employee', departmentId: null },
      create: {
        name: 'Demo Employee',
        email: 'demo.employee@example.com',
        role: 'Employee'
      }
    });

    await prisma.user.upsert({
      where: { email: 'it.department.staff@example.com' },
      update: {
        name: 'IT Department Staff',
        role: 'Department Staff',
        department: { connect: { name: 'IT' } }
      },
      create: {
        name: 'IT Department Staff',
        email: 'it.department.staff@example.com',
        role: 'Department Staff',
        department: { connect: { name: 'IT' } }
      }
    });
  });

  beforeEach(() => {
    provider.generate.mockReset();
    provider.generate.mockResolvedValue(validAdvice);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    removeTemporaryDatabase();
  });

  async function createSubmittedRequest() {
    const department = await prisma.department.findUniqueOrThrow({ where: { name: 'IT' } });
    const employee = await prisma.user.findUniqueOrThrow({ where: { email: 'demo.employee@example.com' } });
    return prisma.request.create({
      data: {
        title: 'Existing VPN request',
        description: 'Existing request state must remain unchanged.',
        requiresApproval: false,
        status: 'Submitted',
        requesterId: employee.id,
        departmentId: department.id
      }
    });
  }

  it('returns HTTP 200 with exactly five fields and does not mutate requests', async () => {
    const existingRequest = await createSubmittedRequest();
    const beforeCount = await prisma.request.count();
    const beforeRequest = await prisma.request.findUniqueOrThrow({ where: { id: existingRequest.id } });

    const response = await request(app.getHttpServer())
      .post('/api/requests/intake-advice')
      .set('X-Actor-Id', 'demo-employee')
      .send({ reportedIssue: 'I need VPN access.' })
      .expect(200);

    expect(Object.keys(response.body).sort()).toEqual([
      'missingInformation',
      'suggestedDepartment',
      'suggestedNextStep',
      'suggestedTitle',
      'summary'
    ].sort());
    expect(response.body).toEqual(validAdvice);
    expect(provider.generate).toHaveBeenCalledTimes(1);

    expect(await prisma.request.count()).toBe(beforeCount);
    await expect(prisma.request.findUniqueOrThrow({ where: { id: existingRequest.id } }))
      .resolves.toMatchObject({ status: beforeRequest.status, title: beforeRequest.title });
  });

  it('returns 401 for a missing actor before provider contact', async () => {
    await request(app.getHttpServer())
      .post('/api/requests/intake-advice')
      .send({ reportedIssue: 'I need help.' })
      .expect(401);

    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('returns 401 for an unknown actor before provider contact', async () => {
    await request(app.getHttpServer())
      .post('/api/requests/intake-advice')
      .set('X-Actor-Id', 'unknown-actor')
      .send({ reportedIssue: 'I need help.' })
      .expect(401);

    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('returns 403 for a non-Employee before provider contact', async () => {
    await request(app.getHttpServer())
      .post('/api/requests/intake-advice')
      .set('X-Actor-Id', 'it-staff-001')
      .send({ reportedIssue: 'I need help.' })
      .expect(403);

    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('returns 400 for blank reportedIssue without contacting the provider', async () => {
    await request(app.getHttpServer())
      .post('/api/requests/intake-advice')
      .set('X-Actor-Id', 'demo-employee')
      .send({ reportedIssue: '' })
      .expect(400);

    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('maps failed advice to stable 502 without mutating request state', async () => {
    const existingRequest = await createSubmittedRequest();
    const beforeCount = await prisma.request.count();
    const beforeRequest = await prisma.request.findUniqueOrThrow({ where: { id: existingRequest.id } });
    provider.generate.mockRejectedValue(new BadGatewayException(INTAKE_ADVICE_FAILURE_MESSAGE));

    const response = await request(app.getHttpServer())
      .post('/api/requests/intake-advice')
      .set('X-Actor-Id', 'demo-employee')
      .send({ reportedIssue: 'I need VPN access.' })
      .expect(502);

    expect(response.body.message).toBe(INTAKE_ADVICE_FAILURE_MESSAGE);
    expect(await prisma.request.count()).toBe(beforeCount);
    await expect(prisma.request.findUniqueOrThrow({ where: { id: existingRequest.id } }))
      .resolves.toMatchObject({ status: beforeRequest.status, title: beforeRequest.title });
  });
});