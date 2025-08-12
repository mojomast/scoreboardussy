// Event store (append-only) and snapshots for durability. To be used together with live store (e.g., Redis).
import { PrismaClient } from '@prisma/client';
import { ScoreboardState } from '../../types/scoreboard.types';

export class PrismaEventStore {
  constructor(private prisma: PrismaClient) {}

  async appendEvent(roomId: string, type: string, payload: unknown) {
    await this.prisma.roomEvent.create({ data: { roomId, type, payload: payload as any } });
  }

  async writeSnapshot(roomId: string, version: number, state: ScoreboardState) {
    await this.prisma.roomSnapshot.create({ data: { roomId, version, state: state as any } });
  }

  async latestSnapshot(roomId: string) {
    return this.prisma.roomSnapshot.findFirst({ where: { roomId }, orderBy: { createdAt: 'desc' } });
  }

  async eventsSince(roomId: string, since: Date) {
    return this.prisma.roomEvent.findMany({ where: { roomId, createdAt: { gt: since } }, orderBy: { createdAt: 'asc' } });
  }
}
