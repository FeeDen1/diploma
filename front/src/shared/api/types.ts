/**
 * Унифицированный формат ошибок, который отдаёт DomainExceptionFilter на бэке.
 * Используется только axios-клиентом и при показе ошибок в UI.
 */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}
