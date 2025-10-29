import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { EntityNotFoundException } from '../exceptions/not-found.exception';
import { EntityAlreadyExistsException } from '../exceptions/conflict.exception';
import { DomainValidationException } from '../exceptions/validation.exception';
import { ValidationFailedException } from '../exceptions/validation-failed.exception';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import { ForbiddenException } from '../exceptions/forbidden.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private static readonly STATUS_MAP = new Map<
    new (...args: never[]) => DomainException,
    HttpStatus
  >([
    [EntityNotFoundException, HttpStatus.NOT_FOUND],
    [EntityAlreadyExistsException, HttpStatus.CONFLICT],
    [ValidationFailedException, HttpStatus.BAD_REQUEST],
    [DomainValidationException, HttpStatus.BAD_REQUEST],
    [UnauthorizedException, HttpStatus.UNAUTHORIZED],
    [ForbiddenException, HttpStatus.FORBIDDEN],
  ]);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.resolveStatus(exception);

    const body: Record<string, unknown> = {
      statusCode: status,
      error: exception.name,
      message: exception.message,
    };

    if (exception instanceof ValidationFailedException) {
      body.errors = exception.errors;
    }

    response.status(status).json(body);
  }

  private resolveStatus(exception: DomainException): HttpStatus {
    for (const [ExceptionClass, status] of DomainExceptionFilter.STATUS_MAP) {
      if (exception instanceof ExceptionClass) {
        return status;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
