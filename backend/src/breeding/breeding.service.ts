import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Breeding, BreedingDocument } from './schemas/breeding.schema';
import { Isopod, IsopodDocument, IsopodPattern, IsopodGrade } from '../isopods/schemas/isopod.schema';
import { GameService } from '../game/game.service';
import { GameGateway } from '../game/game.gateway';

const BREEDING_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const GRADE_ORDER = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mixColors(color1: string, color2: string): string {
  // Parse hex colors and average them
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.floor((r1 + r2) / 2 + (Math.random() - 0.5) * 30);
  const g = Math.floor((g1 + g2) / 2 + (Math.random() - 0.5) * 30);
  const b = Math.floor((b1 + b2) / 2 + (Math.random() - 0.5) * 30);

  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function inheritPattern(p1: string, p2: string): string {
  const rand = Math.random();
  if (rand < 0.02) return IsopodPattern.MELANISTIC;
  if (rand < 0.06) return IsopodPattern.ALBINO;

  // Rare patterns are more likely to pass down
  if (p1 === IsopodPattern.MELANISTIC || p2 === IsopodPattern.MELANISTIC) {
    if (Math.random() < 0.4) return IsopodPattern.MELANISTIC;
  }
  if (p1 === IsopodPattern.ALBINO || p2 === IsopodPattern.ALBINO) {
    if (Math.random() < 0.35) return IsopodPattern.ALBINO;
  }

  // Otherwise inherit one of parent patterns or downgrade
  return Math.random() < 0.5 ? p1 : p2;
}

function inheritGrade(g1: string, g2: string): string {
  const idx1 = GRADE_ORDER.indexOf(g1);
  const idx2 = GRADE_ORDER.indexOf(g2);
  const avgIdx = (idx1 + idx2) / 2;

  // Random variation: mostly average, small chance of higher
  const rand = Math.random();
  if (rand < 0.05 && Math.max(idx1, idx2) < GRADE_ORDER.length - 1) {
    return GRADE_ORDER[Math.max(idx1, idx2) + 1]; // Rare upgrade
  }
  if (rand < 0.3) {
    return GRADE_ORDER[Math.max(idx1, idx2)]; // Best parent
  }
  return GRADE_ORDER[Math.min(Math.round(avgIdx), GRADE_ORDER.length - 1)]; // Average
}

@Injectable()
export class BreedingService {
  constructor(
    @InjectModel(Breeding.name) private breedingModel: Model<BreedingDocument>,
    @InjectModel(Isopod.name) private isopodModel: Model<IsopodDocument>,
    private gameService: GameService,
    private gameGateway: GameGateway,
  ) {}

  async startBreeding(
    userId: string,
    parent1Id: string,
    parent2Id: string,
  ): Promise<BreedingDocument> {
    if (parent1Id === parent2Id) {
      throw new BadRequestException('두 마리의 서로 다른 공벌레를 선택해야 합니다.');
    }

    // Check active breeding
    const active = await this.breedingModel.findOne({
      userId: new Types.ObjectId(userId),
      isComplete: false,
    }).exec();

    if (active) {
      throw new BadRequestException('이미 번식이 진행 중입니다. 완료될 때까지 기다려주세요.');
    }

    // Validate parents
    const parent1 = await this.isopodModel.findById(parent1Id).exec();
    const parent2 = await this.isopodModel.findById(parent2Id).exec();

    if (!parent1 || parent1.owner.toString() !== userId) {
      throw new NotFoundException('첫 번째 공벌레를 찾을 수 없습니다.');
    }
    if (!parent2 || parent2.owner.toString() !== userId) {
      throw new NotFoundException('두 번째 공벌레를 찾을 수 없습니다.');
    }

    if (!parent1.isAlive || !parent2.isAlive) {
      throw new BadRequestException('살아있는 공벌레만 번식할 수 있습니다.');
    }

    if (!parent1.canBreed || !parent2.canBreed) {
      throw new BadRequestException('번식하려면 두 공벌레 모두 레벨 10 이상이어야 합니다.');
    }

    // Check max isopods
    const gameState = await this.gameService.getOrCreateGameState(userId);
    const aliveCount = await this.isopodModel.countDocuments({
      owner: new Types.ObjectId(userId),
      isAlive: true,
    });

    const maxOffspring = 4;
    if (aliveCount + maxOffspring > gameState.maxIsopods + maxOffspring) {
      // Allow breeding even close to cap, offspring is collected separately
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + BREEDING_DURATION_MS);

    // Pre-generate offspring data
    const offspringCount = Math.floor(Math.random() * 4) + 1; // 1-4
    const offspring = [];

    for (let i = 0; i < offspringCount; i++) {
      const color = mixColors(parent1.color, parent2.color);
      const pattern = inheritPattern(parent1.pattern, parent2.pattern);
      const grade = inheritGrade(parent1.grade, parent2.grade);
      const species = Math.random() < 0.5 ? parent1.species : parent2.species;
      const nameIdx = i + 1;
      const name = `${parent1.name.charAt(0)}${parent2.name.charAt(0)}-${nameIdx}세`;

      offspring.push({ name, species, color, pattern, grade });
    }

    const breeding = new this.breedingModel({
      parent1Id: new Types.ObjectId(parent1Id),
      parent2Id: new Types.ObjectId(parent2Id),
      userId: new Types.ObjectId(userId),
      startTime: now,
      endTime,
      isComplete: false,
      isCollected: false,
      offspring,
      offspringCount,
    });

    // Update parent breedCount
    parent1.breedCount += 1;
    parent2.breedCount += 1;
    await parent1.save();
    await parent2.save();

    const saved = await breeding.save();

    // Check breeding achievement
    await this.gameService.checkAndUnlockAchievement(userId, 'bred_once');

    return saved;
  }

  async getActiveBreeding(userId: string): Promise<BreedingDocument | null> {
    const breeding = await this.breedingModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isCollected: false,
      })
      .exec();

    if (!breeding) return null;

    // Auto-complete if time has passed
    if (!breeding.isComplete && new Date() >= breeding.endTime) {
      breeding.isComplete = true;
      await breeding.save();
    }

    return breeding;
  }

  async collectOffspring(userId: string): Promise<{
    breeding: BreedingDocument;
    newIsopods: IsopodDocument[];
  }> {
    const breeding = await this.breedingModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isComplete: false,
        isCollected: false,
      })
      .exec();

    // Check if breeding is done (by time)
    if (!breeding) {
      // Check if there's a completed but uncollected breeding
      const completedBreeding = await this.breedingModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isCollected: false,
        })
        .exec();

      if (!completedBreeding) {
        throw new NotFoundException('수집할 번식 결과가 없습니다.');
      }

      if (new Date() < completedBreeding.endTime) {
        const remainingMs = completedBreeding.endTime.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        throw new BadRequestException(
          `번식이 아직 완료되지 않았습니다. ${remainingMin}분 후에 다시 시도해주세요.`,
        );
      }

      completedBreeding.isComplete = true;
      await completedBreeding.save();
      return this.doCollect(userId, completedBreeding);
    }

    if (new Date() < breeding.endTime) {
      const remainingMs = breeding.endTime.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new BadRequestException(
        `번식이 아직 완료되지 않았습니다. ${remainingMin}분 후에 다시 시도해주세요.`,
      );
    }

    breeding.isComplete = true;
    await breeding.save();
    return this.doCollect(userId, breeding);
  }

  private async doCollect(userId: string, breeding: BreedingDocument) {
    const gameState = await this.gameService.getOrCreateGameState(userId);
    const aliveCount = await this.isopodModel.countDocuments({
      owner: new Types.ObjectId(userId),
      isAlive: true,
    });

    const newIsopods: IsopodDocument[] = [];
    let spawned = 0;

    for (const offData of breeding.offspring) {
      if (aliveCount + spawned >= gameState.maxIsopods) break;

      const isopod = new this.isopodModel({
        name: offData.name,
        species: offData.species,
        color: offData.color,
        pattern: offData.pattern,
        grade: offData.grade,
        owner: new Types.ObjectId(userId),
        lastFedAt: new Date(),
        lastCaredAt: new Date(),
      });

      const saved = await isopod.save();
      newIsopods.push(saved);
      spawned++;

      await this.gameService.incrementTotalIsopods(userId);
    }

    breeding.isCollected = true;
    await breeding.save();

    return { breeding, newIsopods };
  }

  // Cron: check for completed breedings and notify via WebSocket
  @Cron(CronExpression.EVERY_MINUTE)
  async checkBreedingCompletion() {
    const now = new Date();
    const completedBreedings = await this.breedingModel
      .find({
        isComplete: false,
        isCollected: false,
        endTime: { $lte: now },
      })
      .exec();

    for (const breeding of completedBreedings) {
      breeding.isComplete = true;
      await breeding.save();

      this.gameGateway.emitBreedingComplete(breeding.userId.toString(), breeding);
    }
  }
}
