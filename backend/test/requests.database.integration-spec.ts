import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { RequestsService } from '../src/requests/requests.service';
import { removeTemporaryDatabase } from './test-database';

describe('RequestsService SQLite persistence', () => {
  let prisma: PrismaService;
  let requestsService: RequestsService;
  let itDepartmentId: string;
  let employeeId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    const itDepartment = await prisma.department.create({ data: { name: 'IT' } });
    itDepartmentId = itDepartment.id;

    await prisma.user.create({
      data: {
        name: 'IT Department Staff',
        email: 'it.department.staff@example.com',
        role: 'Department Staff',
        departmentId: itDepartmentId
      }
    });

    const employee = await prisma.user.create({
      data: {
        name: 'Demo Employee',
        email: 'demo.employee@example.com',
        role: 'Employee'
      }
    });
    employeeId = employee.id;
    requestsService = new RequestsService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    removeTemporaryDatabase();
  });

  async function createSubmittedRequest() {
    return prisma.request.create({
      data: {
        title: 'VPN access request',
        description: 'I need VPN access for remote work.',
        requiresApproval: false,
        status: 'Submitted',
        requesterId: employeeId,
        departmentId: itDepartmentId
      }
    });
  }

  it('persists an IT Department Staff status update in SQLite', async () => {
    const request = await createSubmittedRequest();

    await requestsService.updateStatus(request.id, 'it-staff-001', { status: 'In Progress' });

    const storedRequest = await prisma.request.findUnique({ where: { id: request.id } });
    expect(storedRequest?.status).toBe('In Progress');
  });

  it('does not mutate status or request count for a Demo Employee update', async () => {
    const request = await createSubmittedRequest();
    const beforeCount = await prisma.request.count();
    const beforeRequest = await prisma.request.findUnique({ where: { id: request.id } });

    await expect(
      requestsService.updateStatus(request.id, 'demo-employee', { status: 'In Progress' })
    ).rejects.toThrow(ForbiddenException);

    const afterRequest = await prisma.request.findUnique({ where: { id: request.id } });
    const afterCount = await prisma.request.count();
    expect(beforeRequest?.status).toBe('Submitted');
    expect(afterRequest?.status).toBe('Submitted');
    expect(afterCount).toBe(beforeCount);
  });
});