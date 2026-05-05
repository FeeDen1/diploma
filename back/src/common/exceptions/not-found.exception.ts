import { DomainException } from './domain.exception';

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} с id ${id} не найден`);
  }
}
