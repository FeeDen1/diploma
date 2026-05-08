import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from './Badge';

describe('<Badge />', () => {
  it('рендерит переданный текст', () => {
    const { getByText } = render(<Badge text="Доступно" />);
    expect(getByText('Доступно')).toBeTruthy();
  });

  it('применяет success-вариант (зелёная палитра)', () => {
    const { getByText } = render(<Badge text="OK" variant="success" />);
    const node = getByText('OK');
    // У текстового узла должен быть text-green-700; ищем через className
    expect(String(node.props.className)).toContain('text-green-700');
  });

  it('применяет error-вариант (красная палитра)', () => {
    const { getByText } = render(<Badge text="Ошибка" variant="error" />);
    expect(String(getByText('Ошибка').props.className)).toContain(
      'text-red-700',
    );
  });

  it('по умолчанию default-вариант', () => {
    const { getByText } = render(<Badge text="x" />);
    expect(String(getByText('x').props.className)).toContain('text-gray-700');
  });
});
