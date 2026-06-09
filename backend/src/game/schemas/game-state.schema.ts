import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameStateDocument = GameState & Document;

@Schema()
export class Achievement {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: Date.now })
  unlockedAt: Date;
}

const AchievementSchema = SchemaFactory.createForClass(Achievement);

@Schema({ timestamps: true })
export class GameState {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 500 })
  coins: number;

  @Prop({ default: 0 })
  gems: number;

  @Prop({ default: 0 })
  totalIsopods: number;

  @Prop({ default: 5 })
  maxIsopods: number;

  @Prop({ default: 10 })
  feedStock: number;

  @Prop({ default: 5 })
  moistureSpray: number;

  @Prop({ default: 3 })
  heater: number;

  @Prop({ default: 3 })
  cooler: number;

  @Prop({ default: 0 })
  totalEarned: number;

  @Prop({ default: 0 })
  totalSold: number;

  @Prop({ type: [AchievementSchema], default: [] })
  achievements: Achievement[];

  @Prop({ default: Date.now })
  lastLogin: Date;

  @Prop({ default: 1 })
  loginStreak: number;

  @Prop({ default: Date.now })
  lastIdleCollect: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GameStateSchema = SchemaFactory.createForClass(GameState);
GameStateSchema.index({ userId: 1 }, { unique: true });
