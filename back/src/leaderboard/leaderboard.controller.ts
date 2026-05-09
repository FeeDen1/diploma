import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { LeaderboardResponseDto } from './dto/read-leaderboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Лидерборд — самый «горячий» read-эндпоинт: список заданий читается N раз
 * на одного юзера, лидерборд — один раз при открытии вкладки, но залпом
 * от всех. Кеш на 60 сек срезает 90% запросов в Postgres при пиковой
 * нагрузке во время защиты диплома.
 *
 * CacheInterceptor использует request URL (включая query) как ключ,
 * поэтому фильтры direction/groupId/sort кешируются раздельно.
 */
@ApiTags('Лидерборд')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @ApiOperation({
    summary:
      'Лидерборд по рейтингу. Опциональные фильтры — direction и groupId',
  })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @Get()
  async get(
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardService.getLeaderboard({
      direction: query.direction,
      groupId: query.groupId,
      sort: query.sort ?? 'rating-desc',
      limit: query.limit ?? LeaderboardService.DEFAULT_LIMIT,
      offset: query.offset ?? 0,
    });
  }
}
