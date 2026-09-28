import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  async readiness(@Res({ passthrough: true }) response: Response) {
    const result = await this.healthService.readiness();
    if (result.status === 'not_ready') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }

  @Get()
  async overall(@Res({ passthrough: true }) response: Response) {
    const result = await this.healthService.overall();
    if (result.status === 'unavailable') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}