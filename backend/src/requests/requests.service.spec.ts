import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestsService } from './requests.service';

describe('RequestsService.updateStatus', () => {
  it('rejects Demo Employee status updates without calling request.update', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'employee-001',
          name: 'Demo Employee',
          email: 'demo.employee@example.com',
          role: 'Employee',
          department: null
        })
      },
      request: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'request-001',
          title: 'VPN access request',
          description: 'I need VPN access for remote work.',
          requiresApproval: false,
          status: 'Submitted',
          createdAt: new Date('2026-09-15T00:00:00.000Z'),
          departmentId: 'department-it',
          department: { name: 'IT' },
          requester: { name: 'Demo Employee' }
        }),
        update: jest.fn()
      }
    } as unknown as PrismaService;
    const service = new RequestsService(prisma);

    await expect(
      service.updateStatus('request-001', 'demo-employee', { status: 'In Progress' })
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.request.update).not.toHaveBeenCalled();
  });
});