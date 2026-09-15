import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { removeTemporaryDatabase } from './test-database';

describe('Requests API', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

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

  afterAll(async () => {
    await app.close();
    removeTemporaryDatabase();
  });

  it('creates a request with backend-owned requester and Submitted status', async () => {
    const title = `VPN access regression ${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/api/requests')
      .send({
        title,
        description: 'I need VPN access for remote work.',
        department: 'IT',
        requiresApproval: false
      })
      .expect(201);

    expect(response.body).toMatchObject({
      title,
      department: 'IT',
      requester: 'Demo Employee',
      requiresApproval: false,
      status: 'Submitted'
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    expect(response.body.requesterId).toBeUndefined();

    const listResponse = await request(app.getHttpServer()).get('/api/requests').expect(200);
    expect(listResponse.body).toEqual(expect.arrayContaining([response.body]));
  });

  it('rejects invalid input without saving a request', async () => {
    const beforeResponse = await request(app.getHttpServer()).get('/api/requests').expect(200);
    const beforeCount = beforeResponse.body.length;

    await request(app.getHttpServer())
      .post('/api/requests')
      .send({
        title: '',
        description: 'Missing title should fail.',
        department: 'Legal',
        requiresApproval: false
      })
      .expect(400);

    const afterResponse = await request(app.getHttpServer()).get('/api/requests').expect(200);
    const afterCount = afterResponse.body.length;
    expect(afterCount).toBe(beforeCount);
  });
});
