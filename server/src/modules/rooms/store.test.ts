import { createRoom, findRoomByCode, cleanupExpiredRooms, importRoomsFromDb } from './store';

jest.mock('../db', () => ({
  prisma: {
    room: {
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('rooms store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createRoom generates a room with a 6-character code', async () => {
    const room = await createRoom();
    expect(room).toBeDefined();
    expect(room.code).toHaveLength(6);
    expect(room.secrets.referee).toBeDefined();
    expect(room.secrets.display).toBeDefined();
    expect(room.secrets.viewer).toBeDefined();
  });

  test('findRoomByCode returns the correct room', async () => {
    const room = await createRoom();
    const found = findRoomByCode(room.code);
    expect(found).toBeDefined();
    expect(found?.id).toBe(room.id);
    expect(findRoomByCode('UNKNOWN')).toBeUndefined();
  });

  test('cleanupExpiredRooms removes expired rooms', async () => {
    const room = await createRoom();
    // Manually expire the room
    (room as any).expiresAt = Date.now() - 1000;
    const cleaned = await cleanupExpiredRooms();
    expect(cleaned).toBeGreaterThanOrEqual(1);
    expect(findRoomByCode(room.code)).toBeUndefined();
  });

  test('importRoomsFromDb hydrates rooms from database rows', () => {
    importRoomsFromDb([
      { id: 'room-1', code: 'ABC123', createdAt: new Date() },
    ]);
    const found = findRoomByCode('ABC123');
    expect(found).toBeDefined();
    expect(found?.id).toBe('room-1');
  });
});
