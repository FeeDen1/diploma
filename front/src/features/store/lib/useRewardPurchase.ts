import { useConfirm, useToast } from '@shared/ui';
import { extractErrorMessage } from '@shared/api';
import { useMe } from '@entities/user';
import { useRedeemReward, type Reward } from '@entities/reward';

interface UseRewardPurchaseResult {
  buy: (reward: Reward) => Promise<void>;
  isPending: boolean;
}

/**
 * Инкапсулирует UX покупки: подтверждение через диалог, проверку баланса
 * на стороне фронта (для немедленной обратной связи), вызов мутации и тосты.
 */
export function useRewardPurchase(): UseRewardPurchaseResult {
  const { data: me } = useMe();
  const confirm = useConfirm();
  const toast = useToast();
  const redeem = useRedeemReward();

  const buy = async (reward: Reward): Promise<void> => {
    if (!me) return;

    if (me.availablePoints < reward.price) {
      toast.show(
        `Не хватает баллов: доступно ${me.availablePoints}, нужно ${reward.price}`,
        'error',
      );
      return;
    }

    const ok = await confirm({
      title: `Купить «${reward.title}»?`,
      message: `Спишется ${reward.price} баллов. Доступно сейчас: ${me.availablePoints}.`,
      confirmText: 'Купить',
    });
    if (!ok) return;

    redeem.mutate(reward.id, {
      onSuccess: () => toast.show('Заказ оформлен', 'success'),
      onError: (err) =>
        toast.show(extractErrorMessage(err, 'Не удалось оформить'), 'error'),
    });
  };

  return { buy, isPending: redeem.isPending };
}
