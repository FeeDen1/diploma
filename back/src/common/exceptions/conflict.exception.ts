import { DomainException } from './domain.exception';

export class EntityAlreadyExistsException extends DomainException {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} с ${field} "${value}" уже существует`);
  }
}
