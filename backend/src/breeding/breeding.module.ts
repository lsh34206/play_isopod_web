import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BreedingController } from './breeding.controller';
import { BreedingService } from './breeding.service';
import { Breeding, BreedingSchema } from './schemas/breeding.schema';
import { Isopod, IsopodSchema } from '../isopods/schemas/isopod.schema';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Breeding.name, schema: BreedingSchema },
      { name: Isopod.name, schema: IsopodSchema },
    ]),
    GameModule,
  ],
  controllers: [BreedingController],
  providers: [BreedingService],
  exports: [BreedingService],
})
export class BreedingModule {}
