import { IsBoolean, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SUPPORTED_DEPARTMENTS } from '../request.constants';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsIn(SUPPORTED_DEPARTMENTS)
  department!: (typeof SUPPORTED_DEPARTMENTS)[number];

  @IsBoolean()
  requiresApproval!: boolean;
}
