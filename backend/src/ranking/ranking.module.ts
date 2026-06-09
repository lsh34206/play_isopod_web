import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { GameState, GameStateSchema } from '../game/schemas/game-state.schema';
import { Isopod, IsopodSchema } from '../isopods/schemas/isopod.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameState.name, schema: GameStateSchema },
      { name: Isopod.name, schema: IsopodSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
