import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

/**
 * Глобальный foreground-handler: показываем баннер даже когда приложение
 * открыто (по умолчанию iOS этого не делает).
 */
Notifications.setNotificationHandler({
  handleNotification: () => Promise.resolve({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface PushData {
  type?: 'submission-status' | 'submission-new';
  submissionId?: string;
  taskId?: string;
}

/**
 * Подписка на тап по push-уведомлению. Роутим по `data.type`:
 *  - submission-status → у студента в «Мои сдачи»
 *  - submission-new → у куратора во вкладке «Куратор»
 */
export function useNotificationRouting(): void {
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as PushData;
        switch (data?.type) {
          case 'submission-status':
            router.push('/my-submissions');
            break;
          case 'submission-new':
            router.push('/(tabs)/adapter');
            break;
          default:
            break;
        }
      });

    return () => subscription.remove();
  }, []);
}
