import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IsopodDocument = Isopod & Document;

export enum IsopodSpecies {
  ARMADILLIDIUM = 'armadillidium',
  PORCELLIO = 'porcellio',
  CUBARIS = 'cubaris',
}

export enum IsopodGrade {
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  SS = 'SS',
  SSS = 'SSS',
}

export enum IsopodPattern {
  NORMAL = 'normal',
  SPOTTED = 'spotted',
  STRIPED = 'striped',
  ALBINO = 'albino',
  MELANISTIC = 'melanistic',
}

@Schema({ timestamps: true })
export class Isopod {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: IsopodSpecies, default: IsopodSpecies.ARMADILLIDIUM })
  species: string;

  @Prop({ min: 1, max: 100, default: 1 })
  level: number;

  @Prop({ enum: Object.values(IsopodGrade), default: IsopodGrade.D })
  grade: string;

  @Prop({ default: 0 })
  exp: number;

  @Prop({ default: 100 })
  expToNextLevel: number;

  @Prop({ min: 0, max: 100, default: 100 })
  health: number;

  @Prop({ min: 0, max: 100, default: 80 })
  hunger: number;

  @Prop({ min: 0, max: 100, default: 70 })
  humidity: number;

  @Prop({ default: 22 })
  temperature: number;

  @Prop({ min: 0, max: 100, default: 80 })
  happiness: number;

  @Prop({ default: 1.0 })
  size: number;

  @Prop({ default: '#8B7355' })
  color: string;

  @Prop({ enum: Object.values(IsopodPattern), default: IsopodPattern.NORMAL })
  pattern: string;

  @Prop({ default: true })
  isAlive: boolean;

  @Prop({ default: false })
  canBreed: boolean;

  @Prop({ default: 0 })
  breedCount: number;

  @Prop({ default: 10 })
  sellPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: Date.now })
  lastFedAt: Date;

  @Prop({ default: Date.now })
  lastCaredAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const IsopodSchema = SchemaFactory.createForClass(Isopod);

IsopodSchema.index({ owner: 1 });
IsopodSchema.index({ owner: 1, isAlive: 1 });
IsopodSchema.index({ grade: 1, level: -1 });

// Virtual for calculated sell price
IsopodSchema.pre('save', function (next) {
  const gradeMultipliers: Record<string, number> = {
    D: 1,
    C: 2,
    B: 5,
    A: 12,
    S: 30,
    SS: 80,
    SSS: 200,
  };

  const patternBonus: Record<string, number> = {
    normal: 1,
    spotted: 1.2,
    striped: 1.3,
    albino: 2.0,
    melanistic: 2.5,
  };

  const gradeMultiplier = gradeMultipliers[this.grade] || 1;
  const patternMultiplier = patternBonus[this.pattern] || 1;
  this.sellPrice = Math.floor(
    10 * this.level * gradeMultiplier * patternMultiplier,
  );

  // Update canBreed
  this.canBreed = this.level >= 10 && this.isAlive;

  next();
});
