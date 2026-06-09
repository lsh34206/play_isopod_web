import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, IsMongoId, IsString, Min, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class ListIsopodDto {
  @IsString()
  @IsMongoId()
  isopodId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  price: number;
}

class GetListingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

@Controller('market')
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('listings')
  async getListings(@Query() query: GetListingsQueryDto) {
    return this.marketService.getActiveListings(query.page || 1, query.limit || 20);
  }

  @Get('my-listings')
  async getMyListings(@Request() req) {
    return this.marketService.getMyListings(req.user.userId);
  }

  @Post('list')
  @HttpCode(HttpStatus.CREATED)
  async listIsopod(@Request() req, @Body() dto: ListIsopodDto) {
    return this.marketService.listIsopod(req.user.userId, dto.isopodId, dto.price);
  }

  @Post('buy/:listingId')
  @HttpCode(HttpStatus.OK)
  async buyListing(@Request() req, @Param('listingId') listingId: string) {
    return this.marketService.buyListing(req.user.userId, listingId);
  }

  @Delete('cancel/:listingId')
  @HttpCode(HttpStatus.OK)
  async cancelListing(@Request() req, @Param('listingId') listingId: string) {
    return this.marketService.cancelListing(req.user.userId, listingId);
  }
}
