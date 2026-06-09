import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IsopodsModule } from './isopods/isopods.module';
import { GameModule } from './game/game.module';
import { RankingModule } from './ranking/ranking.module';
import { BreedingModule } from './breeding/breeding.module';
import { MarketModule } from './market/market.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/isopod_game',
    ),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    IsopodsModule,
    GameModule,
    RankingModule,
    BreedingModule,
    MarketModule,
  ],
})
export class AppModule {}
