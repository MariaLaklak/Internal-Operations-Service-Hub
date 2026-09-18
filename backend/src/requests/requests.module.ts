import { Module } from '@nestjs/common';
import { RequestIntakeProvider } from './request-intake.provider';
import { RequestIntakeService } from './request-intake.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService, RequestIntakeService, RequestIntakeProvider]
})
export class RequestsModule {}
