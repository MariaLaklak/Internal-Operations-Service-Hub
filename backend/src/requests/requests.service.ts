import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_EMPLOYEE_EMAIL, SUBMITTED_STATUS } from './request.constants';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRequestDto: CreateRequestDto): Promise<RequestResponseDto> {
    const employee = await this.prisma.user.findUnique({
      where: { email: DEMO_EMPLOYEE_EMAIL }
    });

    if (!employee) {
      throw new NotFoundException('The seeded demo employee was not found.');
    }

    const department = await this.prisma.department.findUnique({
      where: { name: createRequestDto.department }
    });

    if (!department) {
      throw new NotFoundException('The selected department was not found.');
    }

    const request = await this.prisma.request.create({
      data: {
        title: createRequestDto.title,
        description: createRequestDto.description,
        requiresApproval: createRequestDto.requiresApproval,
        requesterId: employee.id,
        departmentId: department.id,
        status: SUBMITTED_STATUS
      },
      include: { department: true, requester: true }
    });

    return this.toResponse(request);
  }

  async findAll(): Promise<RequestResponseDto[]> {
    const employee = await this.prisma.user.findUnique({
      where: { email: DEMO_EMPLOYEE_EMAIL }
    });

    if (!employee) {
      throw new NotFoundException('The seeded demo employee was not found.');
    }

    const requests = await this.prisma.request.findMany({
      where: { requesterId: employee.id },
      include: { department: true, requester: true },
      orderBy: { createdAt: 'desc' }
    });

    return requests.map((request) => this.toResponse(request));
  }

  private toResponse(request: {
    id: string;
    title: string;
    description: string;
    requiresApproval: boolean;
    status: string;
    createdAt: Date;
    department: { name: string };
    requester: { name: string };
  }): RequestResponseDto {
    return {
      id: request.id,
      title: request.title,
      description: request.description,
      department: request.department.name,
      requester: request.requester.name,
      requiresApproval: request.requiresApproval,
      status: request.status,
      createdAt: request.createdAt.toISOString()
    };
  }
}
