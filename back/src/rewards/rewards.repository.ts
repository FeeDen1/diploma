import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, RedemptionStatus } from '../../generated/prisma/client';

const REWARD_INCLUDE = {
  imageFile: true,
} satisfies Prisma.RewardItemInclude;

const REDEMPTION_INCLUDE = {
  rewardItem: { include: { imageFile: true } },
} satisfies Prisma.RewardRedemptionInclude;

export type RewardItemWithImage = Prisma.RewardItemGetPayload<{
  include: typeof REWARD_INCLUDE;
}>;

export type RewardRedemptionWithItem = Prisma.RewardRedemptionGetPayload<{
  include: typeof REDEMPTION_INCLUDE;
}>;

@Injectable()
export class RewardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Список лотов. includeArchived=false — только активные (витрина магазина),
   * true — активные + архивные (админский список с фильтром по scope).
   */
  async findMany(includeArchived: boolean): Promise<RewardItemWithImage[]> {
    return this.prisma.rewardItem.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: REWARD_INCLUDE,
    });
  }

  async findById(id: string): Promise<RewardItemWithImage | null> {
    return this.prisma.rewardItem.findUnique({
      where: { id },
      include: REWARD_INCLUDE,
    });
  }

  async create(input: {
    title: string;
    price: number;
    imageFileId: string | null;
  }): Promise<RewardItemWithImage> {
    return this.prisma.rewardItem.create({
      data: {
        title: input.title,
        price: input.price,
        imageFileId: input.imageFileId,
      },
      include: REWARD_INCLUDE,
    });
  }

  async update(
    id: string,
    data: { title?: string; price?: number; imageFileId?: string | null },
  ): Promise<RewardItemWithImage> {
    return this.prisma.rewardItem.update({
      where: { id },
      data,
      include: REWARD_INCLUDE,
    });
  }

  async archive(id: string): Promise<void> {
    await this.prisma.rewardItem.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  /** Возврат лота из архива обратно в витрину. */
  async unarchive(id: string): Promise<RewardItemWithImage> {
    return this.prisma.rewardItem.update({
      where: { id },
      data: { archivedAt: null },
      include: REWARD_INCLUDE,
    });
  }

  async findMyRedemptions(userId: string): Promise<RewardRedemptionWithItem[]> {
    return this.prisma.rewardRedemption.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: REDEMPTION_INCLUDE,
    });
  }

  /**
   * Атомарное оформление заказа: проверка баланса, создание redemption
   * со снимком title/price, инкремент User.spentPoints. Всё в одной
   * транзакции, чтобы исключить гонку между параллельными покупками.
   */
  async redeem(input: {
    userId: string;
    rewardItemId: string;
    itemTitle: string;
    itemPrice: number;
  }): Promise<RewardRedemptionWithItem> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { ratingTotal: true, spentPoints: true },
      });

      const available = user.ratingTotal - user.spentPoints;
      if (available < input.itemPrice) {
        throw new InsufficientFundsError(available, input.itemPrice);
      }

      const created = await tx.rewardRedemption.create({
        data: {
          userId: input.userId,
          rewardItemId: input.rewardItemId,
          itemTitle: input.itemTitle,
          itemPrice: input.itemPrice,
          status: RedemptionStatus.pending,
        },
        include: REDEMPTION_INCLUDE,
      });

      await tx.user.update({
        where: { id: input.userId },
        data: { spentPoints: { increment: input.itemPrice } },
      });

      return created;
    });
  }
}

/**
 * Бросается изнутри транзакции, чтобы service слой мог отдать корректный
 * 400 без утечки внутренних деталей в логи.
 */
export class InsufficientFundsError extends Error {
  constructor(
    public readonly available: number,
    public readonly required: number,
  ) {
    super(`Недостаточно баллов: доступно ${available}, нужно ${required}`);
    this.name = 'InsufficientFundsError';
  }
}
