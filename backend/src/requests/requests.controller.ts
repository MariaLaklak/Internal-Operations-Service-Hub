import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

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
