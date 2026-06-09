import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketListing, MarketListingSchema } from './schemas/market-listing.schema';
import { Isopod, IsopodSchema } from '../isopods/schemas/isopod.schema';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketListing.name, schema: MarketListingSchema },
      { name: Isopod.name, schema: IsopodSchema },
    ]),
    GameModule,
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
