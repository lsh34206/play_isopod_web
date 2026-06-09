import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: function() { return this.username; } })
  displayName: string;

  @Prop({ default: Date.now })
  lastLogin: Date;

  @Prop({ default: 0 })
  loginStreak: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for faster lookups
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
