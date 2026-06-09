import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameState, GameStateDocument } from './schemas/game-state.schema';
import { GameGateway } from './game.gateway';

// Shop item costs
const SHOP_ITEMS = {
  feedStock: { cost: 10, amount: 10, label: '먹이 x10' },
  moistureSpray: { cost: 15, amount: 5, label: '습도 조절기 x5' },
  heater: { cost: 20, amount: 3, label: '히터 x3' },
  cooler: { cost: 20, amount: 3, label: '쿨러 x3' },
};

const SLOT_EXPANSION_COST = 200;
const SLOT_EXPANSION_AMOUNT = 5;

// Achievements definitions
const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_isopod', name: '첫 공벌레', description: '공벌레를 처음으로 입양했습니다.' },
  { id: 'five_isopods', name: '공벌레 수집가', description: '공벌레 5마리를 동시에 키우고 있습니다.' },
  { id: 'level10', name: '성장의 기쁨', description: '공벌레를 레벨 10으로 키웠습니다.' },
  { id: 'grade_s', name: 'S급 도달', description: '공벌레를 S등급으로 올렸습니다.' },
  { id: 'coins_1000', name: '소규모 투자자', description: '총 1,000 코인을 모았습니다.' },
  { id: 'coins_10000', name: '중급 투자자', description: '총 10,000 코인을 모았습니다.' },
  { id: 'login_7', name: '성실한 사육사', description: '7일 연속 로그인했습니다.' },
  { id: 'bred_once', name: '번식 성공', description: '공벌레 번식에 성공했습니다.' },
  { id: 'sold_once', name: '첫 거래', description: '마켓에서 공벌레를 판매했습니다.' },
];

@Injectable()
export class GameService {
  constructor(
    @InjectModel(GameState.name) private gameStateModel: Model<GameStateDocument>,
    @Inject(forwardRef(() => GameGateway)) private gameGateway: GameGateway,
  ) {}

  async getOrCreateGameState(userId: string): Promise<GameStateDocument> {
    const found = await this.gameStateModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (found) return found;

    return this.createInitialGameState(userId);
  }

  async createInitialGameState(userId: string): Promise<GameStateDocument> {
    const existing = await this.gameStateModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (existing) return existing;

    const state = new this.gameStateModel({
      userId: new Types.ObjectId(userId),
      coins: 500,
      gems: 0,
      totalIsopods: 0,
      maxIsopods: 5,
      feedStock: 10,
      moistureSpray: 5,
      heater: 3,
      cooler: 3,
      totalEarned: 0,
      totalSold: 0,
      achievements: [],
      lastLogin: new Date(),
      loginStreak: 1,
      lastIdleCollect: new Date(),
    });

    return state.save();
  }

  async getGameState(userId: string): Promise<GameStateDocument> {
    const state = await this.getOrCreateGameState(userId);
    return state;
  }

  async updateLoginStreak(userId: string): Promise<void> {
    const state = await this.getOrCreateGameState(userId);
    const now = new Date();
    const lastLogin = state.lastLogin;

    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      state.loginStreak += 1;
    } else if (diffDays > 1) {
      state.loginStreak = 1;
    }

    state.lastLogin = now;

    // Login streak bonus
    if (state.loginStreak >= 7) {
      await this.checkAndUnlockAchievement(userId, 'login_7', state);
    }

