import { IsIn } from 'class-validator';
import { SUPPORTED_STATUSES } from '../request.constants';

export class UpdateRequestStatusDto {
  @IsIn(SUPPORTED_STATUSES)
  status!: (typeof SUPPORTED_STATUSES)[number];
}
