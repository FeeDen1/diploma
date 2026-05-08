import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';
import type { IconProps } from './icons';

function FakeIcon(_: IconProps): null {
  return null;
}

describe('<EmptyState />', () => {
  it('рендерит title и description', () => {
    const { getByText } = render(
      <EmptyState
        Icon={FakeIcon}
        title="Пусто"
        description="Тут пока ничего нет"
      />,
    );
    expect(getByText('Пусто')).toBeTruthy();
    expect(getByText('Тут пока ничего нет')).toBeTruthy();
  });

  it('description опционален', () => {
    const { getByText, queryByText } = render(
      <EmptyState Icon={FakeIcon} title="Пусто" />,
    );
    expect(getByText('Пусто')).toBeTruthy();
    expect(queryByText('Тут пока ничего нет')).toBeNull();
  });
});
