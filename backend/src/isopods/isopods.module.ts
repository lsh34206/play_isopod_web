import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IsopodsController } from './isopods.controller';
import { IsopodsService } from './isopods.service';
import { Isopod, IsopodSchema } from './schemas/isopod.schema';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Isopod.name, schema: IsopodSchema }]),
    forwardRef(() => GameModule),
  ],
  controllers: [IsopodsController],
  providers: [IsopodsService],
  exports: [IsopodsService],
})
export class IsopodsModule {}
