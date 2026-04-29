import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { type ZodType } from 'zod';

export class ZodValidationPipe<TInput = unknown, TOutput = unknown> implements PipeTransform<
  TInput,
  TOutput
> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: TInput): TOutput {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Request body failed validation',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
