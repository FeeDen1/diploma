import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '../../shared/api';
import {
  rewardsApi,
  type CreateRewardDto,
  type ReadRedemptionDto,
} from '../../shared/api/rewards';
import { toRewardDomain, toRewardOrderDomain } from './mappers';
import type { Reward, RewardOrder } from './types';

export function useRewards(): UseQueryResult<Reward[]> {
  return useQuery({
    queryKey: queryKeys.rewards.all,
    queryFn: () => rewardsApi.list(),
    select: (dtos) => dtos.map(toRewardDomain),
  });
}

export function useMyRewardOrders(): UseQueryResult<RewardOrder[]> {
  return useQuery({
    queryKey: queryKeys.rewards.myOrders,
    queryFn: () => rewardsApi.myRedemptions(),
    select: (dtos) => dtos.map(toRewardOrderDomain),
  });
}

export function useCreateReward(): UseMutationResult<
  Reward,
  unknown,
  CreateRewardDto
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto) => rewardsApi.create(dto).then(toRewardDomain),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rewards.all });
    },
  });
}

export function useArchiveReward(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => rewardsApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rewards.all });
    },
  });
}

export function useRedeemReward(): UseMutationResult<
  ReadRedemptionDto,
  unknown,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => rewardsApi.redeem(id),
    onSuccess: () => {
      // Списали баллы → обновится баланс на /users/me; добавился заказ → пере-фетчим список
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      qc.invalidateQueries({ queryKey: queryKeys.rewards.myOrders });
      qc.invalidateQueries({ queryKey: queryKeys.rewards.all });
    },
  });
}
