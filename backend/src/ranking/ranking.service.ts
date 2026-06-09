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
  displayName: string;
  totalIsopods: number;
  totalValue: number;
  highestLevel: number;
  totalEarned: number;
  loginStreak: number;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(GameState.name) private gameStateModel: Model<GameStateDocument>,
    @InjectModel(Isopod.name) private isopodModel: Model<IsopodDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getTopRanking(limit = 20): Promise<RankingEntry[]> {
    // Aggregate isopod values per user
    const isopodValueAgg = await this.isopodModel.aggregate([
      { $match: { isAlive: true } },
      {
        $group: {
          _id: '$owner',
          totalValue: { $sum: '$sellPrice' },
          highestLevel: { $max: '$level' },
          count: { $sum: 1 },
        },
      },
    ]);

    const isopodMap = new Map<
      string,
      { totalValue: number; highestLevel: number; count: number }
    >();
    for (const entry of isopodValueAgg) {
      isopodMap.set(entry._id.toString(), {
        totalValue: entry.totalValue,
        highestLevel: entry.highestLevel,
        count: entry.count,
      });
    }

    // Get all game states
    const gameStates = await this.gameStateModel
      .find()
      .populate('userId', 'username displayName')
      .exec();

    const entries: RankingEntry[] = [];

    for (const state of gameStates) {
      const user = state.userId as any;
      if (!user || !user.username) continue;

      const userId = user._id.toString();
      const isopodData = isopodMap.get(userId) || {
        totalValue: 0,
        highestLevel: 0,
        count: 0,
      };

      entries.push({
        rank: 0, // Will be assigned after sorting
        userId,
        username: user.username,
        displayName: user.displayName || user.username,
        totalIsopods: isopodData.count,
        totalValue: isopodData.totalValue,
        highestLevel: isopodData.highestLevel,
        totalEarned: state.totalEarned,
        loginStreak: state.loginStreak,
      });
    }

    // Sort by total value desc, then by total earned desc
    entries.sort((a, b) => {
      if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue;
      if (b.highestLevel !== a.highestLevel) return b.highestLevel - a.highestLevel;
      return b.totalEarned - a.totalEarned;
    });

    // Assign ranks and return top N
    return entries.slice(0, limit).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }

  async getMyRank(userId: string): Promise<{ rank: number; entry: RankingEntry } | null> {
    const allRanking = await this.getTopRanking(1000);
    const myEntry = allRanking.find((e) => e.userId === userId);

    if (!myEntry) {
      // User not in ranking yet — build their entry
      const user = await this.userModel.findById(userId).exec();
      const state = await this.gameStateModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();

      if (!user || !state) return null;

      return {
        rank: allRanking.length + 1,
        entry: {
          rank: allRanking.length + 1,
          userId,
          username: user.username,
          displayName: user.displayName || user.username,
          totalIsopods: 0,
          totalValue: 0,
          highestLevel: 0,
          totalEarned: state.totalEarned,
          loginStreak: state.loginStreak,
        },
      };
    }

    return { rank: myEntry.rank, entry: myEntry };
  }
}
