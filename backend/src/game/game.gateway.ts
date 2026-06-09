import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
@Injectable()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketUserMap = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => GameService)) private gameService: GameService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'isopod-game-secret-key-2024',
      });

      const userId = payload.sub;
      this.socketUserMap.set(client.id, userId);

      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId)!.add(client.id);

      // Auto-join user's personal room
      client.join(`user:${userId}`);
      client.emit('connected', { userId, socketId: client.id });

      // Send current game state
      const gameState = await this.gameService.getOrCreateGameState(userId);
      client.emit('game:state', gameState);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.socketUserMap.delete(client.id);
      const sockets = this.userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSocketMap.delete(userId);
        }
      }
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string },
  ) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      client.join(`user:${userId}`);
      const gameState = await this.gameService.getOrCreateGameState(userId);
      client.emit('game:state', gameState);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  // Emit to a specific user's room
  emitToUser(userId: string, event: string, data: any) {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  emitIsopodUpdate(userId: string, isopod: any) {
    this.emitToUser(userId, 'isopod:update', isopod);
  }

  emitBreedingComplete(userId: string, breeding: any) {
    this.emitToUser(userId, 'breeding:complete', breeding);
  }

  emitRankingUpdate(ranking: any[]) {
    this.server?.emit('ranking:update', ranking);
  }

  emitGameStateUpdate(userId: string, gameState: any) {
    this.emitToUser(userId, 'game:state', gameState);
  }

  // Called by cron from GameService
  async emitPeriodicUpdate() {
    // Emit a tick to all connected users so they know to refresh
    this.server?.emit('tick', { timestamp: Date.now() });
  }
}
