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
import { IsNumber, IsString, Min, IsIn } from 'class-validator';

class BuyFoodDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}

class BuyItemsDto {
  @IsString()
  @IsIn(['moistureSpray', 'heater', 'cooler'])
  itemType: 'moistureSpray' | 'heater' | 'cooler';

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

  @Post('buy-food')
  @HttpCode(HttpStatus.OK)
  async buyFood(@Request() req, @Body() dto: BuyFoodDto) {
    return this.gameService.buyFood(req.user.userId, dto.quantity);
  }

  @Post('buy-items')
  @HttpCode(HttpStatus.OK)
  async buyItems(@Request() req, @Body() dto: BuyItemsDto) {
    return this.gameService.buyItems(req.user.userId, dto.itemType, dto.quantity);
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
