import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, IsString, Min } from 'class-validator';

class ShopBuyDto {
  @IsString()
  itemType: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('state')
  async getState(@Request() req) {
    return this.gameService.getGameState(req.user.userId);
  }

  @Post('shop/buy')
  @HttpCode(HttpStatus.OK)
  async shopBuy(@Request() req, @Body() dto: ShopBuyDto) {
    return this.gameService.shopBuy(req.user.userId, dto.itemType, dto.quantity);
  }

  @Post('expand-slots')
  @HttpCode(HttpStatus.OK)
  async expandSlots(@Request() req) {
    return this.gameService.expandSlots(req.user.userId);
  }

  @Post('collect-idle')
  @HttpCode(HttpStatus.OK)
  async collectIdle(@Request() req) {
    return this.gameService.collectIdleEarnings(req.user.userId);
  }
}
