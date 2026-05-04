import { DomainException } from './domain.exception';

export class UnauthorizedException extends DomainException {
  constructor(message = 'Пользователь не авторизован') {
    super(message);
  }
}
