import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BreedingDocument = Breeding & Document;

@Schema()
export class OffspringData {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  species: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  pattern: string;

  @Prop({ required: true })
  grade: string;
}

const OffspringDataSchema = SchemaFactory.createForClass(OffspringData);

@Schema({ timestamps: true })
export class Breeding {
  @Prop({ type: Types.ObjectId, ref: 'Isopod', required: true })
  parent1Id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Isopod', required: true })
  parent2Id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ default: false })
  isComplete: boolean;

  @Prop({ default: false })
  isCollected: boolean;

  @Prop({ type: [OffspringDataSchema], default: [] })
  offspring: OffspringData[];

  @Prop({ default: 0 })
  offspringCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BreedingSchema = SchemaFactory.createForClass(Breeding);
BreedingSchema.index({ userId: 1 });
BreedingSchema.index({ userId: 1, isComplete: 1, isCollected: 1 });
