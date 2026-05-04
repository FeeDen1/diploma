import { DomainException } from './domain.exception';

export class ForbiddenException extends DomainException {
  constructor(message = 'Нет доступа') {
    super(message);
  }
}
