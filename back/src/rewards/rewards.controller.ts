import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TokenPayload } from '../auth/interfaces/token-payload.interface';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { ListRewardsQueryDto } from './dto/list-rewards-query.dto';
import { ReadRewardDto } from './dto/read-reward.dto';
import { ReadRedemptionDto } from './dto/read-redemption.dto';

@ApiTags('Магазин')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @ApiOperation({
    summary:
      'Список лотов. includeArchived=true (только admin) добавляет архивные',
  })
  @ApiResponse({ status: 200, type: [ReadRewardDto] })
  @Get()
  async list(
    @CurrentUser() user: TokenPayload,
    @Query() query: ListRewardsQueryDto,
  ): Promise<ReadRewardDto[]> {
    const rewards = await this.rewardsService.list(
      user,
      query.includeArchived === true,
    );
    return rewards.map((reward) =>
      ReadRewardDto.from(reward, this.rewardsService.getImageUrl(reward)),
    );
  }

  @ApiOperation({ summary: 'Создать лот (admin)' })
  @ApiResponse({ status: 201, type: ReadRewardDto })
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  async create(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateRewardDto,
  ): Promise<ReadRewardDto> {
    const reward = await this.rewardsService.createReward(user.id, dto);
    return ReadRewardDto.from(reward, this.rewardsService.getImageUrl(reward));
  }

  @ApiOperation({ summary: 'Обновить лот (admin)' })
  @ApiResponse({ status: 200, type: ReadRewardDto })
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  async update(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardDto,
  ): Promise<ReadRewardDto> {
    const reward = await this.rewardsService.updateReward(user.id, id, dto);
    return ReadRewardDto.from(reward, this.rewardsService.getImageUrl(reward));
  }

  @ApiOperation({ summary: 'Вернуть лот из архива в витрину (admin)' })
  @ApiResponse({ status: 200, type: ReadRewardDto })
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id/restore')
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReadRewardDto> {
    const reward = await this.rewardsService.unarchiveReward(id);
    return ReadRewardDto.from(reward, this.rewardsService.getImageUrl(reward));
  }

  @ApiOperation({ summary: 'Удалить лот (admin, soft — уходит в архив)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.rewardsService.archiveReward(id);
  }

  @ApiOperation({ summary: 'Купить лот за баллы' })
  @ApiResponse({ status: 201, type: ReadRedemptionDto })
  @Post(':id/redeem')
  async redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadRedemptionDto> {
    const redemption = await this.rewardsService.redeem(user.id, id);
    return ReadRedemptionDto.from(
      redemption,
      this.rewardsService.getRedemptionImageUrl(redemption),
    );
  }

  @ApiOperation({ summary: 'Мои заказы' })
  @ApiResponse({ status: 200, type: [ReadRedemptionDto] })
  @Get('redemptions/my')
  async myRedemptions(
    @CurrentUser() user: TokenPayload,
  ): Promise<ReadRedemptionDto[]> {
    const redemptions = await this.rewardsService.listMyRedemptions(user.id);
    return redemptions.map((redemption) =>
      ReadRedemptionDto.from(
        redemption,
        this.rewardsService.getRedemptionImageUrl(redemption),
      ),
    );
  }
}
