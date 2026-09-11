import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a request with backend-owned requester and Submitted status', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/requests')
      .send({
        title: 'VPN access request',
        description: 'I need VPN access for remote work.',
        department: 'IT',
        requiresApproval: false
      })
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'VPN access request',
      department: 'IT',
      requester: 'Demo Employee',
      requiresApproval: false,
      status: 'Submitted'
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    expect(response.body.requesterId).toBeUndefined();
  });

  it('rejects invalid input without saving a request', async () => {
    const beforeCount = await prisma.request.count();

    await request(app.getHttpServer())
      .post('/api/requests')
      .send({
        title: '',
        description: 'Missing title should fail.',
        department: 'Legal',
        requiresApproval: false
      })
      .expect(400);

    const afterCount = await prisma.request.count();
    expect(afterCount).toBe(beforeCount);
  });
});
