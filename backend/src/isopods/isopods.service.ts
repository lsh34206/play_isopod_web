import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Isopod, IsopodDocument, IsopodGrade, IsopodPattern, IsopodSpecies } from './schemas/isopod.schema';
import { CreateIsopodDto } from './dto/create-isopod.dto';
import { CareIsopodDto } from './dto/update-isopod.dto';
import { GameService } from '../game/game.service';

const ISOPOD_CREATION_COST = 50; // coins

const GRADE_UPGRADE_COSTS: Record<string, number> = {
  D: 100,   // D -> C
  C: 300,   // C -> B
  B: 1000,  // B -> A
  A: 3000,  // A -> S
  S: 10000, // S -> SS
  SS: 50000, // SS -> SSS
};

const GRADE_ORDER = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

const SPECIES_COLORS: Record<string, string[]> = {
  armadillidium: ['#8B7355', '#A0956B', '#6B5A3E', '#C4A882', '#7A6645'],
  porcellio: ['#4A4A4A', '#6B6B6B', '#3D3D3D', '#8A8A8A', '#5A5A5A'],
  cubaris: ['#D4A853', '#E8C07A', '#C49340', '#F0D4A0', '#B8842E'],
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateIsopodColor(species: string): string {
  const colors = SPECIES_COLORS[species] || SPECIES_COLORS.armadillidium;
  return getRandomElement(colors);
}

function generateInitialPattern(): string {
  const rand = Math.random();
  if (rand < 0.60) return IsopodPattern.NORMAL;
  if (rand < 0.80) return IsopodPattern.SPOTTED;
  if (rand < 0.92) return IsopodPattern.STRIPED;
  if (rand < 0.98) return IsopodPattern.ALBINO;
  return IsopodPattern.MELANISTIC;
}

@Injectable()
export class IsopodsService {
  constructor(
    @InjectModel(Isopod.name) private isopodModel: Model<IsopodDocument>,
    private gameService: GameService,
  ) {}

  async findAllByOwner(userId: string): Promise<IsopodDocument[]> {
    return this.isopodModel
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneByOwner(id: string, userId: string): Promise<IsopodDocument> {
    const isopod = await this.isopodModel.findById(id).exec();
    if (!isopod) throw new NotFoundException('공벌레를 찾을 수 없습니다.');
    if (isopod.owner.toString() !== userId) throw new ForbiddenException('접근 권한이 없습니다.');
    return isopod;
  }

  async create(userId: string, dto: CreateIsopodDto): Promise<IsopodDocument> {
    const gameState = await this.gameService.getOrCreateGameState(userId);

    if (gameState.coins < ISOPOD_CREATION_COST) {
      throw new BadRequestException(`공벌레 입양에는 코인 ${ISOPOD_CREATION_COST}개가 필요합니다.`);
    }

    const aliveCount = await this.isopodModel.countDocuments({
      owner: new Types.ObjectId(userId),
      isAlive: true,
    });

    if (aliveCount >= gameState.maxIsopods) {
      throw new BadRequestException(
        `최대 ${gameState.maxIsopods}마리까지 키울 수 있습니다. 슬롯을 확장해주세요.`,
      );
    }

    const species = dto.species || getRandomElement(Object.values(IsopodSpecies));
    const color = generateIsopodColor(species);
    const pattern = generateInitialPattern();

    const isopod = new this.isopodModel({
      name: dto.name,
      species,
      color,
      pattern,
      owner: new Types.ObjectId(userId),
      lastFedAt: new Date(),
      lastCaredAt: new Date(),
    });

    await isopod.save();

    // Deduct coins
    await this.gameService.deductCoins(userId, ISOPOD_CREATION_COST);

    // Increment totalIsopods in game state
    await this.gameService.incrementTotalIsopods(userId);

    return isopod;
  }

  async feedIsopod(id: string, userId: string): Promise<{ isopod: IsopodDocument; coinsEarned: number }> {
    const isopod = await this.findOneByOwner(id, userId);

    if (!isopod.isAlive) {
      throw new BadRequestException('이미 죽은 공벌레입니다.');
    }

    const gameState = await this.gameService.getOrCreateGameState(userId);
    if (gameState.feedStock <= 0) {
      throw new BadRequestException('먹이가 부족합니다. 먹이를 구매해주세요.');
    }

    await this.gameService.decrementFeedStock(userId);

    const hungerGain = 20 + Math.floor(Math.random() * 10);
    const expGain = 5 + isopod.level;
    const coinsEarned = isopod.level * 2;

    isopod.hunger = Math.min(100, isopod.hunger + hungerGain);
    isopod.happiness = Math.min(100, isopod.happiness + 5);
    isopod.lastFedAt = new Date();

    await this.grantExp(isopod, expGain);
    await isopod.save();

    if (coinsEarned > 0) {
      await this.gameService.addIdleEarnings(userId, coinsEarned);
    }

    return { isopod, coinsEarned };
  }

  async careIsopod(id: string, userId: string, dto: CareIsopodDto): Promise<{ isopod: IsopodDocument }> {
    const isopod = await this.findOneByOwner(id, userId);

    if (!isopod.isAlive) {
      throw new BadRequestException('이미 죽은 공벌레입니다.');
    }

    const gameState = await this.gameService.getOrCreateGameState(userId);
    const action = dto.action;

    if (action === 'spray') {
      if (gameState.moistureSpray <= 0) throw new BadRequestException('습도 스프레이가 부족합니다.');
      await this.gameService.decrementMoistureSpray(userId);
      isopod.humidity = Math.min(100, isopod.humidity + 10);
    } else if (action === 'heat') {
      if (gameState.heater <= 0) throw new BadRequestException('히터가 부족합니다.');
      await this.gameService.decrementHeater(userId);
      isopod.temperature = Math.min(35, isopod.temperature + 2);
    } else if (action === 'cool') {
      if (gameState.cooler <= 0) throw new BadRequestException('쿨러가 부족합니다.');
      await this.gameService.decrementCooler(userId);
      isopod.temperature = Math.max(15, isopod.temperature - 2);
    } else {
      throw new BadRequestException('유효한 액션을 입력하세요: spray, heat, cool');
    }

    const expGain = 3 + isopod.level;
    isopod.happiness = Math.min(100, isopod.happiness + 10);
    isopod.lastCaredAt = new Date();
    await this.grantExp(isopod, expGain);
    await isopod.save();

    return { isopod };
  }

  async upgradeGrade(id: string, userId: string): Promise<IsopodDocument> {
    const isopod = await this.findOneByOwner(id, userId);

    if (!isopod.isAlive) {
      throw new BadRequestException('이미 죽은 공벌레입니다.');
    }

    const currentGradeIndex = GRADE_ORDER.indexOf(isopod.grade);
    if (currentGradeIndex === -1 || currentGradeIndex >= GRADE_ORDER.length - 1) {
      throw new BadRequestException('이미 최고 등급(SSS)입니다.');
    }

    const cost = GRADE_UPGRADE_COSTS[isopod.grade];
    if (!cost) {
      throw new BadRequestException('등급 업그레이드가 불가능합니다.');
    }

    const gameState = await this.gameService.getOrCreateGameState(userId);
    if (gameState.coins < cost) {
      throw new BadRequestException(`등급 업그레이드에는 코인 ${cost}개가 필요합니다.`);
    }

    await this.gameService.deductCoins(userId, cost);

    isopod.grade = GRADE_ORDER[currentGradeIndex + 1];
    isopod.happiness = Math.min(100, isopod.happiness + 20);
    isopod.size = isopod.size * 1.1;

    await isopod.save();
    return isopod;
  }

  async releaseIsopod(id: string, userId: string): Promise<{ message: string; coinsRefunded: number }> {
    const isopod = await this.findOneByOwner(id, userId);

    // Refund 50% of sell price if alive
    let coinsRefunded = 0;
    if (isopod.isAlive) {
      coinsRefunded = Math.floor(isopod.sellPrice * 0.5);
      await this.gameService.addCoins(userId, coinsRefunded);
    }

    await this.isopodModel.findByIdAndDelete(id).exec();

    return {
      message: '공벌레를 자연으로 돌려보냈습니다.',
      coinsRefunded,
    };
  }

  async grantExp(isopod: IsopodDocument, amount: number): Promise<void> {
    isopod.exp += amount;

    while (isopod.exp >= isopod.expToNextLevel && isopod.level < 100) {
      isopod.exp -= isopod.expToNextLevel;
      isopod.level += 1;
      isopod.expToNextLevel = isopod.level * 100;
      isopod.size = 1.0 + (isopod.level - 1) * 0.05;
      isopod.health = Math.min(100, isopod.health + 5);
      isopod.happiness = Math.min(100, isopod.happiness + 10);

      // Chance to mutate color/pattern on level up
      if (Math.random() < 0.05) {
        isopod.color = generateIsopodColor(isopod.species);
      }
    }

    if (isopod.level >= 100) {
      isopod.exp = 0;
    }
  }

  async getIsopodsByIds(ids: string[]): Promise<IsopodDocument[]> {
    return this.isopodModel
      .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
      .exec();
  }

  async applyPassiveDecay(): Promise<void> {
    const aliveIsopods = await this.isopodModel.find({ isAlive: true }).exec();

    for (const isopod of aliveIsopods) {
      let changed = false;

      // Hunger decay: -5 every 10 min (cron runs each minute, so -0.5/min)
      isopod.hunger = Math.max(0, isopod.hunger - 0.5);
      changed = true;

      // Low hunger => health decay
      if (isopod.hunger < 20) {
        isopod.health = Math.max(0, isopod.health - 1);
        isopod.happiness = Math.max(0, isopod.happiness - 2);
      }

      // Species-specific humidity requirements
      let humidityMin = 60;
      let humidityMax = 80;
      if (isopod.species === IsopodSpecies.CUBARIS) {
        humidityMin = 70;
        humidityMax = 90;
      } else if (isopod.species === IsopodSpecies.PORCELLIO) {
        humidityMin = 50;
        humidityMax = 70;
      }

      if (isopod.humidity < humidityMin || isopod.humidity > humidityMax) {
        isopod.health = Math.max(0, isopod.health - 0.5);
        isopod.happiness = Math.max(0, isopod.happiness - 1);
      }

      // Temperature check (15-30°C optimal)
      if (isopod.temperature < 15 || isopod.temperature > 30) {
        isopod.health = Math.max(0, isopod.health - 0.5);
      }

      // Happiness slowly decays without attention
      isopod.happiness = Math.max(0, isopod.happiness - 0.2);

      // Death check
      if (isopod.health <= 0) {
        isopod.isAlive = false;
        isopod.health = 0;
        isopod.canBreed = false;
      }

      if (changed) {
        await isopod.save();
      }
    }
  }

  async generateIdleCoins(): Promise<Map<string, number>> {
    const aliveIsopods = await this.isopodModel.find({ isAlive: true }).exec();
    const ownerEarnings = new Map<string, number>();

    const gradeEarnings: Record<string, number> = {
      D: 1, C: 3, B: 8, A: 20, S: 50, SS: 150, SSS: 400,
    };

    for (const isopod of aliveIsopods) {
      const base = gradeEarnings[isopod.grade] || 1;
      const levelBonus = Math.floor(isopod.level * 0.5);
      const happinessMultiplier = isopod.happiness >= 80 ? 1.5 : isopod.happiness >= 50 ? 1.0 : 0.5;
      const coinsEarned = Math.floor((base + levelBonus) * happinessMultiplier);

      const ownerId = isopod.owner.toString();
      ownerEarnings.set(ownerId, (ownerEarnings.get(ownerId) || 0) + coinsEarned);
    }

    return ownerEarnings;
  }

  async countAliveByOwner(userId: string): Promise<number> {
    return this.isopodModel.countDocuments({
      owner: new Types.ObjectId(userId),
      isAlive: true,
    });
  }

  async getTotalValueByOwner(userId: string): Promise<number> {
    const isopods = await this.isopodModel
      .find({ owner: new Types.ObjectId(userId), isAlive: true })
      .exec();
    return isopods.reduce((sum, iso) => sum + iso.sellPrice, 0);
  }

  async getHighestLevelByOwner(userId: string): Promise<number> {
    const isopod = await this.isopodModel
      .findOne({ owner: new Types.ObjectId(userId), isAlive: true })
      .sort({ level: -1 })
      .exec();
    return isopod ? isopod.level : 0;
  }
}
