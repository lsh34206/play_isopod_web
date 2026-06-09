import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameState, GameStateDocument } from '../game/schemas/game-state.schema';
import { Isopod, IsopodDocument } from '../isopods/schemas/isopod.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  totalIsopods: number;
  totalValue: number;
  highestGrade: string;
  topIsopodName: string;
  totalEarned: number;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(GameState.name) private gameStateModel: Model<GameStateDocument>,
    @InjectModel(Isopod.name) private isopodModel: Model<IsopodDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private readonly GRADE_ORDER = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

  async getTopRanking(limit = 20): Promise<RankingEntry[]> {
    const isopodAgg = await this.isopodModel.aggregate([
      { $match: { isAlive: true } },
      { $sort: { sellPrice: -1 } },
      {
        $group: {
          _id: '$owner',
          totalValue: { $sum: '$sellPrice' },
          count: { $sum: 1 },
          topIsopodName: { $first: '$name' },
          grades: { $push: '$grade' },
        },
      },
    ]);

    const isopodMap = new Map<string, {
      totalValue: number; count: number; topIsopodName: string; highestGrade: string;
    }>();

    for (const entry of isopodAgg) {
      const highestGrade = entry.grades.reduce((best: string, g: string) => {
        return this.GRADE_ORDER.indexOf(g) > this.GRADE_ORDER.indexOf(best) ? g : best;
      }, 'D');
      isopodMap.set(entry._id.toString(), {
        totalValue: entry.totalValue,
        count: entry.count,
        topIsopodName: entry.topIsopodName || '',
        highestGrade,
      });
    }

    const gameStates = await this.gameStateModel
      .find()
      .populate('userId', 'username')
      .exec();

    const entries: RankingEntry[] = [];

    for (const state of gameStates) {
      const user = state.userId as any;
      if (!user || !user.username) continue;

      const userId = user._id.toString();
      const iso = isopodMap.get(userId) || { totalValue: 0, count: 0, topIsopodName: '', highestGrade: 'D' };

      entries.push({
        rank: 0,
        userId,
        username: user.username,
        totalIsopods: iso.count,
        totalValue: iso.totalValue,
        highestGrade: iso.highestGrade,
        topIsopodName: iso.topIsopodName,
        totalEarned: state.totalEarned,
      });
    }

    entries.sort((a, b) => {
      if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue;
      const aGi = this.GRADE_ORDER.indexOf(a.highestGrade);
      const bGi = this.GRADE_ORDER.indexOf(b.highestGrade);
      if (bGi !== aGi) return bGi - aGi;
      return b.totalEarned - a.totalEarned;
    });

    return entries.slice(0, limit).map((e, idx) => ({ ...e, rank: idx + 1 }));
  }

  async getMyRank(userId: string): Promise<RankingEntry | null> {
    const allRanking = await this.getTopRanking(1000);
    const myEntry = allRanking.find((e) => e.userId === userId);

    if (!myEntry) {
      const user = await this.userModel.findById(userId).exec();
      const state = await this.gameStateModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();

      if (!user || !state) return null;

      return {
        rank: allRanking.length + 1,
        userId,
        username: user.username,
        totalIsopods: 0,
        totalValue: 0,
        highestGrade: 'D',
        topIsopodName: '',
        totalEarned: state.totalEarned,
      };
    }

    return myEntry;
  }
}
