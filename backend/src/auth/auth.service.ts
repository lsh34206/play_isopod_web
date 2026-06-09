import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { GameService } from '../game/game.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private gameService: GameService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(user: any) {
    // Update last login and login streak
    await this.usersService.updateLastLogin(user._id.toString());

    const payload = { username: user.username, sub: user._id.toString() };
    const token = this.jwtService.sign(payload);

    // Get or create game state
    let gameState = await this.gameService.getOrCreateGameState(user._id.toString());

    // Update login streak in game state
    await this.gameService.updateLoginStreak(user._id.toString());

    return {
      token,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if username already exists
    const existingUsername = await this.usersService.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 사용자명입니다.');
    }

    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      displayName: registerDto.displayName || registerDto.username,
    });

    // Create initial game state for the new user
    await this.gameService.createInitialGameState(user._id.toString());

    const payload = { username: user.username, sub: user._id.toString() };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }
    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }
}
