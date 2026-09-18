import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestIntakeAdviceDto } from './dto/request-intake-advice.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestIntakeAdviceResponse } from './request-intake.provider';
import { RequestIntakeService } from './request-intake.service';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly requestIntakeService: RequestIntakeService
  ) {}

  @Post('intake-advice')
  @HttpCode(HttpStatus.OK)
  intakeAdvice(
    @Headers('x-actor-id') actorAlias: string | undefined,
    @Body() requestIntakeAdviceDto: RequestIntakeAdviceDto
  ): Promise<RequestIntakeAdviceResponse> {
    return this.requestIntakeService.createAdvice(actorAlias, requestIntakeAdviceDto);
  }

  @Post()
  create(@Body() createRequestDto: CreateRequestDto): Promise<RequestResponseDto> {
    return this.requestsService.create(createRequestDto);
  }

  @Get()
  findAll(): Promise<RequestResponseDto[]> {
    return this.requestsService.findAll();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Headers('x-actor-id') actorAlias: string | undefined,
    @Body() updateRequestStatusDto: UpdateRequestStatusDto
  ): Promise<RequestResponseDto> {
    return this.requestsService.updateStatus(id, actorAlias, updateRequestStatusDto);
  }
}
