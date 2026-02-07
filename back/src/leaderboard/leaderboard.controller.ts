import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
