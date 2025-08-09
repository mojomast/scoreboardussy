import { Router, Request, Response } from 'express';
import { createRoom, findRoomByCode, Role } from './store';
import { signRoomToken } from '../auth/tokens';

const router = Router();

// POST /api/rooms -> create a room and return URLs and join tokens
router.post('/', (req: Request, res: Response) => {
  const room = createRoom();
  const baseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '') || '';
  const mkUrl = (path: string) => (baseUrl ? `${baseUrl}${path}` : path);

  const payload = {
    room: {
      id: room.id,
      code: room.code,
    },
    urls: {
      display: mkUrl(`/room/${room.code}`),
      control: mkUrl(`/room/${room.code}#/control`),
    },
    tokens: {
      referee: signRoomToken({ roomId: room.id, role: 'referee' }),
      display: signRoomToken({ roomId: room.id, role: 'display' }),
      viewer: signRoomToken({ roomId: room.id, role: 'viewer' }),
    },
    secrets: {
      // For M1 convenience; in M2 we will not return secrets and will require server-minted tokens only
      referee: room.secrets.referee,
      display: room.secrets.display,
      viewer: room.secrets.viewer,
    },
  };
  res.json(payload);
});

// GET /api/rooms/:code -> resolve basic room info
router.get('/:code', (req: Request, res: Response) => {
  const room = findRoomByCode(req.params.code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ id: room.id, code: room.code, createdAt: room.createdAt });
});

export default router;
