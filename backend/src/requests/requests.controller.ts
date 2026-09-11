import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestResponseDto } from './dto/request-response.dto';
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
}
