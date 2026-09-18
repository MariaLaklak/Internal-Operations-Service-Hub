import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestIntakeAdviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reportedIssue!: string;
}