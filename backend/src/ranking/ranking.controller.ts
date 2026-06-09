import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  async getTopRanking() {
    return this.rankingService.getTopRanking(20);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyRank(@Request() req) {
    return this.rankingService.getMyRank(req.user.userId);
  }
}
