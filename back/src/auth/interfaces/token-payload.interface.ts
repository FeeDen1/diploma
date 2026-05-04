import { UserRole } from '../../../generated/prisma/client';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}
