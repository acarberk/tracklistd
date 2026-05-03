import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'berk@example.com', format: 'email' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset email link' })
  token!: string;

  @ApiProperty({ example: 'new-strong-password', minLength: 8, maxLength: 128 })
  password!: string;
}