    await state.save();
  }

  async buyFood(userId: string, quantity: number): Promise<GameStateDocument> {
    const state = await this.getOrCreateGameState(userId);
    const item = SHOP_ITEMS.feedStock;
    const lots = Math.ceil(quantity / item.amount);
    const cost = lots * item.cost;

    if (state.coins < cost) {
      throw new BadRequestException(`먹이 구매에는 코인 ${cost}개가 필요합니다.`);
    }

    state.coins -= cost;
    state.feedStock += lots * item.amount;
    await state.save();
    return state;
  }

  async buyItems(
    userId: string,
    itemType: 'moistureSpray' | 'heater' | 'cooler',
    quantity: number,
  ): Promise<GameStateDocument> {
    const state = await this.getOrCreateGameState(userId);
    const item = SHOP_ITEMS[itemType];

    if (!item) {
      throw new BadRequestException('유효하지 않은 아이템입니다.');
    }

    const lots = Math.max(1, Math.ceil(quantity / item.amount));
    const cost = lots * item.cost;

    if (state.coins < cost) {
      throw new BadRequestException(`아이템 구매에는 코인 ${cost}개가 필요합니다.`);
    }

    state.coins -= cost;
    (state as any)[itemType] += lots * item.amount;
    await state.save();
    return state;
  }

  async expandSlots(userId: string): Promise<GameStateDocument> {
    const state = await this.getOrCreateGameState(userId);

    if (state.coins < SLOT_EXPANSION_COST) {
      throw new BadRequestException(
        `슬롯 확장에는 코인 ${SLOT_EXPANSION_COST}개가 필요합니다.`,
      );
    }

    state.coins -= SLOT_EXPANSION_COST;
    state.maxIsopods += SLOT_EXPANSION_AMOUNT;
    await state.save();
    return state;
  }

  async collectIdleEarnings(userId: string): Promise<{ collected: number; state: GameStateDocument }> {
    const state = await this.getOrCreateGameState(userId);

    const now = new Date();
    const lastCollect = state.lastIdleCollect || state.createdAt || now;
    const minutesElapsed = Math.min(
      Math.floor((now.getTime() - lastCollect.getTime()) / (1000 * 60)),
      480, // max 8 hours of idle earnings
    );

    if (minutesElapsed < 1) {
      return { collected: 0, state };
    }

    // Import IsopodsService would cause circular dependency, so we use a simpler calculation
    // The actual generation is handled by cron, this just acknowledges collection
    const collected = Math.max(0, minutesElapsed * 2); // simplified: 2 coins/min baseline

    state.coins += collected;
    state.totalEarned += collected;
    state.lastIdleCollect = now;
    await state.save();

    return { collected, state };
  }

  // Called by IsopodsService cron
  async addIdleEarnings(userId: string, amount: number): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $inc: { coins: amount, totalEarned: amount },
      },
    ).exec();
  }

  async deductCoins(userId: string, amount: number): Promise<void> {
    const result = await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), coins: { $gte: amount } },
      { $inc: { coins: -amount } },
      { new: true },
    ).exec();

    if (!result) {
      throw new BadRequestException('코인이 부족합니다.');
    }
  }

  async addCoins(userId: string, amount: number): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { coins: amount, totalEarned: amount } },
    ).exec();
  }

  async incrementTotalIsopods(userId: string): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { totalIsopods: 1 } },
    ).exec();

    // Check achievement
    const state = await this.getOrCreateGameState(userId);
    if (state.totalIsopods >= 1) {
      await this.checkAndUnlockAchievement(userId, 'first_isopod', state);
    }
    if (state.totalIsopods >= 5) {
      await this.checkAndUnlockAchievement(userId, 'five_isopods', state);
    }
  }

  async decrementFeedStock(userId: string): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { feedStock: -1 } },
    ).exec();
  }

  async decrementMoistureSpray(userId: string): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { moistureSpray: -1 } },
    ).exec();
  }

  async decrementHeater(userId: string): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { heater: -1 } },
    ).exec();
  }

  async decrementCooler(userId: string): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { cooler: -1 } },
    ).exec();
  }

  async recordSale(userId: string, amount: number): Promise<void> {
    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { coins: amount, totalEarned: amount, totalSold: 1 } },
    ).exec();

    const state = await this.getOrCreateGameState(userId);
    if (state.totalSold >= 1) {
      await this.checkAndUnlockAchievement(userId, 'sold_once', state);
    }
    if (state.coins >= 1000) {
      await this.checkAndUnlockAchievement(userId, 'coins_1000', state);
    }
    if (state.coins >= 10000) {
      await this.checkAndUnlockAchievement(userId, 'coins_10000', state);
    }
  }

  async checkAndUnlockAchievement(
    userId: string,
    achievementId: string,
    state?: GameStateDocument,
  ): Promise<void> {
    if (!state) {
      state = await this.getOrCreateGameState(userId);
    }

    const alreadyUnlocked = state.achievements.some((a) => a.id === achievementId);
    if (alreadyUnlocked) return;

    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
    if (!def) return;

    await this.gameStateModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $push: {
          achievements: {
            id: def.id,
            name: def.name,
            description: def.description,
            unlockedAt: new Date(),
          },
        },
      },
    ).exec();
  }

  // Cron job: run every minute for passive decay and idle coin generation
  @Cron(CronExpression.EVERY_MINUTE)
  async handlePassiveDecayAndEarnings() {
    try {
      // We dynamically import to avoid circular dependency issues at startup
      // The IsopodsService is accessed via the gateway
      this.gameGateway.emitPeriodicUpdate();
    } catch (err) {
      // Silently handle if gateway isn't ready
    }
  }
}
