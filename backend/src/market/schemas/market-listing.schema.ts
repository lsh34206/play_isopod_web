import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MarketListingDocument = MarketListing & Document;

export enum ListingStatus {
  LISTED = 'listed',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class MarketListing {
  @Prop({ type: Types.ObjectId, ref: 'Isopod', required: true })
  isopodId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  price: number;

  @Prop({ default: Date.now })
  listedAt: Date;

  @Prop()
  soldAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  buyerId: Types.ObjectId;

  @Prop({
    enum: Object.values(ListingStatus),
    default: ListingStatus.LISTED,
  })
  status: string;

  // Snapshot of isopod data at listing time
  @Prop({ type: Object })
  isopodSnapshot: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MarketListingSchema = SchemaFactory.createForClass(MarketListing);
MarketListingSchema.index({ status: 1, listedAt: -1 });
MarketListingSchema.index({ sellerId: 1 });
MarketListingSchema.index({ isopodId: 1 });
