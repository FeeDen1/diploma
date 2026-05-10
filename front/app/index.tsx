import { Redirect } from 'expo-router';
import { useBootstrapTarget } from './_layout';

/**
 * IndexScreen — единственный экран который монтируется первым после того, как
 * RootLayout определил target. Просто читает уже готовое решение из контекста и
 * декларативно перенаправляет.
 *
 * До того как target вычислен, RootLayout вообще не рендерит Stack (см. там),
 * поэтому этот компонент никогда не успевает «показать пустой кадр» на пути
 * между splash и целевым экраном.
 */
export default function IndexScreen(): React.ReactElement {
  const target = useBootstrapTarget();
  return <Redirect href={target} />;
}
