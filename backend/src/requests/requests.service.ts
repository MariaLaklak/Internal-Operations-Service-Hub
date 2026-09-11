import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACTOR_EMAIL_BY_ALIAS,
  DEPARTMENT_STAFF_ROLE,
  DEMO_EMPLOYEE_EMAIL,
  IN_PROGRESS_STATUS,
  SUBMITTED_STATUS
} from './request.constants';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';

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

  async updateStatus(
    requestId: string,
    actorAlias: string | undefined,
    updateRequestStatusDto: UpdateRequestStatusDto
  ): Promise<RequestResponseDto> {
    const actorEmail = actorAlias
      ? ACTOR_EMAIL_BY_ALIAS[actorAlias as keyof typeof ACTOR_EMAIL_BY_ALIAS]
      : undefined;

    if (!actorEmail) {
      throw new UnauthorizedException('A valid actor alias is required.');
    }

    const actor = await this.prisma.user.findUnique({
      where: { email: actorEmail },
      include: { department: true }
    });

    if (!actor) {
      throw new UnauthorizedException('The actor was not found.');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { department: true, requester: true }
    });

    if (!request) {
      throw new NotFoundException('The request was not found.');
    }

    if (actor.role !== DEPARTMENT_STAFF_ROLE) {
      throw new ForbiddenException('Only Department Staff can update request status.');
    }

    if (!actor.department || actor.department.id !== request.departmentId) {
      throw new ForbiddenException('Department Staff can only update requests in their department.');
    }

    if (request.status !== SUBMITTED_STATUS || updateRequestStatusDto.status !== IN_PROGRESS_STATUS) {
      throw new ConflictException('The requested status transition is not allowed.');
    }

    const updatedRequest = await this.prisma.request.update({
      where: { id: requestId },
      data: { status: updateRequestStatusDto.status },
      include: { department: true, requester: true }
    });

    return this.toResponse(updatedRequest);
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
