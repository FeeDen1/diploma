import { DomainException } from './domain.exception';

export class ValidationFailedException extends DomainException {
  constructor(public readonly errors: Record<string, string[]>) {
    super('Ошибка валидации');
  }
}