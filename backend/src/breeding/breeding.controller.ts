import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BreedingService } from './breeding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsMongoId } from 'class-validator';

class StartBreedingDto {
  @IsString()
  @IsMongoId()
  parent1Id: string;

  @IsString()
  @IsMongoId()
  parent2Id: string;
}

@Controller('breeding')
@UseGuards(JwtAuthGuard)
export class BreedingController {
  constructor(private readonly breedingService: BreedingService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startBreeding(@Request() req, @Body() dto: StartBreedingDto) {
    return this.breedingService.startBreeding(
      req.user.userId,
      dto.parent1Id,
      dto.parent2Id,
    );
  }

  @Get('active')
  async getActiveBreeding(@Request() req) {
    return this.breedingService.getActiveBreeding(req.user.userId);
  }

  @Post('collect')
  @HttpCode(HttpStatus.OK)
  async collectOffspring(@Request() req) {
    return this.breedingService.collectOffspring(req.user.userId);
  }
}
