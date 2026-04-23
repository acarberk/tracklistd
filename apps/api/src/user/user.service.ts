import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserInput {
  email: string;
  username: string;
  displayName: string;
  passwordHash?: string;
  googleId?: string;
  appleId?: string;
  emailVerified?: boolean;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  findByAppleId(appleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { appleId } });
  }

  create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        googleId: input.googleId,
        appleId: input.appleId,
        emailVerified: input.emailVerified ?? false,
      },
    });
  }

  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  updatePasswordHash(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
