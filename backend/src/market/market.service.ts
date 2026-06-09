import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MarketListing,
  MarketListingDocument,
  ListingStatus,
} from './schemas/market-listing.schema';
import { Isopod, IsopodDocument } from '../isopods/schemas/isopod.schema';
import { GameService } from '../game/game.service';

@Injectable()
export class MarketService {
  constructor(
    @InjectModel(MarketListing.name)
    private listingModel: Model<MarketListingDocument>,
    @InjectModel(Isopod.name) private isopodModel: Model<IsopodDocument>,
    private gameService: GameService,
  ) {}

  async getActiveListings(page = 1, limit = 20): Promise<{
    listings: MarketListingDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const total = await this.listingModel.countDocuments({ status: ListingStatus.LISTED });
    const listings = await this.listingModel
      .find({ status: ListingStatus.LISTED })
      .sort({ listedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sellerId', 'username displayName')
      .exec();

    return {
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listIsopod(
    userId: string,
    isopodId: string,
    price: number,
  ): Promise<MarketListingDocument> {
    if (price < 1) {
      throw new BadRequestException('판매 가격은 최소 1코인 이상이어야 합니다.');
    }

    const isopod = await this.isopodModel.findById(isopodId).exec();
    if (!isopod) throw new NotFoundException('공벌레를 찾을 수 없습니다.');
    if (isopod.owner.toString() !== userId) throw new ForbiddenException('내 공벌레만 판매할 수 있습니다.');
    if (!isopod.isAlive) throw new BadRequestException('죽은 공벌레는 판매할 수 없습니다.');

    // Check if already listed
    const existingListing = await this.listingModel.findOne({
      isopodId: new Types.ObjectId(isopodId),
      status: ListingStatus.LISTED,
    }).exec();

    if (existingListing) {
      throw new BadRequestException('이미 마켓에 등록된 공벌레입니다.');
    }

    // Create snapshot of isopod data
    const snapshot = {
      name: isopod.name,
      species: isopod.species,
      level: isopod.level,
      grade: isopod.grade,
      color: isopod.color,
      pattern: isopod.pattern,
      health: isopod.health,
      happiness: isopod.happiness,
      size: isopod.size,
    };

    const listing = new this.listingModel({
      isopodId: new Types.ObjectId(isopodId),
      sellerId: new Types.ObjectId(userId),
      price,
      listedAt: new Date(),
      status: ListingStatus.LISTED,
      isopodSnapshot: snapshot,
    });

    // Mark isopod as in-market (we'll track via listing status)
    return listing.save();
  }

  async buyListing(
    buyerId: string,
    listingId: string,
  ): Promise<{ listing: MarketListingDocument; isopod: IsopodDocument }> {
    const listing = await this.listingModel.findById(listingId).exec();
    if (!listing) throw new NotFoundException('판매 목록을 찾을 수 없습니다.');
    if (listing.status !== ListingStatus.LISTED) throw new BadRequestException('이미 판매되었거나 취소된 목록입니다.');
    if (listing.sellerId.toString() === buyerId) throw new BadRequestException('자신의 공벌레를 구매할 수 없습니다.');

    // Check buyer's coins
    const buyerState = await this.gameService.getOrCreateGameState(buyerId);
    if (buyerState.coins < listing.price) {
      throw new BadRequestException(
        `구매에는 코인 ${listing.price}개가 필요합니다. 현재 보유: ${buyerState.coins}코인`,
      );
    }

    // Check buyer's isopod slots
    const aliveCount = await this.isopodModel.countDocuments({
      owner: new Types.ObjectId(buyerId),
      isAlive: true,
    });

    if (aliveCount >= buyerState.maxIsopods) {
      throw new BadRequestException(
        `최대 ${buyerState.maxIsopods}마리까지 키울 수 있습니다. 슬롯을 확장해주세요.`,
      );
    }

    // Verify isopod still exists and is alive
    const isopod = await this.isopodModel.findById(listing.isopodId).exec();
    if (!isopod || !isopod.isAlive) {
      listing.status = ListingStatus.CANCELLED;
      await listing.save();
      throw new BadRequestException('판매 중인 공벌레가 더 이상 유효하지 않습니다.');
    }

    // Transfer isopod ownership
    isopod.owner = new Types.ObjectId(buyerId);
    await isopod.save();

    // Deduct coins from buyer
    await this.gameService.deductCoins(buyerId, listing.price);

    // Add coins to seller (minus 5% market fee)
    const fee = Math.floor(listing.price * 0.05);
    const sellerReceives = listing.price - fee;
    await this.gameService.recordSale(listing.sellerId.toString(), sellerReceives);

    // Update listing
    listing.status = ListingStatus.SOLD;
    listing.soldAt = new Date();
    listing.buyerId = new Types.ObjectId(buyerId);
    await listing.save();

    return { listing, isopod };
  }

  async cancelListing(
    userId: string,
    listingId: string,
  ): Promise<MarketListingDocument> {
    const listing = await this.listingModel.findById(listingId).exec();
    if (!listing) throw new NotFoundException('판매 목록을 찾을 수 없습니다.');
    if (listing.sellerId.toString() !== userId) throw new ForbiddenException('내 판매 목록만 취소할 수 있습니다.');
    if (listing.status !== ListingStatus.LISTED) throw new BadRequestException('이미 처리된 판매 목록입니다.');

    listing.status = ListingStatus.CANCELLED;
    await listing.save();

    return listing;
  }

  async getMyListings(userId: string): Promise<MarketListingDocument[]> {
    return this.listingModel
      .find({ sellerId: new Types.ObjectId(userId) })
      .sort({ listedAt: -1 })
      .exec();
  }
}
