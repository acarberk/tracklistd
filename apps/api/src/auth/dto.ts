import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'berk@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'super-strong-password', minLength: 8, maxLength: 128 })
  password!: string;

  @ApiProperty({ example: 'acarberk', minLength: 3, maxLength: 24 })
  username!: string;

  @ApiProperty({ example: 'Berk Acar', minLength: 1, maxLength: 50 })
  displayName!: string;

  @ApiProperty({ required: false })
  turnstileToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'berk@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'super-strong-password' })
  password!: string;

  @ApiProperty({ required: false })
  turnstileToken?: string;
}

export class PublicUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'berk@example.com' })
  email!: string;

  @ApiProperty({ example: 'acarberk' })
  username!: string;

  @ApiProperty({ example: 'Berk Acar' })
  displayName!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: false })
  emailVerified!: boolean;
}

export class RegisterResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'berk@example.com' })
  email!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Short-lived access token (15 minutes)' })
  accessToken!: string;

  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken!: string;
}
