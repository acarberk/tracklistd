import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ example: 'berk@example.com', format: 'email' })
  email!: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({ example: true })
  verified!: boolean;
}
