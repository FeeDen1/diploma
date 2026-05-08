import { AxiosError, AxiosHeaders } from 'axios';
import { extractErrorMessage, extractFieldErrors } from './client';

function makeAxiosError(data: unknown, status = 400, message = ''): AxiosError {
  const err = new AxiosError(message);
  err.response = {
    data,
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('extractErrorMessage', () => {
  it('берёт message из response.data', () => {
    const err = makeAxiosError({ message: 'Неверный код' });
    expect(extractErrorMessage(err)).toBe('Неверный код');
  });

  it('берёт error.message если data пустой, а у axios есть message', () => {
    // Реальная цепочка: data?.message ?? error.message ?? fallback
    // Поскольку используется ??, пустая строка пройдёт дальше только при undefined.
    const err = makeAxiosError({}, 400, 'Network Error');
    expect(extractErrorMessage(err, 'fb')).toBe('Network Error');
  });

  it('Error → возвращает .message', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('Прочее → fallback', () => {
    expect(extractErrorMessage('какая-то строка', 'fb')).toBe('fb');
  });
});

describe('extractFieldErrors', () => {
  it('возвращает errors из ApiErrorBody', () => {
    const err = makeAxiosError({
      message: 'Validation',
      errors: { email: ['Неверный формат'] },
    });
    expect(extractFieldErrors(err)).toEqual({ email: ['Неверный формат'] });
  });

  it('null если нет errors', () => {
    const err = makeAxiosError({ message: 'plain' });
    expect(extractFieldErrors(err)).toBeNull();
  });

  it('null для не-Axios ошибок', () => {
    expect(extractFieldErrors(new Error('boom'))).toBeNull();
  });
});
